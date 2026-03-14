'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { TrustScoreInline } from '@/components/trust/TrustScoreBadge'
import { Skeleton } from '@/components/ui'

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
  isOurToken?: boolean
  priceInAxm?: number | null
  priceInUsd?: number | null
  liquidity?: number | null
  hasPool?: boolean
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

type Category = 'all' | 'new' | 'verified' | 'trending'

const categories: { id: Category; label: string }[] = [
  { id: 'all', label: 'All Tokens' },
  { id: 'new', label: 'New' },
  { id: 'verified', label: 'Verified' },
  { id: 'trending', label: 'Trending' },
]

export default function ExplorerPage() {
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category>('all')
  const [counts, setCounts] = useState({ all: 0, new: 0, verified: 0, trending: 0 })

  const fetchTokens = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ category, search, limit: '100' })
      const response = await fetch(`/api/tokens/live?${params}`)
      const data: TokensResponse = await response.json()
      setTokens(data.tokens)
      setCounts(data.counts)
    } catch (error) {
      console.error('Error fetching tokens:', error)
    } finally {
      setIsLoading(false)
    }
  }, [category, search])

  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== '') fetchTokens()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, fetchTokens])

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
    <div className="min-h-screen">
      <div className="container-page py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
            Token Explorer
          </h1>
          <p className="text-text-secondary text-base">
            Explore all tokens on Axiome. Discover new projects, verified tokens, and track trends.
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          {[
            { value: counts.all, label: 'Total Tokens', color: 'text-accent' },
            { value: counts.verified, label: 'Verified', color: 'text-[var(--success)]' },
            { value: counts.new, label: 'New (7d)', color: 'text-text-primary' },
            { value: counts.trending, label: 'Trending', color: 'text-[var(--warning)]' },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface-1 border border-border rounded-[var(--radius-md)] p-4">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, symbol, or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-1 border border-border rounded-[var(--radius-md)] text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-200"
              />
            </div>
            <button
              onClick={() => fetchTokens()}
              className="px-4 py-2.5 bg-surface-1 border border-border hover:border-border-hover rounded-[var(--radius-md)] text-text-secondary hover:text-text-primary transition-all duration-200 flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`chip ${category === cat.id ? 'chip-active' : ''}`}
              >
                {cat.label}
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  category === cat.id ? 'bg-white/20' : 'bg-surface-3'
                }`}>
                  {counts[cat.id]}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Token Table — Desktop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {/* Table Container */}
          <div className="bg-surface-1 border border-border rounded-[var(--radius-lg)] overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[40px_1fr_120px_120px_100px_80px_100px] gap-4 px-5 py-3 border-b border-border text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              <div>#</div>
              <div>Token</div>
              <div className="text-right">Price</div>
              <div className="text-right">Liquidity</div>
              <div className="text-right">Holders</div>
              <div className="text-right">Trust</div>
              <div className="text-right">Status</div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[40px_1fr_120px_120px_100px_80px_100px] gap-4 px-5 py-4 border-b border-border last:border-b-0">
                    <Skeleton height={14} className="w-6" rounded="sm" />
                    <div className="flex items-center gap-3">
                      <Skeleton width={36} height={36} rounded="full" />
                      <div className="space-y-1.5">
                        <Skeleton height={14} className="w-24" rounded="sm" />
                        <Skeleton height={10} className="w-14" rounded="sm" />
                      </div>
                    </div>
                    <Skeleton height={14} className="w-20 ml-auto" rounded="sm" />
                    <Skeleton height={14} className="w-16 ml-auto" rounded="sm" />
                    <Skeleton height={14} className="w-12 ml-auto" rounded="sm" />
                    <Skeleton height={14} className="w-10 ml-auto" rounded="sm" />
                    <Skeleton height={20} className="w-16 ml-auto" rounded="full" />
                  </div>
                ))}
              </div>
            ) : tokens.length === 0 ? (
              /* Empty State */
              <div className="py-20 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-surface-2 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-1">No tokens found</h3>
                <p className="text-sm text-text-secondary">Try changing your search or category filter</p>
              </div>
            ) : (
              /* Table Rows */
              <AnimatePresence mode="popLayout">
                {tokens.map((token, index) => (
                  <motion.div
                    key={token.contractAddress}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.02 }}
                    layout
                  >
                    <Link href={`/t/${token.contractAddress}`} className="block">
                      {/* Desktop Row */}
                      <div className={`hidden md:grid grid-cols-[40px_1fr_120px_120px_100px_80px_100px] gap-4 px-5 py-3.5 items-center border-b border-border last:border-b-0 table-row-hover group ${
                        token.isOurToken ? 'bg-accent/[0.03]' : ''
                      }`}>
                        {/* Rank */}
                        <div className="text-sm text-text-tertiary font-medium">{index + 1}</div>

                        {/* Token Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          {token.logoUrl ? (
                            <img src={token.logoUrl} alt={token.symbol} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-accent font-bold text-sm">{token.symbol.slice(0, 2)}</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                                {token.name}
                              </span>
                              {token.isVerified && (
                                <svg className="w-4 h-4 text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                              {token.isOurToken && (
                                <span className="px-1.5 py-0.5 bg-accent/10 text-accent text-[10px] font-semibold rounded-full border border-accent/20">ECO</span>
                              )}
                            </div>
                            <span className="text-xs text-text-tertiary">${token.symbol}</span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          {token.priceInUsd ? (
                            <span className="text-sm font-medium text-[var(--success)]">${formatPrice(token.priceInUsd)}</span>
                          ) : token.priceInAxm ? (
                            <span className="text-sm font-medium text-accent">{formatPrice(token.priceInAxm)} AXM</span>
                          ) : (
                            <span className="text-sm text-text-tertiary">&mdash;</span>
                          )}
                        </div>

                        {/* Liquidity */}
                        <div className="text-right">
                          {token.liquidity ? (
                            <span className="text-sm text-text-primary">{formatLiquidity(token.liquidity)} AXM</span>
                          ) : (
                            <span className="text-sm text-text-tertiary">&mdash;</span>
                          )}
                        </div>

                        {/* Holders */}
                        <div className="text-right text-sm text-text-secondary">
                          {token.holderCount.toLocaleString()}
                        </div>

                        {/* Trust */}
                        <div className="text-right">
                          {token.trustRating && token.trustScore != null ? (
                            <TrustScoreInline score={token.trustScore} rating={token.trustRating} />
                          ) : (
                            <span className="text-sm text-text-tertiary">&mdash;</span>
                          )}
                        </div>

                        {/* Status badges */}
                        <div className="flex justify-end gap-1.5">
                          {token.isNew && (
                            <span className="px-2 py-0.5 bg-[var(--success-bg)] text-[var(--success)] text-xs font-medium rounded-full">New</span>
                          )}
                          {token.isTrending && (
                            <span className="px-2 py-0.5 bg-[var(--warning-bg)] text-[var(--warning)] text-xs font-medium rounded-full">Hot</span>
                          )}
                          {token.hasPool && !token.isTrending && !token.isNew && (
                            <span className="px-2 py-0.5 bg-accent-light text-accent text-xs font-medium rounded-full">DEX</span>
                          )}
                        </div>
                      </div>

                      {/* Mobile Card */}
                      <div className={`md:hidden p-4 border-b border-border last:border-b-0 table-row-hover ${
                        token.isOurToken ? 'bg-accent/[0.03]' : ''
                      }`}>
                        <div className="flex items-start gap-3">
                          {/* Rank + Avatar */}
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs text-text-tertiary font-medium w-5">{index + 1}</span>
                            {token.logoUrl ? (
                              <img src={token.logoUrl} alt={token.symbol} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                                <span className="text-accent font-bold text-sm">{token.symbol.slice(0, 2)}</span>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-sm font-semibold text-text-primary truncate">{token.name}</span>
                              {token.isVerified && (
                                <svg className="w-3.5 h-3.5 text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className="text-xs text-text-tertiary">${token.symbol}</span>
                          </div>

                          {/* Price + badges */}
                          <div className="text-right">
                            {token.priceInUsd ? (
                              <p className="text-sm font-medium text-[var(--success)]">${formatPrice(token.priceInUsd)}</p>
                            ) : token.priceInAxm ? (
                              <p className="text-sm font-medium text-accent">{formatPrice(token.priceInAxm)} AXM</p>
                            ) : (
                              <p className="text-sm text-text-tertiary">&mdash;</p>
                            )}
                            <div className="flex justify-end gap-1 mt-1">
                              {token.isNew && <span className="px-1.5 py-0.5 bg-[var(--success-bg)] text-[var(--success)] text-[10px] font-medium rounded-full">New</span>}
                              {token.isTrending && <span className="px-1.5 py-0.5 bg-[var(--warning-bg)] text-[var(--warning)] text-[10px] font-medium rounded-full">Hot</span>}
                            </div>
                          </div>
                        </div>

                        {/* Bottom row — mobile stats */}
                        <div className="flex items-center gap-4 mt-2.5 ml-[62px] text-xs text-text-tertiary">
                          {token.liquidity && (
                            <span>Liq: <span className="text-text-secondary">{formatLiquidity(token.liquidity)} AXM</span></span>
                          )}
                          <span>Holders: <span className="text-text-secondary">{token.holderCount.toLocaleString()}</span></span>
                          {token.trustRating && token.trustScore != null && (
                            <TrustScoreInline score={token.trustScore} rating={token.trustRating} />
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        {/* Staking CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10"
        >
          <div className="bg-surface-1 border border-border rounded-[var(--radius-lg)] p-6 md:p-8 text-center">
            <h3 className="text-xl font-bold text-text-primary mb-2">Stake LAUNCH, Earn AXM</h3>
            <p className="text-text-secondary mb-5 max-w-lg mx-auto text-sm">
              Stake LAUNCH tokens and earn a share of fees from all ecosystem projects.
            </p>
            <Link href="/wallet?tab=staking"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-[var(--radius-md)] shadow-sm hover:shadow-md transition-all duration-200"
            >
              Stake LAUNCH
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
