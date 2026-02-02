'use client'

import Image from 'next/image'

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
}

export function CommentCard({ comment }: CommentCardProps) {
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

  const displayName = comment.user.telegramUsername
    ? `@${comment.user.telegramUsername}`
    : comment.user.telegramFirstName || 'Anonymous'

  return (
    <div className="flex gap-3 p-4 bg-gray-800/30 rounded-xl">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {comment.user.telegramPhotoUrl ? (
          <Image
            src={comment.user.telegramPhotoUrl}
            alt={displayName}
            width={36}
            height={36}
            className="w-9 h-9 rounded-full"
          />
        ) : (
          <div className="w-9 h-9 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {(comment.user.telegramFirstName || 'A').charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-white">{displayName}</span>
          {comment.user.isVerified && (
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
          {comment.isEdited && (
            <span className="text-xs text-gray-600">(edited)</span>
          )}
        </div>
        <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>
    </div>
  )
}
