'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '@/lib/wallet'
import { STAKING_CONTRACT, LAUNCH_CW20, LAUNCH_DECIMALS } from '@/lib/staking/constants'
import { buildStakeLink, buildUnstakeLink, buildClaimLink } from '@/lib/staking/transactions'
import { axiomeClient } from '@/lib/axiome/client'

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

function formatNumber(n: number, decimals = 2): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(decimals)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(decimals)}K`
  return n.toFixed(decimals)
}

export function StakingTab() {
  const { isConnected, address } = useWallet()
  const [stats, setStats] = useState<StakingStats | null>(null)
  const [userStaking, setUserStaking] = useState<UserStaking | null>(null)
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake')
  const [isLoading, setIsLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/staking')
      if (res.ok) setStats(await res.json())
    } catch { /* contract not yet deployed */ }
  }, [])

  const fetchUserStaking = useCallback(async () => {
    if (!address) return
    try {
      const [stakingRes, launchBalance] = await Promise.all([
        fetch(`/api/staking/${address}`),
        axiomeClient.getCW20Balance(LAUNCH_CW20, address),
      ])
      if (stakingRes.ok) {
        const data = await stakingRes.json()
        setUserStaking({
          ...data,
          launchBalance: Number(launchBalance) / 10 ** LAUNCH_DECIMALS,
        })
      }
    } catch { /* contract not yet deployed */ }
  }, [address])

  useEffect(() => {
    setIsLoading(true)
    Promise.all([fetchStats(), fetchUserStaking()]).finally(() => setIsLoading(false))
  }, [fetchStats, fetchUserStaking])

  const contractReady = !!STAKING_CONTRACT

  const handleStake = () => {
    if (!address || !stakeAmount || !contractReady) return
    const microAmount = (parseFloat(stakeAmount) * 10 ** LAUNCH_DECIMALS).toFixed(0)
    window.location.href = buildStakeLink(address, microAmount)
  }

  const handleUnstake = () => {
    if (!address || !unstakeAmount || !contractReady) return
    const microAmount = (parseFloat(unstakeAmount) * 10 ** LAUNCH_DECIMALS).toFixed(0)
    window.location.href = buildUnstakeLink(address, microAmount)
  }

  const handleClaim = () => {
    if (!address || !contractReady) return
    window.location.href = buildClaimLink(address)
  }

  const handleMaxStake = () => {
    if (userStaking) setStakeAmount(userStaking.launchBalance.toString())
  }

  const handleMaxUnstake = () => {
    if (userStaking) setUnstakeAmount(userStaking.staked.toString())
  }

  if (!isConnected) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
        <div className="w-16 h-16 mx-auto bg-violet-500/20 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-gray-400">Connect your wallet to stake LAUNCH tokens</p>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">{stats ? `${formatNumber(stats.totalStaked)}` : '—'}</p>
          <p className="text-xs text-gray-400">Total Staked LAUNCH</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">{stats ? `${formatNumber(stats.totalDistributed)}` : '—'}</p>
          <p className="text-xs text-gray-400">Distributed AXM</p>
        </div>
      </div>

      {/* Your Position */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-400">Your Position</h3>
          {userStaking && userStaking.pendingRewards > 0 && (
            <button
              onClick={handleClaim}
              disabled={!contractReady}
              className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white rounded-lg transition-all"
            >
              Claim {formatNumber(userStaking.pendingRewards, 4)} AXM
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Staked</p>
            <p className="text-sm font-bold text-white">{userStaking ? formatNumber(userStaking.staked, 0) : '—'}</p>
            <p className="text-xs text-gray-500">LAUNCH</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Rewards</p>
            <p className="text-sm font-bold text-emerald-400">{userStaking ? formatNumber(userStaking.pendingRewards, 4) : '—'}</p>
            <p className="text-xs text-gray-500">AXM</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Claimed</p>
            <p className="text-sm font-bold text-gray-300">{userStaking ? formatNumber(userStaking.totalClaimed, 4) : '—'}</p>
            <p className="text-xs text-gray-500">AXM</p>
          </div>
        </div>
      </div>

      {/* Stake / Unstake Form */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('stake')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'stake'
                ? 'text-white bg-violet-500/10 border-b-2 border-violet-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Stake
          </button>
          <button
            onClick={() => setActiveTab('unstake')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'unstake'
                ? 'text-white bg-violet-500/10 border-b-2 border-violet-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Unstake
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'stake' ? (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-gray-400">Amount to stake</label>
                  <span className="text-xs text-gray-500">
                    Balance: {userStaking ? formatNumber(userStaking.launchBalance, 0) : '—'} LAUNCH
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={e => setStakeAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white text-lg placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                  <button
                    onClick={handleMaxStake}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-violet-400 hover:text-violet-300 bg-violet-500/10 rounded-md transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {!contractReady ? (
                <p className="text-center text-sm text-amber-400/70 py-2">Staking contract not yet deployed</p>
              ) : (
                <button
                  onClick={handleStake}
                  disabled={!stakeAmount || parseFloat(stakeAmount) <= 0}
                  className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all"
                >
                  Stake LAUNCH
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-gray-400">Amount to unstake</label>
                  <span className="text-xs text-gray-500">
                    Staked: {userStaking ? formatNumber(userStaking.staked, 0) : '—'} LAUNCH
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={unstakeAmount}
                    onChange={e => setUnstakeAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white text-lg placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                  <button
                    onClick={handleMaxUnstake}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-violet-400 hover:text-violet-300 bg-violet-500/10 rounded-md transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {!contractReady ? (
                <p className="text-center text-sm text-amber-400/70 py-2">Staking contract not yet deployed</p>
              ) : (
                <button
                  onClick={handleUnstake}
                  disabled={!unstakeAmount || parseFloat(unstakeAmount) <= 0}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all"
                >
                  Unstake LAUNCH
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Revenue Sources */}
      <div className="bg-gray-800/30 border border-gray-800 rounded-xl p-4">
        <h3 className="text-xs font-medium text-gray-400 mb-2">Revenue Sources</h3>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-sm text-gray-300">Heads or Tails</span>
            </div>
            <span className="text-sm font-medium text-white">2%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-600" />
              <span className="text-sm text-gray-300">Future Projects</span>
            </div>
            <span className="text-sm font-medium text-gray-500">TBD</span>
          </div>
        </div>
      </div>

      {/* Contract Info */}
      {contractReady && (
        <div className="text-center">
          <a
            href={`https://axiomechain.org/contract/${STAKING_CONTRACT}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-violet-400/60 hover:text-violet-400 transition-colors"
          >
            Contract: {STAKING_CONTRACT.slice(0, 16)}...{STAKING_CONTRACT.slice(-8)}
          </a>
        </div>
      )}
    </motion.div>
  )
}
