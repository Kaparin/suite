'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth/useAuth'

type ReactionType = 'ROCKET' | 'FIRE' | 'HEART' | 'EYES' | 'WARNING'

interface UseReactionsReturn {
  counts: Record<ReactionType, number>
  userReactions: ReactionType[]
  total: number
  isLoading: boolean
  error: string | null
  fetchReactions: () => Promise<void>
  toggleReaction: (type: ReactionType) => Promise<void>
  hasReacted: (type: ReactionType) => boolean
}

export function useReactions(projectId: string): UseReactionsReturn {
  const { token } = useAuth()
  const [counts, setCounts] = useState<Record<ReactionType, number>>({
    ROCKET: 0,
    FIRE: 0,
    HEART: 0,
    EYES: 0,
    WARNING: 0
  })
  const [userReactions, setUserReactions] = useState<ReactionType[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReactions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/projects/${projectId}/reactions`, {
        headers
      })

      if (!response.ok) {
        throw new Error('Failed to fetch reactions')
      }

      const data = await response.json()
      setCounts(data.counts)
      setUserReactions(data.userReactions || [])
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reactions')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, token])

  const toggleReaction = useCallback(async (type: ReactionType) => {
    if (!token) {
      setError('Please log in to react')
      return
    }

    // Optimistic update
    const wasReacted = userReactions.includes(type)
    const newUserReactions = wasReacted
      ? userReactions.filter(r => r !== type)
      : [...userReactions, type]
    const newCounts = {
      ...counts,
      [type]: counts[type] + (wasReacted ? -1 : 1)
    }

    setUserReactions(newUserReactions)
    setCounts(newCounts)
    setTotal(Object.values(newCounts).reduce((a, b) => a + b, 0))

    try {
      const response = await fetch(`/api/projects/${projectId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type })
      })

      if (!response.ok) {
        // Revert on error
        setUserReactions(userReactions)
        setCounts(counts)
        setTotal(Object.values(counts).reduce((a, b) => a + b, 0))
        throw new Error('Failed to toggle reaction')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle reaction')
    }
  }, [projectId, token, counts, userReactions])

  const hasReacted = useCallback((type: ReactionType) => {
    return userReactions.includes(type)
  }, [userReactions])

  return {
    counts,
    userReactions,
    total,
    isLoading,
    error,
    fetchReactions,
    toggleReaction,
    hasReacted
  }
}

// Reaction emoji mapping
export const REACTION_EMOJIS: Record<ReactionType, string> = {
  ROCKET: '\u{1F680}', // 🚀
  FIRE: '\u{1F525}',   // 🔥
  HEART: '\u{2764}',   // ❤️
  EYES: '\u{1F440}',   // 👀
  WARNING: '\u{26A0}'  // ⚠️
}

export const REACTION_LABELS: Record<ReactionType, string> = {
  ROCKET: 'To the moon!',
  FIRE: 'Hot!',
  HEART: 'Love it',
  EYES: 'Watching',
  WARNING: 'Be careful'
}
