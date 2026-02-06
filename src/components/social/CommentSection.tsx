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
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comments
          {total > 0 && (
            <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-full">
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
                  className="w-10 h-10 rounded-full ring-2 ring-gray-700"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center ring-2 ring-gray-700">
                  <span className="text-sm font-bold text-white">
                    {(user?.telegramFirstName || 'Y').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex-1">
              <div className={`relative rounded-xl transition-all duration-200 ${
                isFocused ? 'ring-2 ring-purple-500/50' : ''
              }`}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => !newComment && setIsFocused(false)}
                  placeholder="Share your thoughts..."
                  rows={isFocused ? 3 : 1}
                  maxLength={1000}
                  className="w-full px-4 py-3 bg-gray-800/70 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none transition-all resize-none"
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
                        newComment.length > 800 ? 'text-yellow-400' : 'text-gray-500'
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
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
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
          className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20 text-center"
        >
          <div className="w-12 h-12 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-gray-300 mb-4">Join the conversation!</p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium rounded-lg transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            Log in with Telegram
          </a>
        </motion.div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
          >
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-400 text-sm">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments list */}
      <div className="space-y-2">
        {isLoading && comments.length === 0 ? (
          // Loading skeleton
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-4 bg-gray-800/30 rounded-xl animate-pulse">
                <div className="w-10 h-10 bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-28" />
                  <div className="h-4 bg-gray-700 rounded w-full" />
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                  <div className="h-6 bg-gray-700 rounded w-24 mt-2" />
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
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-400 mb-2">No comments yet</p>
            <p className="text-gray-600 text-sm">Be the first to share your thoughts!</p>
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
                      <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
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
