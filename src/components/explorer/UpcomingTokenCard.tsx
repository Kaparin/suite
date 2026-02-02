'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { TokenStatusBadge } from '@/components/token'

interface UpcomingTokenCardProps {
  token: {
    id: string
    name: string
    ticker: string
    logo?: string | null
    descriptionShort?: string | null
    status: string
    decimals: number
    initialSupply?: string | null
    estimatedLaunchDate?: string | null
    createdAt: string
    owner: {
      id: string
      telegramUsername?: string | null
      telegramFirstName?: string | null
      telegramPhotoUrl?: string | null
    }
    _count: {
      comments: number
      reactions: number
    }
  }
  index: number
}

export function UpcomingTokenCard({ token, index }: UpcomingTokenCardProps) {
  const formatSupply = (supply: string | null | undefined): string => {
    if (!supply) return 'TBD'
    const num = parseInt(supply)
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return 'TBD'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const daysUntilLaunch = (): string | null => {
    if (!token.estimatedLaunchDate) return null
    const launchDate = new Date(token.estimatedLaunchDate)
    const today = new Date()
    const diffTime = launchDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return 'Launching soon'
    if (diffDays === 0) return 'Today!'
    if (diffDays === 1) return 'Tomorrow'
    return `${diffDays} days`
  }

  const countdown = daysUntilLaunch()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={`/t/${token.id}`}
        className="block bg-gray-900/50 hover:bg-gray-800/50 border border-gray-800 hover:border-purple-500/30 rounded-xl p-5 transition-all duration-300"
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Logo */}
          <div className="relative flex-shrink-0">
            {token.logo ? (
              <Image
                src={token.logo}
                alt={token.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-xl object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {token.ticker.charAt(0)}
                </span>
              </div>
            )}
            {/* Status indicator */}
            {token.status === 'PRESALE' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-gray-900 animate-pulse" />
            )}
          </div>

          {/* Name and Symbol */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white truncate">{token.name}</h3>
              <span className="text-xs text-gray-500 font-medium">${token.ticker}</span>
            </div>
            <div className="flex items-center gap-2">
              <TokenStatusBadge status={token.status as 'DRAFT' | 'UPCOMING' | 'PRESALE' | 'PUBLISHED' | 'LAUNCHED' | 'ARCHIVED'} size="sm" />
            </div>
          </div>

          {/* Countdown */}
          {countdown && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Launch</p>
              <p className="text-sm font-medium text-purple-400">{countdown}</p>
            </div>
          )}
        </div>

        {/* Description */}
        {token.descriptionShort && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-4">
            {token.descriptionShort}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Supply</p>
            <p className="text-sm font-medium text-white">{formatSupply(token.initialSupply)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Decimals</p>
            <p className="text-sm font-medium text-white">{token.decimals}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Launch Date</p>
            <p className="text-sm font-medium text-white">{formatDate(token.estimatedLaunchDate)}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
          {/* Creator */}
          <div className="flex items-center gap-2">
            {token.owner.telegramPhotoUrl ? (
              <Image
                src={token.owner.telegramPhotoUrl}
                alt={token.owner.telegramFirstName || 'Creator'}
                width={20}
                height={20}
                className="w-5 h-5 rounded-full"
              />
            ) : (
              <div className="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-[10px] text-gray-400">
                  {(token.owner.telegramFirstName || 'U').charAt(0)}
                </span>
              </div>
            )}
            <span className="text-xs text-gray-500">
              by {token.owner.telegramUsername ? `@${token.owner.telegramUsername}` : token.owner.telegramFirstName || 'Anonymous'}
            </span>
          </div>

          {/* Engagement */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {token._count.comments}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              {token._count.reactions}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
