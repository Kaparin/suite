'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, Input, Button } from '@/components/ui'
import { ExplorerTabs, UpcomingTokenCard } from '@/components/explorer'
import { TrustScoreInline } from '@/components/trust/TrustScoreBadge'

interface TokenData {
  contractAddress: string
  name: string
  symbol: string
  decimals: number
  totalSupply: string
  displayTotalSupply: string
  logoUrl?: string
  description?: string
  verified: boolean
  createdAt?: string
  holderCount: number
  isNew: boolean
  isTrending: boolean
  isVerified: boolean
  // Price data
  priceInAxm?: number | null
  priceInUsd?: number | null
  liquidity?: number | null
  hasPool?: boolean
  // Trust score
  trustScore?: number | null
  trustRating?: string | null
}

interface TokensResponse {
  tokens: TokenData[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  counts: {
    all: number
    new: number
    verified: number
    trending: number
  }
}

interface UpcomingToken {
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

interface UpcomingTokensResponse {
  tokens: UpcomingToken[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  counts: {
    all: number
    upcoming: number
    presale: number
  }
}

type Category = 'all' | 'new' | 'verified' | 'trending'
type MainTab = 'live' | 'upcoming'

const categories: { id: Category; label: string; icon: React.ReactNode }[] = [
  {
    id: 'all',
    label: 'Все токены',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )
  },
  {
    id: 'new',
    label: 'Новые',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    id: 'verified',
    label: 'Проверенные',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  },
  {
    id: 'trending',
    label: 'Популярные',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )
  }
]

export default function ExplorerPage() {
  const [mainTab, setMainTab] = useState<MainTab>('live')
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [upcomingTokens, setUpcomingTokens] = useState<UpcomingToken[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category>('all')
  const [counts, setCounts] = useState({ all: 0, new: 0, verified: 0, trending: 0 })
  const [upcomingCounts, setUpcomingCounts] = useState({ all: 0, upcoming: 0, presale: 0 })

  const fetchLiveTokens = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        category,
        search,
        limit: '100'
      })
      const response = await fetch(`/api/tokens/live?${params}`)
      const data: TokensResponse = await response.json()
      setTokens(data.tokens)
      setCounts(data.counts)
    } catch (error) {
      console.error('Error fetching live tokens:', error)
    }
  }, [category, search])

  const fetchUpcomingTokens = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        search,
        limit: '100'
      })
      const response = await fetch(`/api/tokens/upcoming?${params}`)
      const data: UpcomingTokensResponse = await response.json()
      setUpcomingTokens(data.tokens)
      setUpcomingCounts(data.counts)
    } catch (error) {
      console.error('Error fetching upcoming tokens:', error)
    }
  }, [search])

  const fetchTokens = useCallback(async () => {
    setIsLoading(true)
    try {
      await Promise.all([fetchLiveTokens(), fetchUpcomingTokens()])
    } finally {
      setIsLoading(false)
    }
  }, [fetchLiveTokens, fetchUpcomingTokens])

  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== '') {
        fetchTokens()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, fetchTokens])

  const formatAge = (dateStr?: string) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Сегодня'
    if (diffDays === 1) return 'Вчера'
    if (diffDays < 7) return `${diffDays}д назад`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}нед назад`
    return `${Math.floor(diffDays / 30)}мес назад`
  }

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return null
    if (price < 0.000001) return price.toExponential(2)
    if (price < 0.0001) return price.toFixed(6)
    if (price < 0.01) return price.toFixed(5)
    if (price < 1) return price.toFixed(4)
    if (price < 100) return price.toFixed(3)
    if (price < 10000) return price.toFixed(2)
    return price.toLocaleString(undefined, { maximumFractionDigits: 0 })
  }

  const formatLiquidity = (liquidity: number | null | undefined) => {
    if (!liquidity) return null
    if (liquidity >= 1000000) return `${(liquidity / 1000000).toFixed(2)}M`
    if (liquidity >= 1000) return `${(liquidity / 1000).toFixed(1)}K`
    return liquidity.toFixed(0)
  }

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Launchpad
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Исследуйте все токены на Axiome. Найдите новые проекты, проверенные токены и отслеживайте тренды.
          </p>
        </motion.div>

        {/* Main Tabs: Live / Upcoming */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <ExplorerTabs
            activeTab={mainTab}
            onTabChange={setMainTab}
            liveCounts={counts}
            upcomingCounts={upcomingCounts}
          />
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {mainTab === 'live' ? (
            <>
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <div className="p-4 text-center">
                  <p className="text-3xl font-bold text-white">{counts.all}</p>
                  <p className="text-sm text-gray-400">Live Tokens</p>
                </div>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <div className="p-4 text-center">
                  <p className="text-3xl font-bold text-white">{counts.verified}</p>
                  <p className="text-sm text-gray-400">Verified</p>
                </div>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <div className="p-4 text-center">
                  <p className="text-3xl font-bold text-white">{counts.new}</p>
                  <p className="text-sm text-gray-400">New (7d)</p>
                </div>
              </Card>
              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                <div className="p-4 text-center">
                  <p className="text-3xl font-bold text-white">{counts.trending}</p>
                  <p className="text-sm text-gray-400">Trending</p>
                </div>
              </Card>
            </>
          ) : (
            <>
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <div className="p-4 text-center">
                  <p className="text-3xl font-bold text-white">{upcomingCounts.all}</p>
                  <p className="text-sm text-gray-400">Total Upcoming</p>
                </div>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <div className="p-4 text-center">
                  <p className="text-3xl font-bold text-white">{upcomingCounts.upcoming}</p>
                  <p className="text-sm text-gray-400">Coming Soon</p>
                </div>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
                <div className="p-4 text-center">
                  <p className="text-3xl font-bold text-white">{upcomingCounts.presale}</p>
                  <p className="text-sm text-gray-400">In Presale</p>
                </div>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <div className="p-4 text-center">
                  <p className="text-3xl font-bold text-white">{counts.all}</p>
                  <p className="text-sm text-gray-400">Live Tokens</p>
                </div>
              </Card>
            </>
          )}
        </motion.div>

        {/* Search & Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Поиск по названию, символу или адресу..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-gray-900/50 border-gray-700/50 h-12"
              />
            </div>

            {/* Create button */}
            <Link href="/studio">
              <Button className="h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Создать токен
              </Button>
            </Link>
          </div>

          {/* Category Tabs (only for Live tab) */}
          {mainTab === 'live' && (
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map((cat) => (
                <motion.button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    category === cat.id
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                    category === cat.id ? 'bg-white/20' : 'bg-gray-700'
                  }`}>
                    {counts[cat.id]}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Token Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-gray-900/50 border-gray-800 animate-pulse">
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gray-700 rounded-full" />
                    <div>
                      <div className="h-5 bg-gray-700 rounded w-24 mb-2" />
                      <div className="h-4 bg-gray-700 rounded w-16" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-full" />
                    <div className="h-4 bg-gray-700 rounded w-3/4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : mainTab === 'upcoming' ? (
          /* Upcoming Tokens Grid */
          upcomingTokens.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Upcoming Tokens</h3>
              <p className="text-gray-400 mb-6">Be the first to create a token project!</p>
              <Link href="/create">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                  Create Token
                </Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {upcomingTokens.map((token, index) => (
                <UpcomingTokenCard key={token.id} token={token} index={index} />
              ))}
            </motion.div>
          )
        ) : tokens.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Токены не найдены</h3>
            <p className="text-gray-400 mb-6">Попробуйте изменить поисковый запрос или категорию</p>
            <Link href="/studio">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                Создать первый токен
              </Button>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {tokens.map((token, index) => (
                <motion.div
                  key={token.contractAddress}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  layout
                >
                  <Link href={`/t/${token.contractAddress}`}>
                    <Card className="bg-gray-900/50 border-gray-800 hover:border-purple-500/50 transition-all group cursor-pointer h-full">
                      <div className="p-5">
                        {/* Header */}
                        <div className="flex items-start gap-4 mb-4">
                          {/* Logo */}
                          {token.logoUrl ? (
                            <img
                              src={token.logoUrl}
                              alt={token.symbol}
                              className="w-14 h-14 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-xl">
                                {token.symbol.slice(0, 2)}
                              </span>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                                {token.name}
                              </h3>
                              {token.isVerified && (
                                <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">${token.symbol}</p>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-col gap-1">
                            {token.isNew && (
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                                Новый
                              </span>
                            )}
                            {token.isTrending && (
                              <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                                🔥 Trending
                              </span>
                            )}
                            {token.trustRating && token.trustScore != null && (
                              <TrustScoreInline score={token.trustScore} rating={token.trustRating} />
                            )}
                            {token.hasPool && !token.isTrending && (
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                                DEX
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        {token.description && (
                          <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                            {token.description}
                          </p>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-800">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Цена</p>
                            {token.priceInUsd ? (
                              <p className="text-sm font-medium text-green-400">
                                ${formatPrice(token.priceInUsd)}
                              </p>
                            ) : token.priceInAxm ? (
                              <p className="text-sm font-medium text-blue-400">
                                {formatPrice(token.priceInAxm)} AXM
                              </p>
                            ) : (
                              <p className="text-sm font-medium text-gray-500">—</p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Ликвидность</p>
                            {token.liquidity ? (
                              <p className="text-sm font-medium text-white">
                                {formatLiquidity(token.liquidity)} AXM
                              </p>
                            ) : (
                              <p className="text-sm font-medium text-gray-500">—</p>
                            )}
                          </div>
                        </div>

                        {/* Contract Address */}
                        <div className="mt-3 pt-3 border-t border-gray-800">
                          <p className="text-xs text-gray-600 font-mono truncate">
                            {token.contractAddress}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/20">
            <div className="p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Готовы запустить свой токен?</h3>
              <p className="text-gray-400 mb-6 max-w-lg mx-auto">
                Используйте AI-студию для создания токена за минуты. Автоматическая генерация описания, токеномики и маркетинговых материалов.
              </p>
              <Link href="/studio">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500">
                  Начать создание
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
