'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Badge, Button, Card, CardContent } from '@/components/ui'
import { OwnerPanel } from '@/components/token'
import { ReactionBar, CommentSection } from '@/components/social'
import { TrustScoreBreakdown } from '@/components/trust/TrustScoreBreakdown'
import { ChangeHistory } from '@/components/trust/ChangeHistory'
import { useWallet, truncateAddress } from '@/lib/wallet'
import { useAuth } from '@/lib/auth/useAuth'
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

type ChainTokenInfo = {
  name: string
  symbol: string
  decimals: number
  total_supply: string
}

type ChainMarketingInfo = {
  description?: string | null
  logo?: { url?: string } | null
  project?: string | null
  marketing?: string | null
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
      decimals?: number
      distribution?: Record<string, number>
    } | null
    links: ProjectLinks | null
    isVerified: boolean
    createdAt: string | null
    riskFlags: RiskFlag[]
    changes?: {
      id: string
      changeType: string
      oldValue: unknown
      newValue: unknown
      createdAt: string
      userId?: string
    }[]
  }
  chainData?: {
    tokenInfo: ChainTokenInfo | null
    marketingInfo: ChainMarketingInfo | null
  }
  chainMinter?: string | null
  trustScore?: {
    totalScore: number
    rating: string
    verificationScore: number
    liquidityScore: number
    holderScore: number
    activityScore: number
    contractScore: number
    communityScore: number
    calculatedAt: string
  } | null
}

const EXPLORER_URL = 'https://axiomechain.org'

function formatSupply(supply: string, decimals: number): string {
  if (decimals === 0) {
    return Number(supply).toLocaleString()
  }
  // Simple approach: insert decimal point at the right position
  const padded = supply.padStart(decimals + 1, '0')
  const wholePart = padded.slice(0, padded.length - decimals)
  const fracPart = padded.slice(padded.length - decimals).replace(/0+$/, '')
  const wholeStr = Number(wholePart).toLocaleString()
  if (!fracPart) return wholeStr
  return `${wholeStr}.${fracPart.slice(0, 4)}`
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="p-2 hover:bg-gray-700 rounded-lg transition-colors group"
      title="Copy"
    >
      {copied ? (
        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  )
}

export default function TokenPage() {
  const params = useParams()
  const address = params.address as string
  const t = useTranslations('token')
  const { address: walletAddress } = useWallet()
  const { user } = useAuth()

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
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Ownership check: compare user's wallet addresses with on-chain minter
  const minterWallet = data?.chainMinter?.toLowerCase()
  const connectedWallet = walletAddress?.toLowerCase()
  const authWallet = user?.primaryWallet?.toLowerCase()
  const userWallets = user?.wallets?.map((w: { address: string }) => w.address.toLowerCase()) || []
  const allUserWallets = [...new Set([...userWallets, ...[connectedWallet, authWallet].filter(Boolean)])]

  const isOwner = !!(minterWallet && allUserWallets.includes(minterWallet))

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-400">Loading token...</p>
        </motion.div>
      </div>
    )
  }

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
          <h2 className="text-2xl font-bold mb-2">{error || 'Token not found'}</h2>
          <p className="text-gray-400 mb-6">The token you are looking for does not exist or has been removed.</p>
          <Link
            href="/explorer"
            className="inline-flex px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-medium transition-all"
          >
            All Tokens
          </Link>
        </motion.div>
      </div>
    )
  }

  const { project } = data
  const tokenAddress = project.tokenAddress || address
  const tokenomics = project.tokenomics as { supply?: string; decimals?: number; distribution?: Record<string, number> } | null
  const links = project.links as ProjectLinks | null
  const chainInfo = data.chainData?.tokenInfo
  const marketingInfo = data.chainData?.marketingInfo
  const isOnChain = project.tokenAddress?.startsWith('axm') || address.startsWith('axm')

  // Combine links from DB and chain marketing_info
  const allLinks: ProjectLinks = {
    ...links,
    ...(marketingInfo?.project && !links?.website ? { website: marketingInfo.project } : {}),
  }
  const hasLinks = allLinks.telegram || allLinks.twitter || allLinks.website || allLinks.discord

  // Token details: chain data takes priority
  const decimals = chainInfo?.decimals ?? tokenomics?.decimals
  const totalSupply = chainInfo?.total_supply ?? tokenomics?.supply
  const chainSymbol = chainInfo?.symbol ?? project.ticker
  const chainName = chainInfo?.name ?? project.name
  const chainLogo = marketingInfo?.logo?.url || project.logo

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Back button */}
        <Link
          href="/explorer"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Explorer
        </Link>

        {/* Owner Panel — shown only if user is the on-chain minter */}
        {isOwner && (
          <OwnerPanel
            tokenAddress={tokenAddress}
            currentDescriptionShort={project.descriptionShort}
            currentDescriptionLong={project.descriptionLong}
            currentLinks={links}
            onUpdate={fetchToken}
          />
        )}

        {/* Hero Section */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30 overflow-hidden"
          >
            {chainLogo ? (
              <img src={chainLogo} alt={chainName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-3xl">
                {chainSymbol.slice(0, 2)}
              </span>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <h1 className="text-4xl font-bold">{chainName}</h1>
              {project.isVerified && (
                <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-xl text-gray-400 mb-4">${chainSymbol}</p>

            {/* Description — chain description takes priority, then DB */}
            {(marketingInfo?.description || project.descriptionShort) && (
              <p className="text-gray-300 max-w-2xl mx-auto mb-6">
                {marketingInfo?.description || project.descriptionShort}
              </p>
            )}
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
              You are the owner of this token
            </motion.div>
          )}

          {/* Action Buttons */}
          {isOnChain && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-3"
            >
              <a
                href={`https://axiometrade.pro/swap?token=${tokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Trade ${chainSymbol}
                </Button>
              </a>
              <a
                href={`${EXPLORER_URL}/cosmwasm/code`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Explorer
                </Button>
              </a>
            </motion.div>
          )}
        </div>

        {/* On-Chain Token Info */}
        {chainInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-8"
          >
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800/50 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-b border-gray-800/50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-white">On-Chain Token Data</h2>
                  <Badge variant="info" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                    CW20
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Name</p>
                    <p className="text-white font-medium">{chainInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Symbol</p>
                    <p className="text-white font-medium">{chainInfo.symbol}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Decimals</p>
                    <p className="text-white font-medium">{chainInfo.decimals}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Supply</p>
                    <p className="text-white font-medium">
                      {formatSupply(chainInfo.total_supply, chainInfo.decimals)}
                    </p>
                  </div>
                </div>

                {/* Marketing Info from chain */}
                {marketingInfo && (marketingInfo.description || marketingInfo.project || marketingInfo.marketing) && (
                  <div className="mt-6 pt-6 border-t border-gray-800/50">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Marketing Info</p>
                    <div className="space-y-3">
                      {marketingInfo.description && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Description</p>
                          <p className="text-gray-300 text-sm">{marketingInfo.description}</p>
                        </div>
                      )}
                      {marketingInfo.project && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Project URL</p>
                          <a
                            href={marketingInfo.project}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center gap-1 transition-colors"
                          >
                            {marketingInfo.project}
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}
                      {marketingInfo.marketing && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Marketing Admin</p>
                          <div className="flex items-center gap-2">
                            <code className="text-gray-300 text-sm font-mono">
                              {truncateAddress(marketingInfo.marketing, 10, 6)}
                            </code>
                            <CopyButton text={marketingInfo.marketing} />
                          </div>
                        </div>
                      )}
                      {marketingInfo.logo?.url && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Logo URL</p>
                          <a
                            href={marketingInfo.logo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center gap-1 transition-colors"
                          >
                            {marketingInfo.logo.url.length > 60
                              ? marketingInfo.logo.url.slice(0, 60) + '...'
                              : marketingInfo.logo.url}
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Minter/Owner from chain */}
                {data.chainMinter && (
                  <div className="mt-6 pt-6 border-t border-gray-800/50">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Minter (Owner)</p>
                    <div className="flex items-center gap-2">
                      <code className="text-gray-300 text-sm font-mono bg-gray-800/50 px-3 py-1.5 rounded-lg">
                        {truncateAddress(data.chainMinter, 12, 8)}
                      </code>
                      <CopyButton text={data.chainMinter} />
                      {isOwner && (
                        <span className="text-purple-400 text-xs font-medium">(you)</span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Trust Score */}
        {data?.trustScore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <TrustScoreBreakdown data={data.trustScore} />
          </motion.div>
        )}

        {/* Risk Assessment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
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

        {/* Change History */}
        {data?.project?.changes && data.project.changes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <ChangeHistory changes={data.project.changes} />
          </motion.div>
        )}

        {/* About (from DB — owner-added content) */}
        {project.descriptionLong && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <Card className="mb-8 bg-gray-900/50 backdrop-blur-sm border-gray-800/50">
              <CardContent>
                <h2 className="text-xl font-semibold mb-4">{t('about')} {chainName}</h2>
                <p className="text-gray-300 whitespace-pre-line">{project.descriptionLong}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tokenomics (from DB) */}
        {tokenomics?.distribution && Object.keys(tokenomics.distribution).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="mb-8 bg-gray-900/50 backdrop-blur-sm border-gray-800/50">
              <CardContent>
                <h2 className="text-xl font-semibold mb-6">{t('tokenomics')}</h2>
                {totalSupply && decimals != null && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-1">{t('totalSupply')}</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {formatSupply(totalSupply, decimals)} {chainSymbol}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(tokenomics.distribution).map(([key, value]) => (
                    <div key={key} className="bg-gray-800/50 p-4 rounded-lg text-center border border-gray-700/50">
                      <p className="text-2xl font-bold text-white">{value}%</p>
                      <p className="text-sm text-gray-400 capitalize">{key}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Links */}
        {hasLinks && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
          >
            <Card className="mb-8 bg-gray-900/50 backdrop-blur-sm border-gray-800/50">
              <CardContent>
                <h2 className="text-xl font-semibold mb-4">{t('links')}</h2>
                <div className="flex flex-wrap gap-3">
                  {allLinks.telegram && (
                    <a
                      href={allLinks.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl transition-colors border border-gray-700/50"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.154.232.17.327.015.095.034.311.019.478z"/>
                      </svg>
                      Telegram
                    </a>
                  )}
                  {allLinks.twitter && (
                    <a
                      href={allLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl transition-colors border border-gray-700/50"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Twitter / X
                    </a>
                  )}
                  {allLinks.website && (
                    <a
                      href={allLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl transition-colors border border-gray-700/50"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      Website
                    </a>
                  )}
                  {allLinks.discord && (
                    <a
                      href={allLinks.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl transition-colors border border-gray-700/50"
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
          transition={{ delay: 0.7 }}
        >
          <Card className="mb-8 bg-gray-900/50 backdrop-blur-sm border-gray-800/50">
            <CardContent>
              <h2 className="text-xl font-semibold mb-4">{t('contract')}</h2>
              <div className="bg-gray-800/50 p-4 rounded-xl flex items-center justify-between border border-gray-700/50">
                <code className="text-sm text-gray-300 break-all">{tokenAddress}</code>
                <CopyButton text={tokenAddress} />
              </div>

              {project.createdAt && (
                <p className="text-sm text-gray-500 mt-3">
                  {t('createdOn')} {formatDate(project.createdAt)}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Community Reactions & Comments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="space-y-6"
        >
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800/50">
            <CardContent>
              <h2 className="text-xl font-semibold mb-4">Community Reactions</h2>
              <ReactionBar projectId={project.id || tokenAddress} />
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800/50">
            <CardContent>
              <CommentSection projectId={project.id || tokenAddress} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Disclaimer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          {t('disclaimer')}
        </p>
      </motion.div>
    </div>
  )
}
