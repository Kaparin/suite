'use client'

import { useTranslations } from 'next-intl'

export type LockTier = 'EXPLORER' | 'BUILDER' | 'FOUNDER' | 'GOVERNOR'

interface TierBadgeProps {
  tier: LockTier | null
  size?: 'sm' | 'md'
}

const TIER_COLORS: Record<LockTier, { bg: string; text: string; border: string }> = {
  EXPLORER: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  BUILDER: {
    bg: 'bg-violet-500/15',
    text: 'text-violet-400',
    border: 'border-violet-500/30',
  },
  FOUNDER: {
    bg: 'bg-pink-500/15',
    text: 'text-pink-400',
    border: 'border-pink-500/30',
  },
  GOVERNOR: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
}

const TIER_TRANSLATION_KEY: Record<LockTier, string> = {
  EXPLORER: 'tier.explorer',
  BUILDER: 'tier.builder',
  FOUNDER: 'tier.founder',
  GOVERNOR: 'tier.governor',
}

export function TierBadge({ tier, size = 'sm' }: TierBadgeProps) {
  const t = useTranslations('lock')

  if (!tier) return null

  const colors = TIER_COLORS[tier]
  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-3 py-1 text-sm'

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses}`}
    >
      {t(TIER_TRANSLATION_KEY[tier])}
    </span>
  )
}
