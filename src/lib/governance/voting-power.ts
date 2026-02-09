import { prisma } from '@/lib/prisma'
import { getUserActiveLocks, getUserTier } from '@/lib/lock'
import { fromMicroAmount, isTierSufficient } from '@/lib/lock/constants'
import type { LockTier } from '@prisma/client'

// Tier multipliers for voting power
const TIER_MULTIPLIERS: Record<LockTier, number> = {
  EXPLORER: 1.0,
  BUILDER: 1.2,
  FOUNDER: 1.5,
  GOVERNOR: 2.0,
}

/**
 * Calculate voting power for a user.
 * Formula: sum(locked_amount x tier_multiplier) for each active lock.
 */
export async function getVotingPower(userId: string): Promise<number> {
  const activeLocks = await getUserActiveLocks(userId)

  if (activeLocks.length === 0) return 0

  let totalPower = 0

  for (const lock of activeLocks) {
    const amount = fromMicroAmount(lock.amount)
    const multiplier = TIER_MULTIPLIERS[lock.tier] ?? 1.0
    totalPower += amount * multiplier
  }

  return Math.floor(totalPower)
}

/**
 * Check if user can vote (requires EXPLORER+ tier).
 */
export async function canVote(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId)
  if (!tier) return false
  return isTierSufficient(tier, 'EXPLORER')
}

/**
 * Check if user can create proposals (requires GOVERNOR tier).
 */
export async function canPropose(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId)
  if (!tier) return false
  return isTierSufficient(tier, 'GOVERNOR')
}

/**
 * Process expired proposals — called from cron.
 * Evaluates proposals past their endDate and updates their status.
 */
export async function processExpiredProposals(): Promise<{
  passed: number
  rejected: number
  expired: number
}> {
  const expiredProposals = await prisma.proposal.findMany({
    where: {
      status: 'ACTIVE',
      endDate: { lt: new Date() },
    },
  })

  let passed = 0
  let rejected = 0
  let expired = 0

  for (const proposal of expiredProposals) {
    const totalVotes = proposal.votesFor + proposal.votesAgainst

    // Check quorum
    if (totalVotes < proposal.quorum) {
      await prisma.proposal.update({
        where: { id: proposal.id },
        data: { status: 'EXPIRED' },
      })
      expired++
      continue
    }

    // Check threshold
    const forPercentage = totalVotes > 0
      ? (proposal.votesFor / totalVotes) * 100
      : 0

    if (forPercentage >= proposal.threshold) {
      await prisma.proposal.update({
        where: { id: proposal.id },
        data: { status: 'PASSED' },
      })
      passed++

      // Execute passed proposals
      try {
        await executeProposal(proposal)
      } catch (error) {
        console.error(`[Governance] Failed to execute proposal ${proposal.id}:`, error)
      }
    } else {
      await prisma.proposal.update({
        where: { id: proposal.id },
        data: { status: 'REJECTED' },
      })
      rejected++
    }
  }

  return { passed, rejected, expired }
}

/**
 * Execute a passed proposal by applying its effects.
 */
async function executeProposal(proposal: {
  id: string
  type: string
  projectId: string | null
}): Promise<void> {
  switch (proposal.type) {
    case 'FEATURE_PROJECT':
      if (proposal.projectId) {
        await prisma.project.update({
          where: { id: proposal.projectId },
          data: { isFeatured: true },
        })
      }
      break

    case 'DELIST_PROJECT':
      if (proposal.projectId) {
        await prisma.project.update({
          where: { id: proposal.projectId },
          data: { status: 'ARCHIVED' },
        })
      }
      break

    case 'PLATFORM_CHANGE':
      // Platform changes require manual implementation;
      // mark as EXECUTED to signal the team.
      break

    case 'COMMUNITY_PICK':
      if (proposal.projectId) {
        await prisma.project.update({
          where: { id: proposal.projectId },
          data: { isFeatured: true },
        })
      }
      break
  }

  await prisma.proposal.update({
    where: { id: proposal.id },
    data: { status: 'EXECUTED' },
  })
}
