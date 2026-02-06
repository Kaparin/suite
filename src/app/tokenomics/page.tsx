'use client'

import { useState } from 'react'
import Link from 'next/link'

const TOKEN_CONTRACT = 'axm1zvjnc08uy0zz43m0nlh9f5aetpa3amn6a034yqvmsgvzshk9clds375xx9'
const TOTAL_SUPPLY = 100_000_000

const distribution = [
  { name: 'Team & Development', percentage: 15, amount: 15_000_000, color: '#8B5CF6', locked: true, vesting: '12-month linear' },
  { name: 'Marketing & Partners', percentage: 10, amount: 10_000_000, color: '#EC4899', locked: true, vesting: 'Strategic unlocks' },
  { name: 'Platform Reserve', percentage: 20, amount: 20_000_000, color: '#3B82F6', locked: true, vesting: 'DAO governance' },
  { name: 'Staking Rewards', percentage: 15, amount: 15_000_000, color: '#10B981', locked: true, vesting: '~3 year emission' },
  { name: 'Community Airdrop', percentage: 5, amount: 5_000_000, color: '#F59E0B', locked: false, vesting: 'Immediate' },
  { name: 'DEX Liquidity', percentage: 15, amount: 15_000_000, color: '#06B6D4', locked: false, vesting: 'Permanent pool' },
  { name: 'Public Sale', percentage: 20, amount: 20_000_000, color: '#EF4444', locked: false, vesting: 'Immediate' },
]

const utilities = [
  { service: 'Premium Subscription', cost: '100 LAUNCH/month', description: 'Access to advanced AI features, priority support, extended limits' },
  { service: 'Project Verification', cost: '1,000 LAUNCH deposit', description: 'Get "Verified" badge, build trust with community' },
  { service: 'Project Promotion', cost: 'from 500 LAUNCH', description: 'Featured placement in explorer and homepage' },
  { service: 'Airdrop Tool', cost: '1% service fee', description: 'Mass distribute tokens to your community' },
]

const roadmap = [
  { phase: 'Phase 1', title: 'Foundation', items: ['Token deployment', 'Vesting contracts', 'Tokenomics page'], status: 'current' },
  { phase: 'Phase 2', title: 'Liquidity', items: ['DEX listing', 'LAUNCH/AXM pair', 'Price discovery'], status: 'upcoming' },
  { phase: 'Phase 3', title: 'Utility', items: ['Premium in LAUNCH', 'Verification system', 'Burn activation'], status: 'upcoming' },
  { phase: 'Phase 4', title: 'Community', items: ['Airdrop distribution', 'Staking launch', 'Governance'], status: 'upcoming' },
  { phase: 'Phase 5', title: 'Growth', items: ['Launchpad', 'Cross-chain bridge', 'CEX listings'], status: 'future' },
]

function formatNumber(num: number): string {
  return num.toLocaleString('en-US')
}

function PieChart({ data }: { data: typeof distribution }) {
  let cumulativePercentage = 0

  return (
    <div className="relative w-64 h-64 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
        {data.map((item, index) => {
          const startAngle = cumulativePercentage * 3.6
          cumulativePercentage += item.percentage
          const endAngle = cumulativePercentage * 3.6

          const startRad = (startAngle * Math.PI) / 180
          const endRad = (endAngle * Math.PI) / 180

          const x1 = 50 + 40 * Math.cos(startRad)
          const y1 = 50 + 40 * Math.sin(startRad)
          const x2 = 50 + 40 * Math.cos(endRad)
          const y2 = 50 + 40 * Math.sin(endRad)

          const largeArc = item.percentage > 50 ? 1 : 0

          return (
            <path
              key={index}
              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={item.color}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
          )
        })}
        <circle cx="50" cy="50" r="25" fill="#1a1a2e" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">100M</div>
          <div className="text-xs text-zinc-400">LAUNCH</div>
        </div>
      </div>
    </div>
  )
}

export default function TokenomicsPage() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const lockedAmount = distribution.filter(d => d.locked).reduce((sum, d) => sum + d.amount, 0)
  const circulatingAmount = distribution.filter(d => !d.locked).reduce((sum, d) => sum + d.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a12] to-[#1a1a2e]">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            Axiome Launch Suite
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/explorer" className="text-zinc-400 hover:text-white transition-colors">
              Explorer
            </Link>
            <Link href="/studio" className="text-zinc-400 hover:text-white transition-colors">
              Studio
            </Link>
            <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
            <span className="text-violet-400 text-sm font-medium">$LAUNCH Token</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Tokenomics
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Transparent token economics designed for long-term sustainability and community growth
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-white mb-1">100M</div>
            <div className="text-sm text-zinc-400">Total Supply</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-violet-400 mb-1">60%</div>
            <div className="text-sm text-zinc-400">Locked</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-emerald-400 mb-1">40%</div>
            <div className="text-sm text-zinc-400">Circulating</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-orange-400 mb-1">0</div>
            <div className="text-sm text-zinc-400">Burned</div>
          </div>
        </div>

        {/* Distribution */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Token Distribution</h2>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Pie Chart */}
            <div>
              <PieChart data={distribution} />
            </div>

            {/* Legend */}
            <div className="space-y-3">
              {distribution.map((item) => (
                <div
                  key={item.name}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    hoveredItem === item.name ? 'bg-zinc-800' : 'bg-zinc-900/50'
                  }`}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <div className="text-white font-medium flex items-center gap-2">
                        {item.name}
                        {item.locked && (
                          <span className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded">
                            Locked
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500">{item.vesting}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">{item.percentage}%</div>
                    <div className="text-xs text-zinc-500">{formatNumber(item.amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Locked vs Circulating */}
        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Locked Tokens</h3>
                  <p className="text-sm text-zinc-400">60% of total supply</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-violet-400 mb-2">
                {formatNumber(lockedAmount)} LAUNCH
              </div>
              <p className="text-sm text-zinc-400">
                Team tokens, platform reserve, and staking rewards are locked in smart contracts with vesting schedules.
              </p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Circulating Supply</h3>
                  <p className="text-sm text-zinc-400">40% of total supply</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-emerald-400 mb-2">
                {formatNumber(circulatingAmount)} LAUNCH
              </div>
              <p className="text-sm text-zinc-400">
                Available for trading, airdrops, and ecosystem participation. Includes DEX liquidity and public sale allocation.
              </p>
            </div>
          </div>
        </section>

        {/* Token Utility */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Token Utility</h2>

          <div className="grid md:grid-cols-2 gap-4">
            {utilities.map((item) => (
              <div key={item.service} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">{item.service}</h3>
                  <span className="text-sm px-3 py-1 bg-violet-500/20 text-violet-400 rounded-full">
                    {item.cost}
                  </span>
                </div>
                <p className="text-zinc-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/20 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Coming Soon</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center text-violet-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-zinc-300">Staking Rewards</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center text-pink-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-zinc-300">DAO Governance</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="text-zinc-300">Launchpad Access</span>
              </div>
            </div>
          </div>
        </section>

        {/* Burn Mechanism */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Value Mechanics</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Burn Mechanism</h3>
              </div>
              <p className="text-zinc-400 text-sm mb-4">
                50% of all platform revenue is used to buy back and burn LAUNCH tokens, permanently reducing supply.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Premium subscriptions</span>
                  <span className="text-orange-400">50% burned</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Promotion fees</span>
                  <span className="text-orange-400">50% burned</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">NFT minting</span>
                  <span className="text-orange-400">100% burned</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Revenue Distribution</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400">Burn</span>
                    <span className="text-white">50%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: '50%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400">Treasury</span>
                    <span className="text-white">30%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '30%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400">Team</span>
                    <span className="text-white">20%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: '20%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Roadmap</h2>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-zinc-800 transform md:-translate-x-1/2" />

            <div className="space-y-8">
              {roadmap.map((phase, index) => (
                <div key={phase.phase} className={`relative flex items-start gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Dot */}
                  <div className={`absolute left-4 md:left-1/2 w-4 h-4 rounded-full transform -translate-x-1/2 ${
                    phase.status === 'current' ? 'bg-violet-500 ring-4 ring-violet-500/20' :
                    phase.status === 'upcoming' ? 'bg-zinc-600' : 'bg-zinc-800'
                  }`} />

                  {/* Content */}
                  <div className={`ml-12 md:ml-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${
                      phase.status === 'current' ? 'bg-violet-500/20 text-violet-400' :
                      phase.status === 'upcoming' ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-900 text-zinc-500'
                    }`}>
                      {phase.phase}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{phase.title}</h3>
                    <ul className={`space-y-1 text-sm text-zinc-400 ${index % 2 === 0 ? 'md:text-right' : ''}`}>
                      {phase.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="hidden md:block md:w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contract Info */}
        <section className="mb-16">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Contract Information</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-zinc-400 mb-1">Token Contract (CW20)</div>
                <div className="flex items-center gap-2">
                  <code className="text-sm text-violet-400 bg-zinc-800 px-3 py-2 rounded-lg flex-1 overflow-x-auto">
                    {TOKEN_CONTRACT}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(TOKEN_CONTRACT)}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <a
                  href={`https://axiomechain.org/contract/${TOKEN_CONTRACT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View on Explorer
                </a>
                <a
                  href={`/t/${TOKEN_CONTRACT}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Token Page
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section>
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 text-center">
            <p className="text-sm text-zinc-500">
              This document is for informational purposes only. Token economics may be adjusted based on market conditions and community governance decisions. Always do your own research before participating in any cryptocurrency project.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-zinc-500 text-sm">
          <p>&copy; 2026 Axiome Launch Suite. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
