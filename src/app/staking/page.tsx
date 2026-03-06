'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '@/lib/wallet'
import { STAKING_CONTRACT, LAUNCH_CW20, LAUNCH_DECIMALS, AXM_DECIMALS } from '@/lib/staking/constants'
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

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

function formatNumber(n: number, decimals = 2): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(decimals)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(decimals)}K`
  return n.toFixed(decimals)
}

export default function StakingPage() {
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
      if (res.ok) {
        setStats(await res.json())
      }
    } catch {
      // Contract not yet deployed — show placeholder
    }
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
    } catch {
      // Contract not yet deployed
    }
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

  // Estimate APR (simple: last 30 days distributed * 12 / total staked * 100)
  // For now show "—" until we have enough data
  const estimatedApr = stats && stats.totalStaked > 0
    ? '—'
    : '—'

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/10 via-transparent to-transparent -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div {...fadeUp} className="text-center mb-10">
          <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20 mb-4">
            {contractReady ? 'Live' : 'Coming Soon'}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            LAUNCH Staking
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Stake LAUNCH tokens and earn a share of revenue from all ecosystem projects.
            Every commission distributed — proportional to your stake.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <StatCard label="Total Staked" value={stats ? `${formatNumber(stats.totalStaked)} LAUNCH` : '—'} color="violet" />
          <StatCard label="Total Distributed" value={stats ? `${formatNumber(stats.totalDistributed)} AXM` : '—'} color="blue" />
          <StatCard label="Stakers" value={stats ? stats.totalStakers.toString() : '—'} color="emerald" />
          <StatCard label="Est. APR" value={estimatedApr} color="amber" />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Stake/Unstake Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-gray-800">
                <button
                  onClick={() => setActiveTab('stake')}
                  className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                    activeTab === 'stake'
                      ? 'text-white bg-violet-500/10 border-b-2 border-violet-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Stake
                </button>
                <button
                  onClick={() => setActiveTab('unstake')}
                  className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                    activeTab === 'unstake'
                      ? 'text-white bg-violet-500/10 border-b-2 border-violet-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Unstake
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'stake' ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-gray-400">Amount to stake</label>
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

                    {!isConnected ? (
                      <p className="text-center text-sm text-gray-500 py-2">
                        Connect your wallet to stake
                      </p>
                    ) : !contractReady ? (
                      <p className="text-center text-sm text-amber-400/70 py-2">
                        Staking contract not yet deployed
                      </p>
                    ) : (
                      <button
                        onClick={handleStake}
                        disabled={!stakeAmount || parseFloat(stakeAmount) <= 0}
                        className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all"
                      >
                        Stake LAUNCH
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-gray-400">Amount to unstake</label>
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

                    {!isConnected ? (
                      <p className="text-center text-sm text-gray-500 py-2">
                        Connect your wallet to unstake
                      </p>
                    ) : !contractReady ? (
                      <p className="text-center text-sm text-amber-400/70 py-2">
                        Staking contract not yet deployed
                      </p>
                    ) : (
                      <button
                        onClick={handleUnstake}
                        disabled={!unstakeAmount || parseFloat(unstakeAmount) <= 0}
                        className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all"
                      >
                        Unstake LAUNCH
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* How it works */}
            <div className="mt-6 bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">How it works</h3>
              <div className="space-y-3">
                {[
                  { step: '1', title: 'Stake LAUNCH', desc: 'Send your LAUNCH tokens to the staking contract. No lock period — unstake anytime.' },
                  { step: '2', title: 'Earn Revenue Share', desc: 'Ecosystem projects (CoinFlip, etc.) distribute a portion of commissions to all stakers proportionally.' },
                  { step: '3', title: 'Claim AXM Rewards', desc: 'Accumulated AXM rewards can be claimed at any time. More LAUNCH staked = bigger share.' },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold flex items-center justify-center">
                      {item.step}
                    </span>
                    <div>
                      <p className="text-white font-medium text-sm">{item.title}</p>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: Your Position + Claim */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {/* Your Position */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-4">Your Position</h3>
              {!isConnected ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  Connect wallet to see your staking position
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Staked</p>
                    <p className="text-2xl font-bold text-white">
                      {userStaking ? formatNumber(userStaking.staked, 2) : '—'}
                      <span className="text-sm text-gray-400 ml-1">LAUNCH</span>
                    </p>
                  </div>
                  <div className="h-px bg-gray-800" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Pending Rewards</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      {userStaking ? formatNumber(userStaking.pendingRewards, 4) : '—'}
                      <span className="text-sm text-emerald-400/60 ml-1">AXM</span>
                    </p>
                  </div>
                  <div className="h-px bg-gray-800" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Claimed</p>
                    <p className="text-lg font-medium text-gray-300">
                      {userStaking ? formatNumber(userStaking.totalClaimed, 4) : '—'}
                      <span className="text-sm text-gray-500 ml-1">AXM</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Claim Button */}
            {isConnected && (
              <button
                onClick={handleClaim}
                disabled={!contractReady || !userStaking || userStaking.pendingRewards <= 0}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all"
              >
                Claim Rewards
              </button>
            )}

            {/* Revenue Sources */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Revenue Sources</h3>
              <div className="space-y-2">
                <RevenueSource name="Heads or Tails" share="2%" status="live" />
                <RevenueSource name="Future Projects" share="TBD" status="upcoming" />
              </div>
            </div>

            {/* Contract Info */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Contract</h3>
              {contractReady ? (
                <a
                  href={`https://axiomechain.org/contract/${STAKING_CONTRACT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-violet-400 hover:text-violet-300 break-all transition-colors"
                >
                  {STAKING_CONTRACT}
                </a>
              ) : (
                <p className="text-xs text-gray-500">Not yet deployed</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    violet: 'from-violet-500/10 to-violet-600/5 border-violet-500/20',
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20',
    amber: 'from-amber-500/10 to-amber-600/5 border-amber-500/20',
  }
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-4 text-center`}>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  )
}

function RevenueSource({ name, share, status }: { name: string; share: string; status: 'live' | 'upcoming' }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${status === 'live' ? 'bg-emerald-400' : 'bg-gray-600'}`} />
        <span className="text-sm text-gray-300">{name}</span>
      </div>
      <span className="text-sm font-medium text-white">{share}</span>
    </div>
  )
}
