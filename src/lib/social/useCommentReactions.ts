'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth/useAuth'

export type CommentReactionType = 'LIKE' | 'DISLIKE' | 'LAUGH' | 'LOVE'

export const COMMENT_REACTION_EMOJIS: Record<CommentReactionType, string> = {
  LIKE: '👍',
  DISLIKE: '👎',
  LAUGH: '😂',
  LOVE: '❤️'
}

export const COMMENT_REACTION_LABELS: Record<CommentReactionType, string> = {
  LIKE: 'Like',
  DISLIKE: 'Dislike',
  LAUGH: 'Funny',
  LOVE: 'Love'
}

interface UseCommentReactionsReturn {
  counts: Record<CommentReactionType, number>
  userReactions: CommentReactionType[]
  isLoading: boolean
  fetchReactions: () => Promise<void>
  toggleReaction: (type: CommentReactionType) => Promise<void>
  hasReacted: (type: CommentReactionType) => boolean
}

export function useCommentReactions(commentId: string): UseCommentReactionsReturn {
  const { token, isAuthenticated } = useAuth()
  const [counts, setCounts] = useState<Record<CommentReactionType, number>>({
    LIKE: 0,
    DISLIKE: 0,
    LAUGH: 0,
    LOVE: 0
  })
  const [userReactions, setUserReactions] = useState<CommentReactionType[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchReactions = useCallback(async () => {
    try {
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/comments/${commentId}/reactions`, {
        headers
      })

      if (response.ok) {
        const data = await response.json()
        setCounts({
          LIKE: data.counts.LIKE || 0,
          DISLIKE: data.counts.DISLIKE || 0,
          LAUGH: data.counts.LAUGH || 0,
          LOVE: data.counts.LOVE || 0
        })
        setUserReactions(data.userReactions || [])
      }
    } catch (error) {
      console.error('Error fetching comment reactions:', error)
    }
  }, [commentId, token])

  const toggleReaction = useCallback(async (type: CommentReactionType) => {
    if (!token || !isAuthenticated) return

    setIsLoading(true)

    // Optimistic update
    const wasReacted = userReactions.includes(type)
    if (wasReacted) {
      setUserReactions(prev => prev.filter(r => r !== type))
      setCounts(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }))
    } else {
      setUserReactions(prev => [...prev, type])
      setCounts(prev => ({ ...prev, [type]: prev[type] + 1 }))
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type })
      })

      if (!response.ok) {
        // Revert optimistic update
        if (wasReacted) {
          setUserReactions(prev => [...prev, type])
          setCounts(prev => ({ ...prev, [type]: prev[type] + 1 }))
        } else {
          setUserReactions(prev => prev.filter(r => r !== type))
          setCounts(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }))
        }
      }
    } catch (error) {
      console.error('Error toggling comment reaction:', error)
      // Revert optimistic update
      if (wasReacted) {
        setUserReactions(prev => [...prev, type])
        setCounts(prev => ({ ...prev, [type]: prev[type] + 1 }))
      } else {
        setUserReactions(prev => prev.filter(r => r !== type))
        setCounts(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }))
      }
    } finally {
      setIsLoading(false)
    }
  }, [commentId, token, isAuthenticated, userReactions])

  const hasReacted = useCallback((type: CommentReactionType) => {
    return userReactions.includes(type)
  }, [userReactions])

  return {
    counts,
    userReactions,
    isLoading,
    fetchReactions,
    toggleReaction,
    hasReacted
  }
}
