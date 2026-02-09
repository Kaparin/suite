/**
 * Trust Score Calculator
 *
 * Multi-factor scoring system that evaluates token project trustworthiness.
 * Each factor produces a score from 0-100, then a weighted average yields the total.
 *
 * Factors:
 *  - Verification (20%): social links, website, project completeness
 *  - Liquidity (20%): pool size, reserves
 *  - Holders (15%): count, distribution
 *  - Activity (15%): transactions, volume
 *  - Contract (15%): risk flags, age
 *  - Community (15%): comments, reactions
 */

import { prisma } from '@/lib/prisma'
import { getTokenPoolData } from '@/lib/axiome/pool-discovery'
import { axiomeClient } from '@/lib/axiome/client'
import type { TrustRating } from '@prisma/client'

interface ScoreBreakdown {
  verificationScore: number
  liquidityScore: number
  holderScore: number
  activityScore: number
  contractScore: number
  communityScore: number
  totalScore: number
  rating: TrustRating
}

const WEIGHTS = {
  verification: 0.20,
  liquidity: 0.20,
  holders: 0.15,
  activity: 0.15,
  contract: 0.15,
  community: 0.15,
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.round(Math.max(min, Math.min(max, value)))
}

function getRating(score: number): TrustRating {
  if (score >= 80) return 'A'
  if (score >= 60) return 'B'
  if (score >= 40) return 'C'
  if (score >= 20) return 'D'
  return 'F'
}

// --- Factor calculators ---

function calcVerificationScore(project: {
  links: unknown
  descriptionShort: string | null
  descriptionLong: string | null
  logo: string | null
  isVerified: boolean
  tokenomics: unknown
}): number {
  let score = 0
  const links = project.links as Record<string, string> | null

  // Social links (up to 40 pts)
  if (links?.telegram) score += 10
  if (links?.twitter) score += 10
  if (links?.website) score += 10
  if (links?.discord) score += 10

  // Profile completeness (up to 40 pts)
  if (project.logo) score += 10
  if (project.descriptionShort) score += 10
  if (project.descriptionLong && project.descriptionLong.length > 50) score += 10
  if (project.tokenomics) score += 10

  // Verified badge (20 pts)
  if (project.isVerified) score += 20

  return clamp(score)
}

function calcLiquidityScore(poolData: {
  liquidity: number
  axmReserve: number
} | null): number {
  if (!poolData) return 0

  const liq = poolData.liquidity // in AXM
  // Scale: 0 AXM = 0, 100 AXM = 30, 1000 AXM = 60, 10000+ AXM = 100
  if (liq <= 0) return 0
  if (liq < 10) return clamp(liq * 3)         // 0-30
  if (liq < 100) return clamp(30 + (liq - 10) / 90 * 20)   // 30-50
  if (liq < 1000) return clamp(50 + (liq - 100) / 900 * 20)  // 50-70
  if (liq < 10000) return clamp(70 + (liq - 1000) / 9000 * 20) // 70-90
  return clamp(90 + Math.min(liq / 100000 * 10, 10)) // 90-100
}

function calcHolderScore(holdersCount: number): number {
  if (holdersCount <= 1) return 0
  if (holdersCount < 5) return 10
  if (holdersCount < 10) return 25
  if (holdersCount < 25) return 40
  if (holdersCount < 50) return 55
  if (holdersCount < 100) return 70
  if (holdersCount < 500) return 85
  return 100
}

function calcActivityScore(
  txCount: number,
  ageInDays: number
): number {
  if (ageInDays < 1) ageInDays = 1
  const dailyTxRate = txCount / ageInDays

  // Score based on daily transaction rate
  if (dailyTxRate < 1) return clamp(dailyTxRate * 20)
  if (dailyTxRate < 5) return clamp(20 + (dailyTxRate - 1) / 4 * 20)
  if (dailyTxRate < 20) return clamp(40 + (dailyTxRate - 5) / 15 * 20)
  if (dailyTxRate < 100) return clamp(60 + (dailyTxRate - 20) / 80 * 20)
  return clamp(80 + Math.min((dailyTxRate - 100) / 400 * 20, 20))
}

function calcContractScore(
  riskFlags: { flagType: string; severity: string; isActive: boolean }[],
  ageInDays: number
): number {
  let score = 100

  // Deduct for active risk flags
  const activeFlags = riskFlags.filter(f => f.isActive)
  for (const flag of activeFlags) {
    switch (flag.severity) {
      case 'CRITICAL': score -= 40; break
      case 'HIGH': score -= 25; break
      case 'MEDIUM': score -= 15; break
      case 'LOW': score -= 5; break
    }
  }

  // Bonus for age (maturity)
  if (ageInDays >= 30) score = Math.min(score + 10, 100)
  else if (ageInDays >= 7) score = Math.min(score + 5, 100)

  return clamp(score)
}

function calcCommunityScore(
  commentsCount: number,
  reactionsCount: number
): number {
  let score = 0

  // Comments (up to 60 pts)
  if (commentsCount >= 50) score += 60
  else if (commentsCount >= 20) score += 45
  else if (commentsCount >= 10) score += 30
  else if (commentsCount >= 5) score += 20
  else if (commentsCount >= 1) score += 10

  // Reactions (up to 40 pts)
  if (reactionsCount >= 100) score += 40
  else if (reactionsCount >= 50) score += 30
  else if (reactionsCount >= 20) score += 20
  else if (reactionsCount >= 5) score += 10
  else if (reactionsCount >= 1) score += 5

  return clamp(score)
}

/**
 * Calculate trust score for a single project.
 */
export async function calculateTrustScore(projectId: string): Promise<ScoreBreakdown | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      riskFlags: true,
      comments: { select: { id: true } },
      reactions: { select: { id: true } },
      metrics: {
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
  })

  if (!project) return null

  // Get pool data if token exists
  let poolData = null
  if (project.tokenAddress) {
    poolData = await getTokenPoolData(project.tokenAddress)
  }

  // Get holder count from latest metric
  const latestMetric = project.metrics[0]
  const holdersCount = latestMetric?.holdersEstimate ?? 0
  const txCount = latestMetric?.txCount ?? 0

  // Age
  const ageInDays = (Date.now() - project.createdAt.getTime()) / (1000 * 60 * 60 * 24)

  // Calculate each factor
  const verificationScore = calcVerificationScore(project)
  const liquidityScore = calcLiquidityScore(poolData)
  const holderScore = calcHolderScore(holdersCount)
  const activityScore = calcActivityScore(txCount, ageInDays)
  const contractScore = calcContractScore(project.riskFlags, ageInDays)
  const communityScore = calcCommunityScore(
    project.comments.length,
    project.reactions.length
  )

  // Weighted total
  const totalScore = clamp(Math.round(
    verificationScore * WEIGHTS.verification +
    liquidityScore * WEIGHTS.liquidity +
    holderScore * WEIGHTS.holders +
    activityScore * WEIGHTS.activity +
    contractScore * WEIGHTS.contract +
    communityScore * WEIGHTS.community
  ))

  const rating = getRating(totalScore)

  return {
    verificationScore,
    liquidityScore,
    holderScore,
    activityScore,
    contractScore,
    communityScore,
    totalScore,
    rating,
  }
}

/**
 * Calculate and persist trust score for a single project.
 */
export async function updateProjectTrustScore(projectId: string): Promise<ScoreBreakdown | null> {
  const breakdown = await calculateTrustScore(projectId)
  if (!breakdown) return null

  await prisma.trustScore.upsert({
    where: { projectId },
    update: {
      ...breakdown,
      calculatedAt: new Date(),
    },
    create: {
      projectId,
      ...breakdown,
    },
  })

  return breakdown
}

/**
 * Recalculate trust scores for all active projects.
 * Called from cron job.
 */
export async function recalculateAllTrustScores(): Promise<{ updated: number; errors: number }> {
  const projects = await prisma.project.findMany({
    where: {
      status: { in: ['PUBLISHED', 'LAUNCHED', 'UPCOMING', 'PRESALE'] },
    },
    select: { id: true, name: true },
  })

  let updated = 0
  let errors = 0

  for (const project of projects) {
    try {
      const result = await updateProjectTrustScore(project.id)
      if (result) {
        updated++
        console.log(`Trust score updated for ${project.name}: ${result.totalScore} (${result.rating})`)
      }
    } catch (error) {
      errors++
      console.error(`Error calculating trust score for ${project.name}:`, error)
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  return { updated, errors }
}

/**
 * Get trust score for a project, or null if not calculated.
 */
export async function getProjectTrustScore(projectId: string) {
  return prisma.trustScore.findUnique({
    where: { projectId },
  })
}
