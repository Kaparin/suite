'use client'

import { useState, useEffect, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import { useComments } from '@/lib/social'
import { useAuth } from '@/lib/auth/useAuth'
import { CommentCard } from './CommentCard'

interface CommentSectionProps {
  projectId: string
}

export function CommentSection({ projectId }: CommentSectionProps) {
  const { isAuthenticated, user } = useAuth()
  const {
    comments,
    isLoading,
    error,
    hasMore,
    total,
    fetchComments,
    loadMore,
    addComment
  } = useComments(projectId)

  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    const result = await addComment(newComment.trim())
    if (result) {
      setNewComment('')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Comments {total > 0 && <span className="text-gray-500">({total})</span>}
        </h3>
      </div>

      {/* Comment form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            {/* User avatar */}
            <div className="flex-shrink-0">
              {user?.telegramPhotoUrl ? (
                <img
                  src={user.telegramPhotoUrl}
                  alt={user.telegramFirstName || 'You'}
                  className="w-9 h-9 rounded-full"
                />
              ) : (
                <div className="w-9 h-9 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {(user?.telegramFirstName || 'Y').charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                maxLength={1000}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {newComment.length}/1000
                </span>
                <Button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Post'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-gray-800/30 rounded-xl text-center">
          <p className="text-gray-400 mb-3">Log in to join the conversation</p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            Log in with Telegram
          </a>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-3">
        {isLoading && comments.length === 0 ? (
          // Loading skeleton
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-4 bg-gray-800/30 rounded-xl animate-pulse">
                <div className="w-9 h-9 bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-24" />
                  <div className="h-4 bg-gray-700 rounded w-full" />
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <>
            {comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CommentCard comment={comment} />
              </motion.div>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  onClick={loadMore}
                  variant="outline"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
                  ) : (
                    'Load More Comments'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
