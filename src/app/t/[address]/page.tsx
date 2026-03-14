'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Badge, Button, Card, CardContent, Skeleton } from '@/components/ui'
import { OwnerPanel } from '@/components/token'
import { ReactionBar, CommentSection } from '@/components/social'
import { TrustScoreBreakdown } from '@/components/trust/TrustScoreBreakdown'
import { ChangeHistory } from '@/components/trust/ChangeHistory'
import { useWallet, truncateAddress } from '@/lib/wallet'
import { useAuth } from '@/lib/auth/useAuth'
import { useTranslations } from 'next-intl'

type RiskFlag = { id: string; flagType: string; severity: string }
type ProjectLinks = { telegram?: string; twitter?: string; website?: string; discord?: string }
type ChainTokenInfo = { name: string; symbol: string; decimals: number; total_supply: string }
type ChainMarketingInfo = { description?: string | null; logo?: { url?: string } | null; project?: string | null; marketing?: string | null }

type TokenData = {
  project: {
    id: string | null
    name: string
    ticker: string
    tokenAddress: string | null
    descriptionShort: string | null
    descriptionLong: string | null
    logo?: string | null
    tokenomics: { supply?: string; decimals?: number; distribution?: Record<string, number> } | null
    links: ProjectLinks | null
    isVerified: boolean
    createdAt: string | null
    riskFlags: RiskFlag[]
    changes?: { id: string; changeType: string; oldValue: unknown; newValue: unknown; createdAt: string; userId?: string }[]
  }
  chainData?: { tokenInfo: ChainTokenInfo | null; marketingInfo: ChainMarketingInfo | null }
  chainMinter?: string | null
  trustScore?: {
    totalScore: number; rating: string
    verificationScore: number; liquidityScore: number; holderScore: number
    activityScore: number; contractScore: number; communityScore: number; calculatedAt: string
  } | null
}

const EXPLORER_URL = 'https://axiomechain.org'

function formatSupply(supply: string, decimals: number): string {
  if (decimals === 0) return Number(supply).toLocaleString()
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
    <button onClick={handleCopy} className="p-1.5 hover:bg-surface-2 rounded-[var(--radius-sm)] transition-colors" title="Copy">
      {copied ? (
        <svg className="w-4 h-4 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      ) : (
        <svg className="w-4 h-4 text-text-tertiary hover:text-text-secondary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
      )}
    </button>
  )
}

/* ── Section wrapper ── */
function Section({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className={className}>
      {children}
    </motion.div>
  )
}

/* ── SocialLinkButton ── */
function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 px-4 py-2.5 bg-surface-1 hover:bg-surface-2 rounded-[var(--radius-md)] transition-colors border border-border text-text-secondary hover:text-text-primary text-sm"
    >
      {icon}
      {label}
    </a>
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
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview')

  const fetchToken = useCallback(async () => {
    try {
      const response = await fetch(`/api/tokens/${address}`)
      if (!response.ok) {
        if (response.status === 404) setError('Token not found')
        else throw new Error('Failed to fetch token')
        return
      }
      setData(await response.json())
    } catch (err) {
      console.error('Error fetching token:', err)
      setError('Failed to load token')
    } finally {
      setIsLoading(false)
    }
  }, [address])

  useEffect(() => { fetchToken() }, [fetchToken])

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  // Ownership check
  const minterWallet = data?.chainMinter?.toLowerCase()
  const connectedWallet = walletAddress?.toLowerCase()
  const authWallet = user?.primaryWallet?.toLowerCase()
  const userWallets = user?.wallets?.map((w: { address: string }) => w.address.toLowerCase()) || []
  const allUserWallets = [...new Set([...userWallets, ...[connectedWallet, authWallet].filter(Boolean)])]
  const isOwner = !!(minterWallet && allUserWallets.includes(minterWallet))

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container-page max-w-4xl py-8">
          <Skeleton height={20} className="w-32 mb-6" rounded="sm" />
          <div className="flex items-center gap-5 mb-8">
            <Skeleton width={88} height={88} rounded="full" />
            <div className="space-y-3 flex-1">
              <Skeleton height={28} className="w-48" rounded="sm" />
              <Skeleton height={16} className="w-24" rounded="sm" />
              <Skeleton height={14} className="w-full max-w-md" rounded="sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[1,2,3,4].map(i => <Skeleton key={i} height={72} rounded="md" />)}
          </div>
          <Skeleton height={200} rounded="lg" />
        </div>
      </div>
    )
  }

  /* ── Error ── */
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[var(--danger-bg)] rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">{error || 'Token not found'}</h2>
          <p className="text-text-secondary mb-6 text-sm">The token you are looking for does not exist or has been removed.</p>
          <Link href="/explorer"
            className="inline-flex px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-[var(--radius-md)] font-semibold text-sm transition-all"
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

  const allLinks: ProjectLinks = { ...links, ...(marketingInfo?.project && !links?.website ? { website: marketingInfo.project } : {}) }
  const hasLinks = allLinks.telegram || allLinks.twitter || allLinks.website || allLinks.discord

  const decimals = chainInfo?.decimals ?? tokenomics?.decimals
  const totalSupply = chainInfo?.total_supply ?? tokenomics?.supply
  const chainSymbol = chainInfo?.symbol ?? project.ticker
  const chainName = chainInfo?.name ?? project.name
  const chainLogo = marketingInfo?.logo?.url || project.logo

  return (
    <div className="min-h-screen">
      <div className="container-page max-w-4xl py-8">
        {/* Back */}
        <Section delay={0}>
          <Link href="/explorer" className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors text-sm mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Explorer
          </Link>
        </Section>

        {/* Owner Panel */}
        {isOwner && (
          <Section delay={0.05} className="mb-6">
            <OwnerPanel tokenAddress={tokenAddress} currentDescriptionShort={project.descriptionShort} currentDescriptionLong={project.descriptionLong} currentLinks={links} onUpdate={fetchToken} />
          </Section>
        )}

        {/* ══ HERO — OpenSea Collection Style ══ */}
        <Section delay={0.1} className="mb-8">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-[88px] sm:h-[88px] rounded-full overflow-hidden bg-accent/10 flex-shrink-0 border-2 border-border">
              {chainLogo ? (
                <img src={chainLogo} alt={chainName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-accent font-bold text-2xl">{chainSymbol.slice(0, 2)}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary truncate">{chainName}</h1>
                {project.isVerified && (
                  <svg className="w-5 h-5 text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {isOwner && (
                  <Badge variant="accent" size="sm">Owner</Badge>
                )}
              </div>
              <p className="text-text-secondary mb-3">${chainSymbol}</p>

              {(marketingInfo?.description || project.descriptionShort) && (
                <p className="text-text-secondary text-sm max-w-xl mb-4">
                  {marketingInfo?.description || project.descriptionShort}
                </p>
              )}

              {/* Action Buttons */}
              {isOnChain && (
                <div className="flex flex-wrap items-center gap-2">
                  <a href={`https://axiometrade.pro/swap?token=${tokenAddress}`} target="_blank" rel="noopener noreferrer">
                    <Button size="md" variant="primary" className="gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                      Trade ${chainSymbol}
                    </Button>
                  </a>
                  <a href={`${EXPLORER_URL}/contract/${tokenAddress}`} target="_blank" rel="noopener noreferrer">
                    <Button size="md" variant="outline" className="gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      Explorer
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* ══ STATS BAR ══ */}
        {chainInfo && (
          <Section delay={0.15} className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Name', value: chainInfo.name },
                { label: 'Symbol', value: chainInfo.symbol },
                { label: 'Decimals', value: String(chainInfo.decimals) },
                { label: 'Total Supply', value: formatSupply(chainInfo.total_supply, chainInfo.decimals) },
              ].map(s => (
                <div key={s.label} className="bg-surface-1 border border-border rounded-[var(--radius-md)] p-3.5">
                  <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">{s.label}</p>
                  <p className="text-sm font-semibold text-text-primary truncate">{s.value}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ══ TABS ══ */}
        <Section delay={0.2} className="mb-6">
          <div className="flex border-b border-border">
            {(['overview', 'activity'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-semibold transition-colors relative capitalize ${
                  activeTab === tab ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="token-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                )}
              </button>
            ))}
          </div>
        </Section>

        {/* ══ TAB CONTENT ══ */}
        {activeTab === 'overview' ? (
          <div className="space-y-6">
            {/* Trust Score */}
            {data?.trustScore && (
              <Section delay={0.25}>
                <TrustScoreBreakdown data={data.trustScore} />
              </Section>
            )}

            {/* Risk Assessment */}
            <Section delay={0.3}>
              <Card>
                <CardContent>
                  <h2 className="text-base font-semibold text-text-primary mb-3">{t('riskAssessment')}</h2>
                  {project.riskFlags.length === 0 ? (
                    <div className="flex items-center gap-2 text-[var(--success)] text-sm">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{t('noRiskFlags')}</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {project.riskFlags.map((flag) => (
                        <Badge key={flag.id} variant="danger">{flag.flagType.replace(/_/g, ' ').toLowerCase()}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Section>

            {/* Marketing Info from chain */}
            {marketingInfo && (marketingInfo.description || marketingInfo.project || marketingInfo.marketing) && (
              <Section delay={0.35}>
                <Card>
                  <CardContent>
                    <h2 className="text-base font-semibold text-text-primary mb-3">On-Chain Marketing Info</h2>
                    <div className="space-y-3">
                      {marketingInfo.description && (
                        <div>
                          <p className="text-xs text-text-tertiary mb-1">Description</p>
                          <p className="text-text-secondary text-sm">{marketingInfo.description}</p>
                        </div>
                      )}
                      {marketingInfo.project && (
                        <div>
                          <p className="text-xs text-text-tertiary mb-1">Project URL</p>
                          <a href={marketingInfo.project} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover text-sm inline-flex items-center gap-1 transition-colors">
                            {marketingInfo.project}
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          </a>
                        </div>
                      )}
                      {marketingInfo.marketing && (
                        <div>
                          <p className="text-xs text-text-tertiary mb-1">Marketing Admin</p>
                          <div className="flex items-center gap-2">
                            <code className="text-text-secondary text-sm font-mono">{truncateAddress(marketingInfo.marketing, 10, 6)}</code>
                            <CopyButton text={marketingInfo.marketing} />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Section>
            )}

            {/* Minter */}
            {data.chainMinter && (
              <Section delay={0.38}>
                <Card>
                  <CardContent>
                    <h2 className="text-base font-semibold text-text-primary mb-3">Minter (Owner)</h2>
                    <div className="flex items-center gap-2">
                      <code className="text-text-secondary text-sm font-mono bg-surface-2 px-3 py-1.5 rounded-[var(--radius-sm)]">
                        {truncateAddress(data.chainMinter, 12, 8)}
                      </code>
                      <CopyButton text={data.chainMinter} />
                      {isOwner && <span className="text-accent text-xs font-medium">(you)</span>}
                    </div>
                  </CardContent>
                </Card>
              </Section>
            )}

            {/* About (owner-added) */}
            {project.descriptionLong && (
              <Section delay={0.4}>
                <Card>
                  <CardContent>
                    <h2 className="text-base font-semibold text-text-primary mb-3">{t('about')} {chainName}</h2>
                    <p className="text-text-secondary text-sm whitespace-pre-line leading-relaxed">{project.descriptionLong}</p>
                  </CardContent>
                </Card>
              </Section>
            )}

            {/* Tokenomics */}
            {tokenomics?.distribution && Object.keys(tokenomics.distribution).length > 0 && (
              <Section delay={0.45}>
                <Card>
                  <CardContent>
                    <h2 className="text-base font-semibold text-text-primary mb-4">{t('tokenomics')}</h2>
                    {totalSupply && decimals != null && (
                      <div className="mb-5">
                        <p className="text-xs text-text-tertiary mb-1">{t('totalSupply')}</p>
                        <p className="text-xl font-bold text-text-primary">{formatSupply(totalSupply, decimals)} {chainSymbol}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(tokenomics.distribution).map(([key, value]) => (
                        <div key={key} className="bg-surface-2 p-4 rounded-[var(--radius-md)] text-center border border-border">
                          <p className="text-xl font-bold text-text-primary">{value}%</p>
                          <p className="text-xs text-text-secondary capitalize mt-0.5">{key}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Section>
            )}

            {/* Links */}
            {hasLinks && (
              <Section delay={0.5}>
                <Card>
                  <CardContent>
                    <h2 className="text-base font-semibold text-text-primary mb-3">{t('links')}</h2>
                    <div className="flex flex-wrap gap-2">
                      {allLinks.telegram && (
                        <SocialLink href={allLinks.telegram} label="Telegram" icon={
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.154.232.17.327.015.095.034.311.019.478z"/></svg>
                        } />
                      )}
                      {allLinks.twitter && (
                        <SocialLink href={allLinks.twitter} label="Twitter / X" icon={
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        } />
                      )}
                      {allLinks.website && (
                        <SocialLink href={allLinks.website} label="Website" icon={
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                        } />
                      )}
                      {allLinks.discord && (
                        <SocialLink href={allLinks.discord} label="Discord" icon={
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                        } />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Section>
            )}

            {/* Contract Info */}
            <Section delay={0.55}>
              <Card>
                <CardContent>
                  <h2 className="text-base font-semibold text-text-primary mb-3">{t('contract')}</h2>
                  <div className="bg-surface-2 p-3.5 rounded-[var(--radius-sm)] flex items-center justify-between border border-border">
                    <code className="text-sm text-text-secondary break-all font-mono">{tokenAddress}</code>
                    <CopyButton text={tokenAddress} />
                  </div>
                  {project.createdAt && (
                    <p className="text-xs text-text-tertiary mt-2">{t('createdOn')} {formatDate(project.createdAt)}</p>
                  )}
                </CardContent>
              </Card>
            </Section>

            {/* Community */}
            <Section delay={0.6}>
              <Card>
                <CardContent>
                  <h2 className="text-base font-semibold text-text-primary mb-4">Community Reactions</h2>
                  <ReactionBar projectId={project.id || tokenAddress} />
                </CardContent>
              </Card>
            </Section>

            <Section delay={0.65}>
              <Card>
                <CardContent>
                  <CommentSection projectId={project.id || tokenAddress} />
                </CardContent>
              </Card>
            </Section>
          </div>
        ) : (
          /* Activity Tab */
          <div className="space-y-6">
            {data?.project?.changes && data.project.changes.length > 0 ? (
              <Section delay={0.25}>
                <ChangeHistory changes={data.project.changes} />
              </Section>
            ) : (
              <div className="py-16 text-center">
                <div className="w-14 h-14 mx-auto mb-3 bg-surface-2 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-text-secondary">No activity recorded yet</p>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-center text-text-tertiary text-xs mt-10">{t('disclaimer')}</p>
      </div>
    </div>
  )
}
