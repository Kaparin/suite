'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface Change {
  id: string
  changeType: string
  oldValue: unknown
  newValue: unknown
  createdAt: string
  userId?: string
}

interface ChangeHistoryProps {
  changes: Change[]
}

const changeTypeIcons: Record<string, string> = {
  name: '✏️',
  descriptionShort: '📝',
  descriptionLong: '📄',
  links: '🔗',
  logo: '🖼️',
  tokenomics: '📊',
  status: '🔄',
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') {
    if (value.length > 80) return value.slice(0, 80) + '...'
    return value
  }
  if (typeof value === 'object') {
    const str = JSON.stringify(value)
    if (str.length > 80) return str.slice(0, 80) + '...'
    return str
  }
  return String(value)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export function ChangeHistory({ changes }: ChangeHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const t = useTranslations('changeHistory')

  if (!changes || changes.length === 0) return null

  const displayChanges = isExpanded ? changes : changes.slice(0, 3)

  return (
    <div className="bg-surface-1 border border-border rounded-[var(--radius-md)] overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h3 className="font-semibold text-text-primary">{t('title')}</h3>
          <span className="text-xs text-text-tertiary bg-surface-2 px-2 py-0.5 rounded-full">
            {changes.length}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="px-4 pb-4 space-y-2">
        {displayChanges.map((change) => (
          <div
            key={change.id}
            className="flex items-start gap-3 py-2 border-t border-border first:border-t-0"
          >
            <span className="text-base mt-0.5">
              {changeTypeIcons[change.changeType] || '🔧'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-secondary">
                  {t(`type.${change.changeType}`, { defaultValue: change.changeType })}
                </span>
                <span className="text-xs text-text-tertiary">
                  {timeAgo(change.createdAt)}
                </span>
              </div>
              {isExpanded && (
                <div className="mt-1 text-xs space-y-0.5">
                  <div className="text-[var(--danger)] opacity-70 line-through truncate">
                    {formatValue(change.oldValue)}
                  </div>
                  <div className="text-[var(--success)] opacity-70 truncate">
                    {formatValue(change.newValue)}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {!isExpanded && changes.length > 3 && (
          <p className="text-xs text-text-tertiary text-center pt-1">
            +{changes.length - 3} {t('more')}
          </p>
        )}
      </div>
    </div>
  )
}
