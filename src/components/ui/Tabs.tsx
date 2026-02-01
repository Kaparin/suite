'use client'

import { motion } from 'framer-motion'

export interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex gap-1 p-1 bg-gray-800/50 rounded-xl ${className}`}>
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
          <span className="hidden sm:inline">{tab.label}</span>
        </motion.button>
      ))}
    </div>
  )
}

// Vertical tabs variant for sidebar layouts
interface VerticalTabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export function VerticalTabs({ tabs, activeTab, onChange, className = '' }: VerticalTabsProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${
            activeTab === tab.id
              ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white border-l-2 border-purple-500'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          {tab.icon && <span className="w-5 h-5">{tab.icon}</span>}
          {tab.label}
        </motion.button>
      ))}
    </div>
  )
}
