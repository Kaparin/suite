'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
// Inline SVG icon components (lucide-react not available in suite-app)
function Loader2({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
function ExternalLink({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}
function RefreshCw({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}
function Coins({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18" /><path d="M7 6h1v4" /><path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  )
}
function TrendingUp({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
    </svg>
  )
}
function Users({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
import { useWallet, useTransaction } from '@/lib/wallet'
import { buildExecutePayload } from '@/lib/wallet/transaction-builder'
import { SignTransactionFlow } from '@/components/wallet'
import { STAKING_CONTRACT, LAUNCH_CW20, LAUNCH_DECIMALS } from '@/lib/staking/constants'

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
  const [stats, setStats] = useState<StakingStats | null>(null)
  const [userStaking, setUserStaking] = useState<UserStaking | null>(null)
  const [amount, setAmount] = useState('')
  const [activeTab, setActiveTab] = useState<TabMode>('stake')
  const [isLoading, setIsLoading] = useState(true)

  const snapshotRef = useRef<UserStaking | null>(null)

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

  const refreshData = useCallback(async () => {
    await Promise.all([fetchStats(), fetchUserStaking()])
  }, [fetchStats, fetchUserStaking])

  useEffect(() => {
    setIsLoading(true)
    refreshData().finally(() => setIsLoading(false))
  }, [refreshData])

  const contractReady = !!STAKING_CONTRACT

  const makeCheckTransaction = useCallback((
    type: 'stake' | 'unstake' | 'claim'
  ) => {
    return async (): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      if (!address) return { success: false, error: 'No address' }
      try {
        const res = await fetch(`/api/staking/${address}`)
        if (!res.ok) return { success: false }
        const current = await res.json() as UserStaking
        const prev = snapshotRef.current
        if (!prev) return { success: false }
        switch (type) {
          case 'stake':
            if (current.staked > prev.staked) { setUserStaking(current); return { success: true } }
            break
          case 'unstake':
            if (current.staked < prev.staked) { setUserStaking(current); return { success: true } }
            break
          case 'claim':
            if (current.totalClaimed > prev.totalClaimed || current.pendingRewards < prev.pendingRewards) { setUserStaking(current); return { success: true } }
            break
        }
        return { success: false }
      } catch { return { success: false } }
    }
  }, [address])

  const handleStake = () => {
    if (!address || !amount || !contractReady) return
    const num = parseFloat(amount)
    if (num <= 0 || (userStaking && num > userStaking.launchBalance)) return
    const microAmount = (num * 10 ** LAUNCH_DECIMALS).toFixed(0)
    snapshotRef.current = userStaking ? { ...userStaking } : null
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
      onSuccess: () => { setAmount(''); refreshData() },
      checkTransaction: makeCheckTransaction('stake'),
    })
  }

  const handleUnstake = () => {
    if (!address || !amount || !contractReady) return
    const num = parseFloat(amount)
    if (num <= 0 || (userStaking && num > userStaking.staked)) return
    const microAmount = (num * 10 ** LAUNCH_DECIMALS).toFixed(0)
    snapshotRef.current = userStaking ? { ...userStaking } : null
    const payload = buildExecutePayload({
      contractAddress: STAKING_CONTRACT,
      sender: address,
      msg: { unstake: { amount: microAmount } },
    })
    openTransaction({
      payload,
      title: 'Unstake LAUNCH',
      description: `Unstake ${amount} LAUNCH tokens`,
      onSuccess: () => { setAmount(''); refreshData() },
      checkTransaction: makeCheckTransaction('unstake'),
    })
  }

  const handleClaim = () => {
    if (!address || !contractReady) return
    snapshotRef.current = userStaking ? { ...userStaking } : null
    const payload = buildExecutePayload({
      contractAddress: STAKING_CONTRACT,
      sender: address,
      msg: { claim: {} },
    })
    openTransaction({
      payload,
      title: 'Claim Rewards',
      description: `Claim ${userStaking ? formatNumber(userStaking.pendingRewards, 4) : ''} AXM rewards`,
      onSuccess: () => { refreshData() },
      checkTransaction: makeCheckTransaction('claim'),
    })
  }

  const maxAmount = activeTab === 'stake' ? userStaking?.launchBalance ?? 0 : userStaking?.staked ?? 0

  const setPercent = (pct: number) => {
    if (maxAmount <= 0) return
    const val = maxAmount * pct
    setAmount(pct === 1 ? maxAmount.toString() : Math.floor(val).toString())
  }

  const canSubmit = amount && parseFloat(amount) > 0 && parseFloat(amount) <= maxAmount && contractReady

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
                className="shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
              >
                Claim Rewards
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
            <button type="button" onClick={() => { setIsLoading(true); refreshData().finally(() => setIsLoading(false)) }}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 transition-colors">
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
      <div className="rounded-2xl border border-gray-700/50 bg-gray-900/50 overflow-hidden">
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
          <span className="text-gray-500">Revenue source: 2% per pot</span>
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
        onClose={closeTransaction}
        deepLink={transactionState.deepLink}
        title={transactionState.title}
        description={transactionState.description}
        onSuccess={transactionState.onSuccess}
        checkTransaction={transactionState.checkTransaction}
      />
    </motion.div>
  )
}
