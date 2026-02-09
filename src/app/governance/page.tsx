'use client'

import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/auth/useAuth'
import { Card, CardContent, Button, Badge } from '@/components/ui'
import { useState, useEffect, useCallback } from 'react'

/* ─── Types ─── */

interface Proposal {
  id: string
  title: string
  description: string
  type: 'FEATURE_PROJECT' | 'DELIST_PROJECT' | 'PLATFORM_CHANGE' | 'COMMUNITY_PICK'
  projectId: string | null
  quorum: number
  threshold: number
  startDate: string
  endDate: string
  status: 'ACTIVE' | 'PASSED' | 'REJECTED' | 'EXECUTED' | 'EXPIRED'
  votesFor: number
  votesAgainst: number
  totalVotes: number
  author: {
    id: string
    username: string | null
    firstName: string | null
  }
  userVote: boolean | null
  createdAt: string
}

/* ─── Helpers ─── */

function getTimeLeft(endDate: string): string {
  const diff = new Date(endDate).getTime() - Date.now()
  if (diff <= 0) return ''
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d ${hours}h`
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
}

/* ─── Status Badge Colors ─── */

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-500/15 text-green-400 border-green-500/25',
  PASSED: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  REJECTED: 'bg-red-500/15 text-red-400 border-red-500/25',
  EXECUTED: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
  EXPIRED: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
}

const TYPE_COLORS: Record<string, string> = {
  FEATURE_PROJECT: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  DELIST_PROJECT: 'bg-red-500/15 text-red-400 border-red-500/25',
  PLATFORM_CHANGE: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  COMMUNITY_PICK: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
}

/* ─── Page ─── */

export default function GovernancePage() {
  const t = useTranslations('governance')
  const { user, token, isAuthenticated } = useAuth()

  const [proposals, setProposals] = useState<Proposal[]>([])
  const [userVotingPower, setUserVotingPower] = useState(0)
  const [loading, setLoading] = useState(true)
  const [votingId, setVotingId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formType, setFormType] = useState<string>('PLATFORM_CHANGE')
  const [formDuration, setFormDuration] = useState('7')

  const fetchProposals = useCallback(async () => {
    try {
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const res = await fetch('/api/governance/proposals', { headers })
      if (res.ok) {
        const data = await res.json()
        setProposals(data.proposals)
        setUserVotingPower(data.userVotingPower || 0)
      }
    } catch (error) {
      console.error('Failed to fetch proposals:', error)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  /* ─── Vote ─── */

  async function handleVote(proposalId: string, inFavor: boolean) {
    if (!token) return
    setVotingId(proposalId)
    try {
      const res = await fetch(`/api/governance/proposals/${proposalId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inFavor }),
      })
      if (res.ok) {
        await fetchProposals()
      } else {
        const data = await res.json()
        console.error('Vote failed:', data.error)
      }
    } catch (error) {
      console.error('Vote error:', error)
    } finally {
      setVotingId(null)
    }
  }

  /* ─── Create Proposal ─── */

  async function handleCreateProposal(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setFormSubmitting(true)
    try {
      const res = await fetch('/api/governance/proposals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          type: formType,
          durationDays: parseInt(formDuration),
        }),
      })
      if (res.ok) {
        setShowCreateForm(false)
        setFormTitle('')
        setFormDescription('')
        setFormType('PLATFORM_CHANGE')
        setFormDuration('7')
        await fetchProposals()
      } else {
        const data = await res.json()
        console.error('Create proposal failed:', data.error)
      }
    } catch (error) {
      console.error('Create proposal error:', error)
    } finally {
      setFormSubmitting(false)
    }
  }

  /* ─── Render ─── */

  const activeProposals = proposals.filter(p => p.status === 'ACTIVE')
  const pastProposals = proposals.filter(p => p.status !== 'ACTIVE')
  const isGovernor = user?.tier === 'GOVERNOR'

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a12] to-[#12121e]">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-20">
        {/* ─── Hero ─── */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            {t('title')}
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            {t('subtitle')}
          </p>

          {/* Voting power display */}
          {isAuthenticated && userVotingPower > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full">
              <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-violet-300 text-sm font-medium">
                {t('votingPower')}: {userVotingPower.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* ─── Create Proposal Button ─── */}
        {isAuthenticated && isGovernor && (
          <div className="flex justify-end mb-6">
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              {t('createProposal')}
            </Button>
          </div>
        )}

        {isAuthenticated && !isGovernor && user?.tier && (
          <div className="mb-6 text-center">
            <p className="text-sm text-zinc-500">{t('requiresGovernor')}</p>
          </div>
        )}

        {/* ─── Create Proposal Form ─── */}
        {showCreateForm && (
          <Card className="mb-8 border-violet-500/20 bg-[#16162a]/80">
            <CardContent className="p-6">
              <form onSubmit={handleCreateProposal} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">
                    {t('form.title')}
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    required
                    maxLength={200}
                    className="w-full px-3 py-2 bg-[#0f0f1a] border border-zinc-700/50 rounded-lg text-white placeholder-zinc-500 focus:border-violet-500/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">
                    {t('form.description')}
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    required
                    rows={4}
                    maxLength={5000}
                    className="w-full px-3 py-2 bg-[#0f0f1a] border border-zinc-700/50 rounded-lg text-white placeholder-zinc-500 focus:border-violet-500/50 focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">
                      {t('form.type')}
                    </label>
                    <select
                      value={formType}
                      onChange={e => setFormType(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0f0f1a] border border-zinc-700/50 rounded-lg text-white focus:border-violet-500/50 focus:outline-none"
                    >
                      <option value="FEATURE_PROJECT">{t('type.FEATURE_PROJECT')}</option>
                      <option value="DELIST_PROJECT">{t('type.DELIST_PROJECT')}</option>
                      <option value="PLATFORM_CHANGE">{t('type.PLATFORM_CHANGE')}</option>
                      <option value="COMMUNITY_PICK">{t('type.COMMUNITY_PICK')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">
                      {t('form.duration')}
                    </label>
                    <input
                      type="number"
                      value={formDuration}
                      onChange={e => setFormDuration(e.target.value)}
                      min={1}
                      max={30}
                      className="w-full px-3 py-2 bg-[#0f0f1a] border border-zinc-700/50 rounded-lg text-white focus:border-violet-500/50 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={formSubmitting}
                    className="bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50"
                  >
                    {formSubmitting ? t('form.submitting') : t('form.submit')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ─── Loading ─── */}
        {loading && (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto" />
          </div>
        )}

        {/* ─── Active Proposals ─── */}
        {!loading && (
          <>
            <h2 className="text-xl font-semibold text-white mb-4">
              {t('activeProposals')}
            </h2>

            {activeProposals.length === 0 ? (
              <div className="text-center py-10 mb-10">
                <p className="text-zinc-500">{t('noProposals')}</p>
              </div>
            ) : (
              <div className="space-y-4 mb-10">
                {activeProposals.map(proposal => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    t={t}
                    isAuthenticated={isAuthenticated}
                    userTier={user?.tier || null}
                    votingId={votingId}
                    onVote={handleVote}
                  />
                ))}
              </div>
            )}

            {/* ─── Past Proposals ─── */}
            {pastProposals.length > 0 && (
              <>
                <h2 className="text-xl font-semibold text-white mb-4">
                  {t('pastProposals')}
                </h2>
                <div className="space-y-4">
                  {pastProposals.map(proposal => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      t={t}
                      isAuthenticated={isAuthenticated}
                      userTier={user?.tier || null}
                      votingId={votingId}
                      onVote={handleVote}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ─── Not authenticated hint ─── */}
        {!isAuthenticated && !loading && (
          <div className="text-center mt-6">
            <p className="text-sm text-zinc-500">{t('requiresTier')}</p>
          </div>
        )}
      </main>
    </div>
  )
}

/* ─── Proposal Card ─── */

function ProposalCard({
  proposal,
  t,
  isAuthenticated,
  userTier,
  votingId,
  onVote,
}: {
  proposal: Proposal
  t: ReturnType<typeof useTranslations>
  isAuthenticated: boolean
  userTier: string | null
  votingId: string | null
  onVote: (proposalId: string, inFavor: boolean) => void
}) {
  const totalPower = proposal.votesFor + proposal.votesAgainst
  const forPercent = totalPower > 0 ? (proposal.votesFor / totalPower) * 100 : 50
  const againstPercent = totalPower > 0 ? (proposal.votesAgainst / totalPower) * 100 : 50
  const isActive = proposal.status === 'ACTIVE'
  const hasVoted = proposal.userVote !== null
  const isVoting = votingId === proposal.id
  const timeLeft = isActive ? getTimeLeft(proposal.endDate) : ''
  const canUserVote = isAuthenticated && !!userTier && isActive && !hasVoted

  return (
    <Card className="border-zinc-800/50 bg-[#14142a]/60 hover:border-zinc-700/50 transition-colors">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">
              {proposal.title}
            </h3>
            <p className="text-sm text-zinc-500 mt-0.5">
              {proposal.author.username
                ? `@${proposal.author.username}`
                : proposal.author.firstName || 'Anonymous'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={`text-xs border ${TYPE_COLORS[proposal.type] || ''}`}>
              {t(`type.${proposal.type}` as Parameters<typeof t>[0])}
            </Badge>
            <Badge className={`text-xs border ${STATUS_COLORS[proposal.status] || ''}`}>
              {t(`status.${proposal.status}` as Parameters<typeof t>[0])}
            </Badge>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
          {proposal.description}
        </p>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
            <span className="text-green-400">
              {t('voteFor')} ({proposal.votesFor.toLocaleString()})
            </span>
            <span className="text-red-400">
              {t('voteAgainst')} ({proposal.votesAgainst.toLocaleString()})
            </span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              className="bg-green-500/80 transition-all duration-500"
              style={{ width: `${totalPower > 0 ? forPercent : 50}%` }}
            />
            <div
              className="bg-red-500/80 transition-all duration-500"
              style={{ width: `${totalPower > 0 ? againstPercent : 50}%` }}
            />
          </div>
        </div>

        {/* Meta + Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>
              {t('quorum')}: {proposal.votesFor + proposal.votesAgainst}/{proposal.quorum}
            </span>
            {isActive && timeLeft && (
              <span>
                {t('timeLeft')}: {timeLeft}
              </span>
            )}
            {!isActive && (
              <span>{t('ended')}</span>
            )}
          </div>

          {/* Vote buttons */}
          <div className="flex items-center gap-2">
            {hasVoted && (
              <span className="text-xs text-violet-400 font-medium px-2 py-1 bg-violet-500/10 rounded">
                {t('voted')} {proposal.userVote ? '(+)' : '(-)'}
              </span>
            )}
            {canUserVote && (
              <>
                <Button
                  onClick={() => onVote(proposal.id, true)}
                  disabled={isVoting}
                  className="text-xs px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/20 disabled:opacity-50"
                >
                  {t('voteFor')}
                </Button>
                <Button
                  onClick={() => onVote(proposal.id, false)}
                  disabled={isVoting}
                  className="text-xs px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/20 disabled:opacity-50"
                >
                  {t('voteAgainst')}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
