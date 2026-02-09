'use client'

import { useState, useEffect, ReactNode } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/auth/useAuth'
import type { LockTier } from './TierBadge'

const TIER_ORDER: LockTier[] = ['EXPLORER', 'BUILDER', 'FOUNDER', 'GOVERNOR']

const TIER_TRANSLATION_KEY: Record<LockTier, string> = {
  EXPLORER: 'tier.explorer',
  BUILDER: 'tier.builder',
  FOUNDER: 'tier.founder',
  GOVERNOR: 'tier.governor',
}

function isTierSufficient(userTier: LockTier, requiredTier: LockTier): boolean {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(requiredTier)
}

interface TierGateProps {
  requiredTier: LockTier
  children: ReactNode
  fallback?: ReactNode
}

export function TierGate({ requiredTier, children, fallback }: TierGateProps) {
  const t = useTranslations('lock')
  const { user, token, isAuthenticated } = useAuth()
  const [userTier, setUserTier] = useState<LockTier | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setIsLoading(false)
      setHasAccess(false)
      return
    }

    let cancelled = false

    async function checkTier() {
      try {
        const res = await fetch('/api/lock', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          setHasAccess(false)
          setIsLoading(false)
          return
        }

        const data = await res.json()

        if (cancelled) return

        setUserTier(data.tier)

        if (data.tier && isTierSufficient(data.tier, requiredTier)) {
          setHasAccess(true)
        } else {
          setHasAccess(false)
        }
      } catch {
        setHasAccess(false)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    checkTier()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, token, requiredTier])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  const requiredTierName = t(TIER_TRANSLATION_KEY[requiredTier])

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 text-center">
      <div className="w-12 h-12 bg-violet-500/15 rounded-xl flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-6 h-6 text-violet-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <p className="text-white font-medium mb-2">
        {t('gate.requires', { tier: requiredTierName })}
      </p>
      <p className="text-sm text-zinc-400 mb-4">
        {t('gate.lockToUpgrade')}
      </p>
      <Link
        href="/lock"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20"
      >
        {t('gate.lockButton')}
      </Link>
    </div>
  )
}
