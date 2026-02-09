'use client'

import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/auth/useAuth'
import { Card, CardContent, Button } from '@/components/ui'
import { useState, useEffect, useCallback } from 'react'

interface RewardEvent {
  id: string
  type: 'TOKEN_REVIEW' | 'SCAM_REPORT' | 'PROJECT_UPDATE' | 'DAILY_ACTIVITY'
  amount: number
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED'
  projectId: string | null
  commentId: string | null
  txHash: string | null
  createdAt: string
  updatedAt: string
}

interface RewardStats {
  totalEarned: number
  pending: number
  approved: number
  paid: number
  rejected: number
}

export default function RewardsPage() {
  const t = useTranslations('rewards')
  const { isAuthenticated, token, isLoading: authLoading } = useAuth()

  const [rewards, setRewards] = useState<RewardEvent[]>([])
  const [stats, setStats] = useState<RewardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRewards = useCallback(async () => {
    if (!token) return

    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/rewards', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        throw new Error('Failed to fetch rewards')
      }

      const data = await res.json()
      setRewards(data.rewards || [])
      setStats(data.stats || null)
    } catch (err) {
      console.error('Failed to load rewards:', err)
      setError('Failed to load rewards')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchRewards()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [isAuthenticated, token, authLoading, fetchRewards])

  const handleClaim = async () => {
    if (!token || claiming) return

    try {
      setClaiming(true)
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'claim' }),
      })

      if (!res.ok) {
        throw new Error('Failed to claim rewards')
      }

      // Refresh data after claiming
      await fetchRewards()
    } catch (err) {
      console.error('Failed to claim rewards:', err)
      setError('Failed to claim rewards')
    } finally {
      setClaiming(false)
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-400'
      case 'APPROVED':
        return 'text-green-400'
      case 'PAID':
        return 'text-blue-400'
      case 'REJECTED':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'TOKEN_REVIEW':
        return (
          <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )
      case 'SCAM_REPORT':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'PROJECT_UPDATE':
        return (
          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      case 'DAILY_ACTIVITY':
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  // Not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent>
            <h2 className="text-xl font-bold text-white mb-2">{t('title')}</h2>
            <p className="text-gray-400">{t('subtitle')}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
          <p className="text-gray-400">{t('subtitle')}</p>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gray-900 border border-gray-800">
              <CardContent>
                <p className="text-sm text-gray-400 mb-1">{t('totalEarned')}</p>
                <p className="text-2xl font-bold text-white">{stats.totalEarned} <span className="text-sm text-purple-400">LAUNCH</span></p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border border-gray-800">
              <CardContent>
                <p className="text-sm text-gray-400 mb-1">{t('pending')}</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pending + stats.approved} <span className="text-sm">LAUNCH</span></p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border border-gray-800">
              <CardContent>
                <p className="text-sm text-gray-400 mb-1">{t('claimed')}</p>
                <p className="text-2xl font-bold text-green-400">{stats.paid} <span className="text-sm">LAUNCH</span></p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Claim button */}
        {stats && stats.approved > 0 && (
          <div className="mb-8">
            <Button
              onClick={handleClaim}
              isLoading={claiming}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3"
            >
              {claiming ? t('claiming') : `${t('claimButton')} (${stats.approved} LAUNCH)`}
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}

        {/* Rewards list */}
        {!loading && rewards.length === 0 && (
          <Card className="bg-gray-900 border border-gray-800 text-center">
            <CardContent>
              <p className="text-gray-400 py-8">{t('noRewards')}</p>
            </CardContent>
          </Card>
        )}

        {!loading && rewards.length > 0 && (
          <Card className="bg-gray-900 border border-gray-800">
            <CardContent>
              <div className="divide-y divide-gray-800">
                {rewards.map((reward) => (
                  <div key={reward.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                        {typeIcon(reward.type)}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">
                          {t(`type.${reward.type}`)}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {new Date(reward.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        reward.status === 'PENDING' ? 'bg-yellow-900/30 text-yellow-400' :
                        reward.status === 'APPROVED' ? 'bg-green-900/30 text-green-400' :
                        reward.status === 'PAID' ? 'bg-blue-900/30 text-blue-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {t(`status.${reward.status}`)}
                      </span>
                      <span className={`text-sm font-bold ${statusColor(reward.status)}`}>
                        +{reward.amount} LAUNCH
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
