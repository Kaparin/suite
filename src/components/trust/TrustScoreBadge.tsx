'use client'

import { useTranslations } from 'next-intl'

interface TrustScoreBadgeProps {
  score: number  // 0-100
  rating: string // A, B, C, D, F
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const ratingColors: Record<string, { bg: string; text: string; ring: string; stroke: string }> = {
  A: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', ring: 'ring-emerald-500/30', stroke: 'stroke-emerald-400' },
  B: { bg: 'bg-blue-500/20', text: 'text-blue-400', ring: 'ring-blue-500/30', stroke: 'stroke-blue-400' },
  C: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', ring: 'ring-yellow-500/30', stroke: 'stroke-yellow-400' },
  D: { bg: 'bg-orange-500/20', text: 'text-orange-400', ring: 'ring-orange-500/30', stroke: 'stroke-orange-400' },
  F: { bg: 'bg-red-500/20', text: 'text-red-400', ring: 'ring-red-500/30', stroke: 'stroke-red-400' },
}

const sizes = {
  sm: { container: 'w-8 h-8', text: 'text-[10px]', label: 'text-xs' },
  md: { container: 'w-12 h-12', text: 'text-sm', label: 'text-sm' },
  lg: { container: 'w-16 h-16', text: 'text-lg', label: 'text-base' },
}

export function TrustScoreBadge({ score, rating, size = 'md', showLabel = false }: TrustScoreBadgeProps) {
  const t = useTranslations('trust')
  const colors = ratingColors[rating] || ratingColors.F
  const sizeConfig = sizes[size]

  // SVG circle params
  const svgSize = size === 'sm' ? 32 : size === 'md' ? 48 : 64
  const radius = svgSize / 2 - 3
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference

  return (
    <div className="flex items-center gap-2">
      <div className={`relative ${sizeConfig.container}`}>
        <svg width={svgSize} height={svgSize} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className={colors.stroke}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${colors.text} ${sizeConfig.text}`}>
            {rating}
          </span>
        </div>
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className={`font-medium ${colors.text} ${sizeConfig.label}`}>
            {score}
          </span>
          <span className="text-xs text-gray-500">{t('score')}</span>
        </div>
      )}
    </div>
  )
}

/**
 * Compact inline badge for lists/tables
 */
export function TrustScoreInline({ score, rating }: { score: number; rating: string }) {
  const colors = ratingColors[rating] || ratingColors.F

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} text-xs font-medium ring-1 ${colors.ring}`}>
      {rating}
      <span className="text-[10px] opacity-75">{score}</span>
    </span>
  )
}
