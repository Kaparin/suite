'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2, ExternalLink, RefreshCw, Coins, TrendingUp, Users, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { useWallet, useTransaction } from '@/lib/wallet'
import { buildExecutePayload } from '@/lib/wallet/transaction-builder'
import { SignTransactionFlow } from '@/components/wallet'
import { STAKING_CONTRACT, LAUNCH_CW20, LAUNCH_DECIMALS } from '@/lib/staking/constants'
import { useStakingStore, type OpType } from '@/stores/staking-store'

const EXPLORER_URL = 'https://explorer.axiome.pro'

interface StakingStats {
  totalStaked: number
  totalDistributed: number
  totalClaimed: number
  totalStakers: number
  axmBalance: number
}

interface UserStaking {
  staked: number
  pendingRewards: number
  totalClaimed: number
  launchBalance: number
}

type TabMode = 'stake' | 'unstake'

function formatNumber(n: number, decimals = 2): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(decimals)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(decimals)}K`
  return n.toFixed(decimals)
}

export function StakingTab() {
  const { isConnected, address } = useWallet()
  const { transactionState, closeTransaction, openTransaction } = useTransaction()
  const store = useStakingStore()

  const [stats, setStats] = useState<StakingStats | null>(null)
  const [userStaking, setUserStaking] = useState<UserStaking | null>(null)
  const [amount, setAmount] = useState('')
  const [activeTab, setActiveTab] = useState<TabMode>('stake')
  const [isLoading, setIsLoading] = useState(true)

  // Track previous op to detect completion (op → null transition)
  const prevOpRef = useRef(store.op)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/staking')
      if (res.ok) setStats(await res.json())
    } catch { /* contract not yet deployed */ }
  }, [])

  const fetchUserStaking = useCallback(async () => {
    if (!address) return null
    try {
      const res = await fetch(`/api/staking/${address}`)
      if (res.ok) {
        const data = await res.json()
        setUserStaking(data)
        return data as UserStaking
      }
    } catch { /* contract not yet deployed */ }
    return null
  }, [address])

  const refreshData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      await Promise.all([fetchStats(), fetchUserStaking()])
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [fetchStats, fetchUserStaking])

  // Initial load
  useEffect(() => {
    setIsLoading(true)
    refreshData().finally(() => setIsLoading(false))
  }, [refreshData])

  // When op clears (pending/error → null), wait 2s then silent refresh
  useEffect(() => {
    const prevOp = prevOpRef.current
    prevOpRef.current = store.op

    if (prevOp && !store.op) {
      const timer = setTimeout(() => refreshData(true), 2_000)
      return () => clearTimeout(timer)
    }
  }, [store.op, refreshData])

  // Optimistic updates
  const applyOptimistic = (type: OpType, amt?: number) => {
    setUserStaking((prev) => {
      if (!prev) return prev
      if (type === 'claim') return { ...prev, pendingRewards: 0 }
      if (type === 'stake' && amt) {
        return { ...prev, launchBalance: Math.max(0, prev.launchBalance - amt), staked: prev.staked + amt }
      }
      if (type === 'unstake' && amt) {
        return { ...prev, staked: Math.max(0, prev.staked - amt), launchBalance: prev.launchBalance + amt }
      }
      return prev
    })
  }

  const contractReady = !!STAKING_CONTRACT

  const maxAmount = activeTab === 'stake' ? userStaking?.launchBalance ?? 0 : userStaking?.staked ?? 0
  const canSubmit = !store.isLocked && amount && parseFloat(amount) > 0 && parseFloat(amount) <= maxAmount && contractReady
  const canClaim = !store.isLocked && !!userStaking && userStaking.pendingRewards > 0

  const handleStake = () => {
    if (!address || !amount || !contractReady || store.isLocked) return
    const num = parseFloat(amount)
    if (num <= 0 || (userStaking && num > userStaking.launchBalance)) return
    const microAmount = (num * 10 ** LAUNCH_DECIMALS).toFixed(0)

    store.startOp('stake', num)

    const payload = buildExecutePayload({
      contractAddress: LAUNCH_CW20,
      sender: address,
      msg: {
        send: {
          contract: STAKING_CONTRACT,
          amount: microAmount,
          msg: btoa(JSON.stringify({ stake: {} })),
        },
      },
    })
    openTransaction({
      payload,
      title: 'Stake LAUNCH',
      description: `Stake ${amount} LAUNCH tokens`,
      onSuccess: (txHash) => {
        store.setPending(txHash)
        setAmount('')
        applyOptimistic('stake', num)
      },
    })
  }

  const handleUnstake = () => {
    if (!address || !amount || !contractReady || store.isLocked) return
    const num = parseFloat(amount)
    if (num <= 0 || (userStaking && num > userStaking.staked)) return
    const microAmount = (num * 10 ** LAUNCH_DECIMALS).toFixed(0)

    store.startOp('unstake', num)

    const payload = buildExecutePayload({
      contractAddress: STAKING_CONTRACT,
      sender: address,
      msg: { unstake: { amount: microAmount } },
    })
    openTransaction({
      payload,
      title: 'Unstake LAUNCH',
      description: `Unstake ${amount} LAUNCH tokens`,
      onSuccess: (txHash) => {
        store.setPending(txHash)
        setAmount('')
        applyOptimistic('unstake', num)
      },
    })
  }

  const handleClaim = () => {
    if (!address || !contractReady || store.isLocked) return

    store.startOp('claim')

    const payload = buildExecutePayload({
      contractAddress: STAKING_CONTRACT,
      sender: address,
      msg: { claim: {} },
    })
    openTransaction({
      payload,
      title: 'Claim Rewards',
      description: `Claim ${userStaking ? formatNumber(userStaking.pendingRewards, 4) : ''} AXM rewards`,
      onSuccess: (txHash) => {
        store.setPending(txHash)
        applyOptimistic('claim')
      },
    })
  }

  // Handle modal close — clear op if not successful
  const handleCloseTransaction = useCallback(() => {
    closeTransaction()
    // If op is in signing phase (user closed without completing), clear it
    if (store.op?.phase === 'signing') {
      store.setError('Cancelled')
    }
  }, [closeTransaction, store])

  const setPercent = (pct: number) => {
    if (maxAmount <= 0) return
    const val = maxAmount * pct
    setAmount(pct === 1 ? maxAmount.toString() : Math.floor(val).toString())
  }

  if (!isConnected) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
          <Coins size={24} className="text-violet-400" />
        </div>
        <p className="text-gray-400">Connect your wallet to stake LAUNCH tokens</p>
      </motion.div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={28} className="animate-spin text-violet-400" />
      </div>
    )
  }

  if (!stats) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-10">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
          <Coins size={24} className="text-violet-400" />
        </div>
        <p className="text-sm text-gray-400 mb-1">LAUNCH Staking</p>
        <p className="text-xs text-gray-500 mb-4">Staking contract unavailable</p>
        <button type="button" onClick={() => { setIsLoading(true); refreshData().finally(() => setIsLoading(false)) }}
          className="text-xs text-violet-400 hover:underline">
          Retry
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* === Operation Status Banner === */}
      <OperationBanner store={store} />

      {/* === Rewards Card === */}
      {userStaking && userStaking.pendingRewards > 0 ? (
        <div className="relative overflow-hidden rounded-2xl p-[1px]">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/40 via-teal-500/20 to-emerald-500/5" />
          <div className="relative rounded-2xl bg-gray-900/95 backdrop-blur-sm px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-emerald-400/70 mb-0.5">Pending Rewards</p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-2xl font-bold text-emerald-400 tabular-nums">{formatNumber(userStaking.pendingRewards, 4)}</p>
                  <p className="text-xs text-emerald-400/60 font-medium">AXM</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClaim}
                disabled={!canClaim}
                className="shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
              >
                {store.op?.type === 'claim' && store.op.phase !== 'error' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  'Claim Rewards'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : userStaking ? (
        <div className="rounded-2xl border border-gray-700/50 bg-gray-900/50 px-4 py-3 text-center">
          <p className="text-xs text-gray-500">No pending rewards yet</p>
        </div>
      ) : null}

      {/* === Your Position === */}
      {userStaking && (
        <div className="rounded-2xl border border-gray-700/50 bg-gray-900/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Your Position</p>
            <button type="button" onClick={() => { if (!store.isLocked) refreshData(true) }}
              disabled={store.isLocked}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 transition-colors disabled:opacity-30">
              <RefreshCw size={12} />
            </button>
          </div>
          <div className="grid grid-cols-3 divide-x divide-gray-700/50 px-1 pb-3">
            <div className="text-center px-2">
              <p className="text-lg font-bold tabular-nums text-white">{formatNumber(userStaking.staked, 0)}</p>
              <p className="text-[10px] text-gray-500">LAUNCH staked</p>
            </div>
            <div className="text-center px-2">
              <p className="text-lg font-bold text-emerald-400 tabular-nums">{formatNumber(userStaking.pendingRewards, 4)}</p>
              <p className="text-[10px] text-gray-500">AXM rewards</p>
            </div>
            <div className="text-center px-2">
              <p className="text-lg font-bold text-gray-400 tabular-nums">{formatNumber(userStaking.totalClaimed, 4)}</p>
              <p className="text-[10px] text-gray-500">AXM claimed</p>
            </div>
          </div>
        </div>
      )}

      {/* === Stake / Unstake === */}
      <div className={`rounded-2xl border border-gray-700/50 bg-gray-900/50 overflow-hidden transition-opacity ${store.isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Tab Pills */}
        <div className="flex gap-1 p-1.5 bg-gray-800/50">
          <button
            type="button"
            onClick={() => { setActiveTab('stake'); setAmount('') }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'stake'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Stake
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('unstake'); setAmount('') }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'unstake'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Unstake
          </button>
        </div>

        <div className="px-4 py-4 space-y-3">
          {/* Balance */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">
              {activeTab === 'stake' ? 'Available to stake' : 'Staked amount'}
            </span>
            <span className="text-[11px] font-bold tabular-nums text-white">
              {userStaking ? formatNumber(maxAmount, 0) : '\u2014'} LAUNCH
            </span>
          </div>

          {/* Input */}
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3.5 pr-16 text-xl font-bold text-white placeholder-gray-600 focus:border-violet-500/50 focus:outline-none transition-colors tabular-nums"
            />
            <button
              type="button"
              onClick={() => setPercent(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-violet-500/15 px-2.5 py-1 text-[10px] font-bold text-violet-400 hover:bg-violet-500/25 transition-colors"
            >
              MAX
            </button>
          </div>

          {/* Percent Buttons */}
          <div className="flex gap-2">
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setPercent(pct)}
                className="flex-1 py-1.5 rounded-lg border border-gray-700 text-[10px] font-bold text-gray-400 hover:border-violet-500/40 hover:text-violet-400 transition-colors"
              >
                {pct === 1 ? 'MAX' : `${pct * 100}%`}
              </button>
            ))}
          </div>

          {/* Submit */}
          {!contractReady ? (
            <p className="text-center text-sm text-amber-400/70 py-2">Staking contract not yet deployed</p>
          ) : (
            <button
              type="button"
              onClick={activeTab === 'stake' ? handleStake : handleUnstake}
              disabled={!canSubmit}
              className={`w-full rounded-xl py-3.5 text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                activeTab === 'stake'
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/20'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-500/20'
              }`}
            >
              {activeTab === 'stake' ? 'Stake LAUNCH' : 'Unstake LAUNCH'}
            </button>
          )}
        </div>
      </div>

      {/* === Protocol Stats === */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 px-3 py-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Coins size={10} className="text-violet-400" />
            <p className="text-[9px] uppercase tracking-wider text-gray-500">Total Staked</p>
          </div>
          <p className="text-sm font-bold tabular-nums text-white">{formatNumber(stats.totalStaked)}</p>
          <p className="text-[9px] text-gray-500">LAUNCH</p>
        </div>
        <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 px-3 py-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp size={10} className="text-emerald-400" />
            <p className="text-[9px] uppercase tracking-wider text-gray-500">Distributed</p>
          </div>
          <p className="text-sm font-bold text-emerald-400 tabular-nums">{formatNumber(stats.totalDistributed)}</p>
          <p className="text-[9px] text-gray-500">AXM</p>
        </div>
        <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 px-3 py-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users size={10} className="text-blue-400" />
            <p className="text-[9px] uppercase tracking-wider text-gray-500">Stakers</p>
          </div>
          <p className="text-sm font-bold tabular-nums text-white">{stats.totalStakers}</p>
        </div>
      </div>

      {/* Revenue + Contract */}
      <div className="flex items-center justify-between text-[10px] px-1">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-gray-500">Revenue source: 20% of commission</span>
        </div>
        {contractReady && (
          <a
            href={`${EXPLORER_URL}/contract/${STAKING_CONTRACT}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-violet-400/40 hover:text-violet-400 transition-colors"
          >
            {STAKING_CONTRACT.slice(0, 8)}...{STAKING_CONTRACT.slice(-4)}
            <ExternalLink size={9} />
          </a>
        )}
      </div>

      {/* Sign Transaction Modal */}
      <SignTransactionFlow
        isOpen={transactionState.isOpen}
        onClose={handleCloseTransaction}
        deepLink={transactionState.deepLink}
        signingCode={transactionState.signingCode}
        connectToken={transactionState.connectToken}
        title={transactionState.title}
        description={transactionState.description}
        onSuccess={transactionState.onSuccess}
        checkTransaction={transactionState.checkTransaction}
      />
    </motion.div>
  )
}

// === Operation Status Banner ===
// Shows current operation phase with live elapsed timer

function OperationBanner({ store }: { store: ReturnType<typeof useStakingStore> }) {
  const { op } = store

  // Force re-render every second while op is active (for elapsed timer)
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!op) return
    const interval = setInterval(() => setTick((n) => n + 1), 1_000)
    return () => clearInterval(interval)
  }, [op])

  if (!op) return null

  const typeLabel =
    op.type === 'stake' ? 'Stake' :
    op.type === 'unstake' ? 'Unstake' :
    'Claim'

  const elapsed = Math.floor((Date.now() - op.startedAt) / 1000)

  // Signing phase — waiting for user to confirm in wallet
  if (op.phase === 'signing') {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-violet-500/[0.08] border border-violet-500/20 px-4 py-3">
        <Loader2 size={18} className="animate-spin text-violet-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-violet-300">
            {typeLabel}{op.amount ? ` ${op.amount} LAUNCH` : ''}
          </p>
          <p className="text-[10px] text-violet-400/60">
            Waiting for wallet confirmation...
            {elapsed > 2 && <span className="ml-1 tabular-nums">{elapsed}s</span>}
          </p>
        </div>
      </div>
    )
  }

  // Pending — tx in mempool, waiting for chain confirmation
  if (op.phase === 'pending') {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/20 px-4 py-3">
        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-emerald-300">
            {typeLabel}{op.amount ? ` ${op.amount} LAUNCH` : ''} — Confirmed
          </p>
          {op.txHash && (
            <a
              href={`${EXPLORER_URL}/transactions/${op.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-emerald-400/50 hover:text-emerald-400 inline-flex items-center gap-1 transition-colors"
            >
              {op.txHash.slice(0, 12)}...
              <ExternalLink size={9} />
            </a>
          )}
        </div>
        <Loader2 size={14} className="animate-spin text-emerald-400/40 shrink-0" />
      </div>
    )
  }

  // Error
  if (op.phase === 'error') {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-red-500/[0.08] border border-red-500/20 px-4 py-3">
        <AlertCircle size={18} className="text-red-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-red-300">
            {typeLabel} — Error
          </p>
          <p className="text-[10px] text-red-400/70">{op.error}</p>
        </div>
        <button
          type="button"
          onClick={() => store.clearOp()}
          className="rounded-lg p-1.5 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    )
  }

  return null
}
