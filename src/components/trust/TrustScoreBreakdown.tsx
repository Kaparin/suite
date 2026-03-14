'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { TrustScoreBadge } from './TrustScoreBadge'

interface TrustScoreData {
  totalScore: number
  rating: string
  verificationScore: number
  liquidityScore: number
  holderScore: number
  activityScore: number
  contractScore: number
  communityScore: number
  calculatedAt: string
}

interface TrustScoreBreakdownProps {
  data: TrustScoreData
}

function ScoreBar({ label, score, icon }: { label: string; score: number; icon: string }) {
  const getBarColor = (s: number) => {
    if (s >= 80) return 'bg-emerald-400'
    if (s >= 60) return 'bg-blue-400'
    if (s >= 40) return 'bg-yellow-400'
    if (s >= 20) return 'bg-orange-400'
    return 'bg-red-400'
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-base w-6 text-center">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-text-secondary">{label}</span>
          <span className="text-sm font-medium text-text-secondary">{score}</span>
        </div>
        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getBarColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function TrustScoreBreakdown({ data }: TrustScoreBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const t = useTranslations('trust')

  const factors = [
    { key: 'verification', score: data.verificationScore, icon: '🔗' },
    { key: 'liquidity', score: data.liquidityScore, icon: '💧' },
    { key: 'holders', score: data.holderScore, icon: '👥' },
    { key: 'activity', score: data.activityScore, icon: '📊' },
    { key: 'contract', score: data.contractScore, icon: '🛡️' },
    { key: 'community', score: data.communityScore, icon: '💬' },
  ]

  return (
    <div className="bg-surface-1 border border-border rounded-[var(--radius-md)] overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <TrustScoreBadge score={data.totalScore} rating={data.rating} size="md" />
          <div className="text-left">
            <h3 className="font-semibold text-text-primary">{t('title')}</h3>
            <p className="text-sm text-text-secondary">
              {t(`rating.${data.rating}`)}
            </p>
          </div>
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

      {/* Expanded breakdown */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {factors.map((factor) => (
            <ScoreBar
              key={factor.key}
              label={t(`factor.${factor.key}`)}
              score={factor.score}
              icon={factor.icon}
            />
          ))}
          <p className="text-xs text-text-tertiary pt-2">
            {t('calculatedAt', { date: new Date(data.calculatedAt).toLocaleDateString() })}
          </p>
        </div>
      )}
    </div>
  )
}
