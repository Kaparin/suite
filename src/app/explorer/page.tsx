'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, Badge, Input } from '@/components/ui'
import { useTranslations } from 'next-intl'

// Mock data for demonstration
const mockTokens = [
  {
    id: '1',
    name: 'Axiome Meme',
    ticker: 'AMEME',
    tokenAddress: 'axm1abc123def456ghi789jkl012mno345',
    age: 5,
    txCount: 1250,
    holders: 342,
    volume24h: 15420,
    score: 85,
    riskFlags: [],
    isVerified: true,
  },
  {
    id: '2',
    name: 'Moon Token',
    ticker: 'MOON',
    tokenAddress: 'axm1def456ghi789jkl012mno345pqr678',
    age: 2,
    txCount: 450,
    holders: 89,
    volume24h: 3200,
    score: 62,
    riskFlags: ['TOO_NEW'],
    isVerified: false,
  },
  {
    id: '3',
    name: 'Safe Yield',
    ticker: 'SYLD',
    tokenAddress: 'axm1ghi789jkl012mno345pqr678stu901',
    age: 14,
    txCount: 3200,
    holders: 890,
    volume24h: 45000,
    score: 92,
    riskFlags: [],
    isVerified: true,
  },
  {
    id: '4',
    name: 'Risky Gem',
    ticker: 'RISK',
    tokenAddress: 'axm1jkl012mno345pqr678stu901vwx234',
    age: 1,
    txCount: 120,
    holders: 23,
    volume24h: 800,
    score: 28,
    riskFlags: ['TOO_NEW', 'HIGH_CONCENTRATION', 'NO_SOCIALS'],
    isVerified: false,
  },
]

type SortField = 'score' | 'age' | 'volume24h' | 'holders'
type SortOrder = 'asc' | 'desc'

export default function ExplorerPage() {
  const t = useTranslations('explorer')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('score')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const filteredTokens = mockTokens
    .filter(token =>
      token.name.toLowerCase().includes(search.toLowerCase()) ||
      token.ticker.toLowerCase().includes(search.toLowerCase()) ||
      token.tokenAddress.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      return sortOrder === 'desc' ? Number(bVal) - Number(aVal) : Number(aVal) - Number(bVal)
    })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getRiskBadgeVariant = (flag: string): 'warning' | 'danger' => {
    const highRisk = ['HIGH_CONCENTRATION', 'HONEYPOT_SUSPECT', 'SUDDEN_DUMP']
    return highRisk.includes(flag) ? 'danger' : 'warning'
  }

  const formatRiskFlag = (flag: string) => {
    return flag.replace(/_/g, ' ').toLowerCase()
  }

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-gray-400">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md bg-gray-900/50 border-gray-700/50"
          />
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden p-0 bg-gray-900/50 backdrop-blur-sm border-gray-800/50">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/80">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">
                      {t('columns.token')}
                    </th>
                    <th
                      className="text-left py-4 px-6 text-sm font-medium text-gray-400 cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('score')}
                    >
                      {t('columns.score')} {sortField === 'score' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                    <th
                      className="text-left py-4 px-6 text-sm font-medium text-gray-400 cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('age')}
                    >
                      {t('columns.age')} {sortField === 'age' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                    <th
                      className="text-left py-4 px-6 text-sm font-medium text-gray-400 cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('holders')}
                    >
                      {t('columns.holders')} {sortField === 'holders' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                    <th
                      className="text-left py-4 px-6 text-sm font-medium text-gray-400 cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('volume24h')}
                    >
                      {t('columns.volume')} {sortField === 'volume24h' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">
                      {t('columns.flags')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTokens.map((token, index) => (
                    <motion.tr
                      key={token.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <Link href={`/t/${token.tokenAddress}`} className="flex items-center gap-3 group">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="text-white font-bold text-sm">
                              {token.ticker.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white group-hover:text-blue-400 transition-colors">
                                {token.name}
                              </span>
                              {token.isVerified && (
                                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">${token.ticker}</span>
                          </div>
                        </Link>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`font-bold text-lg ${getScoreColor(token.score)}`}>
                          {token.score}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {token.age}d
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {token.holders.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        ${token.volume24h.toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {token.riskFlags.length === 0 ? (
                            <Badge variant="success" size="sm">{t('clean')}</Badge>
                          ) : (
                            token.riskFlags.map((flag) => (
                              <Badge key={flag} variant={getRiskBadgeVariant(flag)} size="sm">
                                {formatRiskFlag(flag)}
                              </Badge>
                            ))
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {filteredTokens.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-gray-400"
          >
            {t('noResults')}
          </motion.div>
        )}
      </div>
    </div>
  )
}
