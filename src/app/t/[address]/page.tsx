'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Badge, Button, Card, CardContent } from '@/components/ui'
import { OwnerPanel } from '@/components/token'
import { ReactionBar, CommentSection } from '@/components/social'
import { useWallet, truncateAddress } from '@/lib/wallet'
import { useTranslations } from 'next-intl'

type RiskFlag = {
  id: string
  flagType: string
  severity: string
}

type ProjectLinks = {
  telegram?: string
  twitter?: string
  website?: string
  discord?: string
}

type TokenData = {
  project: {
    id: string | null
    name: string
    ticker: string
    tokenAddress: string | null
    descriptionShort: string | null
    descriptionLong: string | null
    logo?: string | null
    tokenomics: {
      supply?: string
      distribution?: Record<string, number>
    } | null
    links: ProjectLinks | null
    isVerified: boolean
    createdAt: string
    riskFlags: RiskFlag[]
    owner?: {
      walletAddress?: string
    }
  }
  chainMinter?: string | null
}

export default function TokenPage() {
  const params = useParams()
  const address = params.address as string
  const t = useTranslations('token')
  const { isConnected, address: walletAddress } = useWallet()

  const [data, setData] = useState<TokenData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchToken = useCallback(async () => {
    try {
      const response = await fetch(`/api/tokens/${address}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Token not found')
        } else {
          throw new Error('Failed to fetch token')
        }
        return
      }
      const tokenData = await response.json()
      setData(tokenData)
    } catch (err) {
      console.error('Error fetching token:', err)
      setError('Failed to load token')
    } finally {
      setIsLoading(false)
    }
  }, [address])

  useEffect(() => {
    fetchToken()
  }, [fetchToken])


  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Check if current user is owner
  const isOwner = walletAddress && data && (
    data.project.owner?.walletAddress?.toLowerCase() === walletAddress.toLowerCase() ||
    data.chainMinter?.toLowerCase() === walletAddress.toLowerCase()
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-400">Загрузка токена...</p>
        </motion.div>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">{error || 'Токен не найден'}</h2>
          <p className="text-gray-400 mb-6">Токен, который вы ищете, не существует или был удалён.</p>
          <Link
            href="/explorer"
            className="inline-flex px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-medium transition-all"
          >
            Все токены
          </Link>
        </motion.div>
      </div>
    )
  }

  const { project } = data
  const tokenAddress = project.tokenAddress || address
  const tokenomics = project.tokenomics as { supply?: string; distribution?: Record<string, number> } | null
  const links = project.links as ProjectLinks | null

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Owner Panel */}
        {isConnected && isOwner && walletAddress && (
          <OwnerPanel
            tokenAddress={tokenAddress}
            walletAddress={walletAddress}
            currentName={project.name}
            currentDescriptionShort={project.descriptionShort}
            currentDescriptionLong={project.descriptionLong}
            currentLinks={links}
            currentLogo={project.logo || null}
            onUpdate={fetchToken}
          />
        )}

        {/* Hero */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30 overflow-hidden"
          >
            {project.logo ? (
              <img src={project.logo} alt={project.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-3xl">
                {project.ticker.slice(0, 2)}
              </span>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <h1 className="text-4xl font-bold">{project.name}</h1>
              {project.isVerified && (
                <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-xl text-gray-400 mb-4">${project.ticker}</p>
            <p className="text-gray-300 max-w-2xl mx-auto mb-6">
              {project.descriptionShort || 'Описание отсутствует'}
            </p>
          </motion.div>

          {/* Owner Badge */}
          {isOwner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm mb-6"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Вы владелец этого токена
            </motion.div>
          )}

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <a
              href={`https://axiometrade.pro/swap?token=${tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500">
                {t('buy')} ${project.ticker}
              </Button>
            </a>
            <a
              href={`https://axiometrade.pro/swap?token=${tokenAddress}&sell=true`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg">{t('sell')} ${project.ticker}</Button>
            </a>
          </motion.div>
        </div>

        {/* Stats - Coming Soon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800/50">
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Token Analytics</p>
                    <p className="text-sm text-gray-400">Holders, volume, transactions</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                  Coming Soon
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Risk Assessment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="mb-8 bg-gray-900/50 backdrop-blur-sm border-gray-800/50">
            <CardContent>
              <h2 className="text-xl font-semibold mb-4">{t('riskAssessment')}</h2>
              {project.riskFlags.length === 0 ? (
                <div className="flex items-center gap-3 text-green-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t('noRiskFlags')}</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {project.riskFlags.map((flag) => (
                    <Badge key={flag.id} variant="danger">
                      {flag.flagType.replace(/_/g, ' ').toLowerCase()}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* About */}
        {project.descriptionLong && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="mb-8 bg-gray-900/50 backdrop-blur-sm border-gray-800/50">
              <CardContent>
                <h2 className="text-xl font-semibold mb-4">{t('about')} {project.name}</h2>
                <p className="text-gray-300 whitespace-pre-line">{project.descriptionLong}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tokenomics */}
        {tokenomics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="mb-8 bg-gray-900/50 backdrop-blur-sm border-gray-800/50">
              <CardContent>
                <h2 className="text-xl font-semibold mb-6">{t('tokenomics')}</h2>
                {tokenomics.supply && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-1">{t('totalSupply')}</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {tokenomics.supply}
                    </p>
                  </div>
                )}
                {tokenomics.distribution && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(tokenomics.distribution).map(([key, value]) => (
                      <div key={key} className="bg-gray-800/50 p-4 rounded-lg text-center border border-gray-700/50">
                        <p className="text-2xl font-bold text-white">{value}%</p>
                        <p className="text-sm text-gray-400 capitalize">{key}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Links */}
        {links && (links.telegram || links.twitter || links.website || links.discord) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="mb-8 bg-gray-900/50 backdrop-blur-sm border-gray-800/50">
              <CardContent>
                <h2 className="text-xl font-semibold mb-4">{t('links')}</h2>
                <div className="flex flex-wrap gap-3">
                  {links.telegram && (
                    <a
                      href={links.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors border border-gray-700/50"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.154.232.17.327.015.095.034.311.019.478z"/>
                      </svg>
                      Telegram
                    </a>
                  )}
                  {links.twitter && (
                    <a
                      href={links.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors border border-gray-700/50"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Twitter
                    </a>
                  )}
                  {links.website && (
                    <a
                      href={links.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors border border-gray-700/50"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      Website
                    </a>
                  )}
                  {links.discord && (
                    <a
                      href={links.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors border border-gray-700/50"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                      Discord
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Contract Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800/50">
            <CardContent>
              <h2 className="text-xl font-semibold mb-4">{t('contract')}</h2>
              <div className="bg-gray-800/50 p-4 rounded-lg flex items-center justify-between border border-gray-700/50">
                <code className="text-sm text-gray-300 break-all">{tokenAddress}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(tokenAddress)}
                  className="ml-4 p-2 hover:bg-gray-700 rounded transition-colors"
                  title="Copy address"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>

              {/* Owner info */}
              {(data.chainMinter || project.owner?.walletAddress) && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                  <span>Владелец:</span>
                  <code className="text-gray-300">
                    {truncateAddress(data.chainMinter || project.owner?.walletAddress || '', 8, 6)}
                  </code>
                  {isOwner && <span className="text-purple-400">(это вы)</span>}
                </div>
              )}

              <p className="text-sm text-gray-500 mt-2">
                {t('createdOn')} {formatDate(project.createdAt)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Social Features - Reactions & Comments */}
        {project.id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="space-y-6"
          >
            {/* Reactions */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800/50">
              <CardContent>
                <h2 className="text-xl font-semibold mb-4">Community Reactions</h2>
                <ReactionBar projectId={project.id} />
              </CardContent>
            </Card>

            {/* Comments */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800/50">
              <CardContent>
                <CommentSection projectId={project.id} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Disclaimer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          {t('disclaimer')}
        </p>
      </motion.div>
    </div>
  )
}
