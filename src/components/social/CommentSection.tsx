'use client'

import { useState, useEffect, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    addComment,
    deleteComment
  } = useComments(projectId)

  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

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
      setIsFocused(false)
    }
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comments
          {total > 0 && (
            <span className="px-2 py-0.5 bg-surface-3 text-text-secondary text-xs rounded-full">
              {total}
            </span>
          )}
        </h3>
      </div>

      {/* Comment form */}
      {isAuthenticated ? (
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-3"
          initial={false}
          animate={{ height: 'auto' }}
        >
          <div className="flex gap-3">
            {/* User avatar */}
            <div className="flex-shrink-0">
              {user?.telegramPhotoUrl ? (
                <img
                  src={user.telegramPhotoUrl}
                  alt={user.telegramFirstName || 'You'}
                  className="w-10 h-10 rounded-full ring-2 ring-border"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center ring-2 ring-border">
                  <span className="text-sm font-bold text-text-primary">
                    {(user?.telegramFirstName || 'Y').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex-1">
              <div className={`relative rounded-[var(--radius-md)] transition-all duration-200 ${
                isFocused ? 'ring-1 ring-accent/30' : ''
              }`}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => !newComment && setIsFocused(false)}
                  placeholder="Share your thoughts..."
                  rows={isFocused ? 3 : 1}
                  maxLength={1000}
                  className="w-full px-4 py-3 bg-surface-2/70 border border-border rounded-[var(--radius-md)] text-text-primary placeholder-text-tertiary focus:border-accent outline-none transition-all resize-none"
                />
              </div>

              <AnimatePresence>
                {(isFocused || newComment) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-between mt-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs ${
                        newComment.length > 900 ? 'text-orange-400' :
                        newComment.length > 800 ? 'text-yellow-400' : 'text-text-tertiary'
                      }`}>
                        {newComment.length}/1000
                      </span>
                      {newComment.length > 900 && (
                        <span className="text-xs text-orange-400">Almost at limit!</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {newComment && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewComment('')
                            setIsFocused(false)
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="submit"
                        disabled={!newComment.trim() || isSubmitting}
                        size="sm"
                        className="bg-accent hover:bg-accent-hover"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Posting...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Post
                          </div>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.form>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-accent/5 rounded-[var(--radius-md)] border border-accent/20 text-center"
        >
          <div className="w-12 h-12 mx-auto mb-4 bg-accent/10 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-text-secondary">Comments coming soon</p>
        </motion.div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-[var(--danger-bg)] border border-[var(--danger)]/30 rounded-[var(--radius-md)]"
          >
            <svg className="w-5 h-5 text-[var(--danger)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[var(--danger)] text-sm">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments list */}
      <div className="space-y-2">
        {isLoading && comments.length === 0 ? (
          // Loading skeleton
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-4 bg-surface-2/30 rounded-[var(--radius-md)] animate-pulse">
                <div className="w-10 h-10 bg-surface-3 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-3 rounded w-28" />
                  <div className="h-4 bg-surface-3 rounded w-full" />
                  <div className="h-4 bg-surface-3 rounded w-3/4" />
                  <div className="h-6 bg-surface-3 rounded w-24 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-surface-2 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-text-secondary mb-2">No comments yet</p>
            <p className="text-text-tertiary text-sm">Be the first to share your thoughts!</p>
          </motion.div>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {comments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ delay: index * 0.03 }}
                  layout
                >
                  <CommentCard
                    comment={comment}
                    onDelete={deleteComment}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Load more */}
            {hasMore && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center pt-4"
              >
                <Button
                  onClick={loadMore}
                  variant="outline"
                  disabled={isLoading}
                  className="group"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-text-secondary/30 border-t-text-secondary rounded-full animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Load More Comments
                    </div>
                  )}
                </Button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
