'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth/useAuth'
import {
  useCommentReactions,
  COMMENT_REACTION_EMOJIS,
  COMMENT_REACTION_LABELS,
  type CommentReactionType
} from '@/lib/social'

interface CommentCardProps {
  comment: {
    id: string
    content: string
    isEdited: boolean
    createdAt: string
    user: {
      id: string
      telegramUsername: string | null
      telegramFirstName: string | null
      telegramPhotoUrl: string | null
      isVerified: boolean
    }
  }
  onDelete?: (commentId: string) => Promise<boolean>
}

export function CommentCard({ comment, onDelete }: CommentCardProps) {
  const { user, isAuthenticated } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const {
    counts,
    fetchReactions,
    toggleReaction,
    hasReacted,
    isLoading: reactionsLoading
  } = useCommentReactions(comment.id)

  useEffect(() => {
    fetchReactions()
  }, [fetchReactions])

  const isOwner = user?.id === comment.user.id

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    await onDelete(comment.id)
    setIsDeleting(false)
    setShowDeleteConfirm(false)
  }

  const handleReaction = async (type: CommentReactionType) => {
    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }
    await toggleReaction(type)
  }

  const displayName = comment.user.telegramUsername
    ? `@${comment.user.telegramUsername}`
    : comment.user.telegramFirstName || 'Anonymous'

  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0)
  const reactionTypes: CommentReactionType[] = ['LIKE', 'LOVE', 'LAUGH', 'DISLIKE']

  return (
    <motion.div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setShowReactions(false)
      }}
      layout
    >
      <div className={`flex gap-3 p-4 rounded-xl transition-all duration-200 ${
        isHovered ? 'bg-gray-800/50' : 'bg-gray-800/30'
      }`}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.user.telegramPhotoUrl ? (
            <Image
              src={comment.user.telegramPhotoUrl}
              alt={displayName}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full ring-2 ring-gray-700"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center ring-2 ring-gray-700">
              <span className="text-sm font-bold text-white">
                {(comment.user.telegramFirstName || 'A').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-white truncate">{displayName}</span>
              {comment.user.isVerified && (
                <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-xs text-gray-500 flex-shrink-0">{formatDate(comment.createdAt)}</span>
              {comment.isEdited && (
                <span className="text-xs text-gray-600 flex-shrink-0">(edited)</span>
              )}
            </div>

            {/* Actions */}
            <AnimatePresence>
              {isHovered && isOwner && onDelete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1"
                >
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete comment"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-2 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          'Delete'
                        )}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-2 py-1 text-xs font-medium text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Comment text */}
          <p className="text-sm text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
            {comment.content}
          </p>

          {/* Reactions bar */}
          <div className="flex items-center gap-3 mt-3">
            {/* Reaction buttons */}
            <div className="flex items-center gap-1">
              {/* Quick reaction button */}
              <div className="relative">
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                    totalReactions > 0
                      ? 'bg-gray-700/50 hover:bg-gray-700'
                      : 'text-gray-500 hover:text-gray-400 hover:bg-gray-700/50'
                  }`}
                >
                  {totalReactions > 0 ? (
                    <>
                      {/* Show top reactions */}
                      <span className="flex">
                        {reactionTypes
                          .filter(type => counts[type] > 0)
                          .slice(0, 3)
                          .map(type => (
                            <span key={type} className="-ml-0.5 first:ml-0">
                              {COMMENT_REACTION_EMOJIS[type]}
                            </span>
                          ))}
                      </span>
                      <span className="text-gray-400 ml-1">{totalReactions}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>React</span>
                    </>
                  )}
                </button>

                {/* Reaction picker */}
                <AnimatePresence>
                  {showReactions && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 5 }}
                      className="absolute bottom-full left-0 mb-2 flex items-center gap-1 p-1.5 bg-gray-800 border border-gray-700 rounded-full shadow-xl z-10"
                    >
                      {reactionTypes.map((type) => (
                        <motion.button
                          key={type}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleReaction(type)}
                          disabled={reactionsLoading}
                          className={`relative p-1.5 rounded-full transition-colors ${
                            hasReacted(type)
                              ? 'bg-purple-500/30 ring-1 ring-purple-500/50'
                              : 'hover:bg-gray-700'
                          }`}
                          title={COMMENT_REACTION_LABELS[type]}
                        >
                          <span className="text-lg">{COMMENT_REACTION_EMOJIS[type]}</span>
                          {counts[type] > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center bg-gray-900 text-[10px] text-gray-300 rounded-full">
                              {counts[type]}
                            </span>
                          )}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Reply button (coming soon) */}
              <button
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-400 hover:bg-gray-700/50 rounded-full transition-colors"
                title="Coming soon"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span>Reply</span>
              </button>
            </div>

            {/* Individual reaction counts (when there are reactions) */}
            {totalReactions > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                {reactionTypes
                  .filter(type => counts[type] > 0)
                  .map(type => (
                    <motion.button
                      key={type}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleReaction(type)}
                      className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full transition-all ${
                        hasReacted(type)
                          ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30'
                          : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50'
                      }`}
                    >
                      <span>{COMMENT_REACTION_EMOJIS[type]}</span>
                      <span>{counts[type]}</span>
                    </motion.button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
