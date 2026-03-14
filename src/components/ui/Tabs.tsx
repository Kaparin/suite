'use client'

import { useRef, useEffect, useState } from 'react'

export interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
  variant?: 'default' | 'pills' | 'underline'
}

export function Tabs({ tabs, activeTab, onChange, className = '', variant = 'default' }: TabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    if (variant !== 'underline' || !tabsRef.current) return
    const activeEl = tabsRef.current.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      })
    }
  }, [activeTab, variant])

  if (variant === 'underline') {
    return (
      <div ref={tabsRef} className={`relative flex border-b border-border ${className}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === tab.id
                ? 'text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-accent/15 text-accent' : 'bg-surface-2 text-text-tertiary'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
        <div
          className="absolute bottom-0 h-0.5 bg-accent transition-all duration-200"
          style={indicatorStyle}
        />
      </div>
    )
  }

  if (variant === 'pills') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`chip ${activeTab === tab.id ? 'chip-active' : ''}`}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-surface-3'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    )
  }

  // Default — contained tabs
  return (
    <div className={`flex gap-1 p-1 bg-surface-1 border border-border rounded-[var(--radius-md)] ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-semibold transition-all duration-200 ${
            activeTab === tab.id
              ? 'bg-accent text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
          }`}
        >
          {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
          <span className="hidden sm:inline">{tab.label}</span>
          {tab.count !== undefined && (
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              activeTab === tab.id ? 'bg-white/20' : 'bg-surface-2'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
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
    <div className={`flex flex-col gap-0.5 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium transition-all duration-200 text-left ${
            activeTab === tab.id
              ? 'bg-accent/10 text-accent border-l-2 border-accent'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
          }`}
        >
          {tab.icon && <span className="w-5 h-5">{tab.icon}</span>}
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-auto px-1.5 py-0.5 rounded-full text-xs bg-surface-2 text-text-tertiary">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
