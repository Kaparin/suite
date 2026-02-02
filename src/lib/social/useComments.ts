'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth/useAuth'

interface CommentUser {
  id: string
  telegramUsername: string | null
  telegramFirstName: string | null
  telegramPhotoUrl: string | null
  isVerified: boolean
}

interface Comment {
  id: string
  content: string
  isEdited: boolean
  createdAt: string
  updatedAt: string
  user: CommentUser
}

interface UseCommentsReturn {
  comments: Comment[]
  isLoading: boolean
  error: string | null
  hasMore: boolean
  total: number
  fetchComments: () => Promise<void>
  loadMore: () => Promise<void>
  addComment: (content: string) => Promise<Comment | null>
}

export function useComments(projectId: string): UseCommentsReturn {
  const { token } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const limit = 20

  const fetchComments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/projects/${projectId}/comments?limit=${limit}&offset=0`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }

      const data = await response.json()
      setComments(data.comments)
      setTotal(data.pagination.total)
      setHasMore(data.pagination.hasMore)
      setOffset(limit)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments')
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)

    try {
      const response = await fetch(
        `/api/projects/${projectId}/comments?limit=${limit}&offset=${offset}`
      )

      if (!response.ok) {
        throw new Error('Failed to load more comments')
      }

      const data = await response.json()
      setComments(prev => [...prev, ...data.comments])
      setHasMore(data.pagination.hasMore)
      setOffset(prev => prev + limit)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more comments')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, offset, isLoading, hasMore])

  const addComment = useCallback(async (content: string): Promise<Comment | null> => {
    if (!token) {
      setError('Please log in to comment')
      return null
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add comment')
      }

      const data = await response.json()

      // Add new comment to the beginning of the list
      setComments(prev => [data.comment, ...prev])
      setTotal(prev => prev + 1)

      return data.comment
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment')
      return null
    }
  }, [projectId, token])

  return {
    comments,
    isLoading,
    error,
    hasMore,
    total,
    fetchComments,
    loadMore,
    addComment
  }
}
