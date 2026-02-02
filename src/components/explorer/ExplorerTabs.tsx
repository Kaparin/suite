'use client'

import { motion } from 'framer-motion'

interface ExplorerTabsProps {
  activeTab: 'live' | 'upcoming'
  onTabChange: (tab: 'live' | 'upcoming') => void
  liveCounts?: {
    all: number
    new: number
    verified: number
    trending: number
  }
  upcomingCounts?: {
    all: number
    upcoming: number
    presale: number
  }
}

export function ExplorerTabs({
  activeTab,
  onTabChange,
  liveCounts,
  upcomingCounts
}: ExplorerTabsProps) {
  const tabs = [
    {
      id: 'live' as const,
      label: 'Live',
      count: liveCounts?.all || 0,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      ),
      description: 'Tokens on blockchain'
    },
    {
      id: 'upcoming' as const,
      label: 'Upcoming',
      count: upcomingCounts?.all || 0,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      description: 'Coming soon'
    }
  ]

  return (
    <div className="flex gap-2 p-1 bg-gray-800/50 rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id
                  ? 'bg-purple-500/30 text-purple-300'
                  : 'bg-gray-700 text-gray-400'
              }`}>
                {tab.count}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  )
}
