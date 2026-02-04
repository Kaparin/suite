'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useWallet, truncateAddress } from '@/lib/wallet'
import { useAuth } from '@/lib/auth/useAuth'
import { TokenStatusBadge } from '@/components/token'

interface UserProject {
  id: string
  name: string
  ticker: string
  logo: string | null
  status: string
  tokenAddress: string | null
  createdAt: string
  _count?: {
    comments: number
    reactions: number
  }
}

interface DashboardData {
  projects: UserProject[]
  stats: {
    totalProjects: number
    publishedProjects: number
    draftProjects: number
    upcomingProjects: number
  }
}

export default function DashboardPage() {
  const { isConnected, address, balance, refreshBalance } = useWallet()
  const { user, isAuthenticated, token } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboard() {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/projects?ownerId=${user.id}&status=ALL`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch dashboard')
        }

        // Calculate stats
        const projects = result.projects || []
        const stats = {
          totalProjects: projects.length,
          publishedProjects: projects.filter((p: UserProject) => p.status === 'PUBLISHED' || p.status === 'LAUNCHED').length,
          draftProjects: projects.filter((p: UserProject) => p.status === 'DRAFT').length,
          upcomingProjects: projects.filter((p: UserProject) => p.status === 'UPCOMING' || p.status === 'PRESALE').length
        }

        setData({ projects, stats })
      } catch (err) {
        console.error('Dashboard error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboard()
  }, [user?.id, token])

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Login Required</h1>
          <p className="text-gray-400 mb-6">Login with Telegram to view your dashboard</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium rounded-xl transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            Log in with Telegram
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            {user?.telegramPhotoUrl ? (
              <Image
                src={user.telegramPhotoUrl}
                alt={user.telegramFirstName || 'User'}
                width={56}
                height={56}
                className="w-14 h-14 rounded-xl"
              />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {(user?.telegramFirstName || 'U').charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome, {user?.telegramFirstName || 'User'}!
              </h1>
              <p className="text-gray-400">
                {user?.telegramUsername ? `@${user.telegramUsername}` : 'Manage your tokens and projects'}
              </p>
            </div>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Token
          </Link>
        </div>

        {/* User Status Card */}
        <div className="bg-gradient-to-br from-purple-500/10 via-gray-900 to-blue-500/10 border border-gray-800 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-6">
              {/* Verification Status */}
              <div>
                <p className="text-sm text-gray-400 mb-1">Status</p>
                <div className="flex items-center gap-2">
                  {user?.isVerified ? (
                    <>
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      <span className="text-green-400 font-medium">Verified</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                      <span className="text-yellow-400 font-medium">Unverified</span>
                    </>
                  )}
                </div>
              </div>
              {/* Wallet */}
              {user?.walletAddress && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Wallet</p>
                  <p className="text-sm font-mono text-white">{truncateAddress(user.walletAddress)}</p>
                </div>
              )}
              {/* Balance */}
              {isConnected && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Balance</p>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-medium">
                      {balance.isLoading ? '...' : balance.axm}
                    </span>
                    <span className="text-purple-400 text-sm">AXM</span>
                  </div>
                </div>
              )}
            </div>
            {!user?.isVerified && (
              <Link
                href="/login?verify=true"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg"
              >
                Verify Wallet
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{data?.stats.totalProjects ?? 0}</p>
                <p className="text-sm text-gray-400">Total</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{data?.stats.upcomingProjects ?? 0}</p>
                <p className="text-sm text-gray-400">Upcoming</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{data?.stats.publishedProjects ?? 0}</p>
                <p className="text-sm text-gray-400">Launched</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{data?.stats.draftProjects ?? 0}</p>
                <p className="text-sm text-gray-400">Drafts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">My Projects</h2>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-800 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-5 w-32 bg-gray-800 rounded mb-2" />
                      <div className="h-4 w-48 bg-gray-800 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          ) : data?.projects.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
              <p className="text-gray-400 mb-6">Create your first token to get started</p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  href="/create"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Manually
                </Link>
                <Link
                  href="/studio"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Create with AI
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {data?.projects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900/50 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {project.logo ? (
                        <Image
                          src={project.logo}
                          alt={project.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                          {project.ticker?.[0] || project.name[0]}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white">{project.name}</h3>
                          <span className="text-sm text-gray-400">${project.ticker}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <TokenStatusBadge status={project.status as 'DRAFT' | 'UPCOMING' | 'PRESALE' | 'PUBLISHED' | 'LAUNCHED' | 'ARCHIVED'} size="sm" />
                          {project.tokenAddress && (
                            <span className="text-xs text-gray-500 font-mono">
                              {truncateAddress(project.tokenAddress)}
                            </span>
                          )}
                          {project._count && (
                            <span className="text-xs text-gray-500">
                              {project._count.reactions} reactions, {project._count.comments} comments
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(project.status === 'PUBLISHED' || project.status === 'LAUNCHED') && project.tokenAddress && (
                        <Link
                          href={`/t/${project.tokenAddress}`}
                          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                          title="View Token Page"
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                      )}
                      {(project.status === 'UPCOMING' || project.status === 'PRESALE') && (
                        <Link
                          href={`/t/${project.id}`}
                          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                          title="View Project Page"
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                      )}
                      {(project.status === 'DRAFT' || project.status === 'UPCOMING') && (
                        <Link
                          href={`/edit/${project.id}`}
                          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                          title="Edit Project"
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
