'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useReactions, REACTION_EMOJIS, REACTION_LABELS } from '@/lib/social'
import { useAuth } from '@/lib/auth/useAuth'

type ReactionType = 'ROCKET' | 'FIRE' | 'HEART' | 'EYES' | 'WARNING'

interface ReactionBarProps {
  projectId: string
  compact?: boolean
}

export function ReactionBar({ projectId, compact = false }: ReactionBarProps) {
  const { isAuthenticated } = useAuth()
  const { counts, fetchReactions, toggleReaction, hasReacted, isLoading } = useReactions(projectId)

  useEffect(() => {
    fetchReactions()
  }, [fetchReactions])

  const reactionTypes: ReactionType[] = ['ROCKET', 'FIRE', 'HEART', 'EYES', 'WARNING']

  const handleReaction = (type: ReactionType) => {
    if (!isAuthenticated) {
      // Could show a login prompt here
      window.location.href = '/login'
      return
    }
    toggleReaction(type)
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {reactionTypes.map((type) => {
          const count = counts[type]
          if (count === 0) return null

          return (
            <button
              key={type}
              onClick={() => handleReaction(type)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                hasReacted(type)
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              title={REACTION_LABELS[type]}
            >
              <span>{REACTION_EMOJIS[type]}</span>
              <span>{count}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">React:</span>
        <div className="flex gap-1">
          {reactionTypes.map((type) => (
            <motion.button
              key={type}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleReaction(type)}
              disabled={isLoading}
              className={`relative p-2 rounded-lg transition-colors ${
                hasReacted(type)
                  ? 'bg-purple-500/20 ring-1 ring-purple-500/50'
                  : 'bg-gray-800/50 hover:bg-gray-700/50'
              }`}
              title={REACTION_LABELS[type]}
            >
              <span className="text-xl">{REACTION_EMOJIS[type]}</span>
              {counts[type] > 0 && (
                <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-xs font-medium ${
                  hasReacted(type)
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {counts[type]}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {!isAuthenticated && (
        <p className="text-xs text-gray-500">
          <a href="/login" className="text-purple-400 hover:underline">Log in</a> to react
        </p>
      )}
    </div>
  )
}
