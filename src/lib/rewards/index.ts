import { prisma } from '@/lib/prisma'

// Reward amounts in LAUNCH (human units)
const REWARD_AMOUNTS: Record<string, number> = {
  TOKEN_REVIEW: 5,        // 5 LAUNCH per quality review
  SCAM_REPORT: 20,        // 20 LAUNCH for confirmed scam report
  PROJECT_UPDATE: 2,      // 2 LAUNCH for project update
  DAILY_ACTIVITY: 1,      // 1 LAUNCH daily activity bonus
}

// Anti-gaming limits (max rewards per type per day)
const DAILY_LIMITS: Record<string, number> = {
  TOKEN_REVIEW: 3,        // Max 3 review rewards per day
  SCAM_REPORT: 1,         // Max 1 scam report per day
  PROJECT_UPDATE: 5,      // Max 5 updates per day
  DAILY_ACTIVITY: 1,      // Once per day
}

// Minimum comment length to qualify for a review reward
const MIN_REVIEW_LENGTH = 50

/**
 * Get the start of the current day (UTC) for daily limit checks.
 */
function startOfDayUTC(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

/**
 * Count how many rewards of a given type the user has received today.
 */
async function getDailyRewardCount(userId: string, type: string): Promise<number> {
  const dayStart = startOfDayUTC()
  return prisma.rewardEvent.count({
    where: {
      userId,
      type: type as 'TOKEN_REVIEW' | 'SCAM_REPORT' | 'PROJECT_UPDATE' | 'DAILY_ACTIVITY',
      createdAt: { gte: dayStart },
    },
  })
}

/**
 * Quality check for reviews: minimum length, not a duplicate comment.
 * Returns true if the review meets quality standards.
 */
async function isQualityReview(userId: string, projectId: string, commentId: string): Promise<boolean> {
  // Look up the comment to check length
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { content: true, userId: true, projectId: true },
  })

  if (!comment) return false

  // Must be the user's own comment
  if (comment.userId !== userId) return false

  // Must belong to the specified project
  if (comment.projectId !== projectId) return false

  // Minimum length check
  if (comment.content.length < MIN_REVIEW_LENGTH) return false

  // Check for duplicate: user already got a reward for this exact project
  const existingReward = await prisma.rewardEvent.findFirst({
    where: {
      userId,
      projectId,
      type: 'TOKEN_REVIEW',
    },
  })

  if (existingReward) return false

  return true
}

/**
 * Create a reward for a quality token review.
 *
 * Checks:
 * - Daily limit not exceeded
 * - Comment meets quality standards (min length, no duplicate)
 */
export async function createReviewReward(
  userId: string,
  projectId: string,
  commentId: string
): Promise<{ success: boolean; error?: string }> {
  // Check daily limit
  const todayCount = await getDailyRewardCount(userId, 'TOKEN_REVIEW')
  if (todayCount >= DAILY_LIMITS.TOKEN_REVIEW) {
    return { success: false, error: 'Daily review reward limit reached' }
  }

  // Quality check
  const qualityOk = await isQualityReview(userId, projectId, commentId)
  if (!qualityOk) {
    return { success: false, error: 'Review does not meet quality requirements (min 50 chars, no duplicate for same project)' }
  }

  // Create the reward event
  await prisma.rewardEvent.create({
    data: {
      userId,
      type: 'TOKEN_REVIEW',
      amount: REWARD_AMOUNTS.TOKEN_REVIEW,
      status: 'PENDING',
      projectId,
      commentId,
    },
  })

  return { success: true }
}

/**
 * Create a reward for a confirmed scam report.
 * Typically called by admin/moderation flow after verifying the report.
 */
export async function createScamReportReward(
  userId: string,
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  const todayCount = await getDailyRewardCount(userId, 'SCAM_REPORT')
  if (todayCount >= DAILY_LIMITS.SCAM_REPORT) {
    return { success: false, error: 'Daily scam report reward limit reached' }
  }

  await prisma.rewardEvent.create({
    data: {
      userId,
      type: 'SCAM_REPORT',
      amount: REWARD_AMOUNTS.SCAM_REPORT,
      status: 'PENDING',
      projectId,
    },
  })

  return { success: true }
}

/**
 * Create a reward for a project update.
 */
export async function createProjectUpdateReward(
  userId: string,
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  const todayCount = await getDailyRewardCount(userId, 'PROJECT_UPDATE')
  if (todayCount >= DAILY_LIMITS.PROJECT_UPDATE) {
    return { success: false, error: 'Daily project update reward limit reached' }
  }

  await prisma.rewardEvent.create({
    data: {
      userId,
      type: 'PROJECT_UPDATE',
      amount: REWARD_AMOUNTS.PROJECT_UPDATE,
      status: 'PENDING',
      projectId,
    },
  })

  return { success: true }
}

/**
 * Create a daily activity bonus reward.
 * Should be called once per user per day (e.g., on first login or first action).
 */
export async function createDailyActivityReward(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const todayCount = await getDailyRewardCount(userId, 'DAILY_ACTIVITY')
  if (todayCount >= DAILY_LIMITS.DAILY_ACTIVITY) {
    return { success: false, error: 'Daily activity reward already claimed today' }
  }

  await prisma.rewardEvent.create({
    data: {
      userId,
      type: 'DAILY_ACTIVITY',
      amount: REWARD_AMOUNTS.DAILY_ACTIVITY,
      status: 'APPROVED', // Auto-approved for daily activity
    },
  })

  return { success: true }
}

/**
 * Get user's reward history (most recent first).
 */
export async function getUserRewards(
  userId: string,
  limit = 50,
  offset = 0
) {
  return prisma.rewardEvent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })
}

/**
 * Get user's total earned / pending / paid amounts.
 */
export async function getUserRewardStats(userId: string) {
  const rewards = await prisma.rewardEvent.findMany({
    where: { userId },
    select: { amount: true, status: true },
  })

  let totalEarned = 0
  let pending = 0
  let approved = 0
  let paid = 0
  let rejected = 0

  for (const r of rewards) {
    if (r.status === 'REJECTED') {
      rejected += r.amount
      continue
    }
    totalEarned += r.amount

    if (r.status === 'PENDING') {
      pending += r.amount
    } else if (r.status === 'APPROVED') {
      approved += r.amount
    } else if (r.status === 'PAID') {
      paid += r.amount
    }
  }

  return { totalEarned, pending, approved, paid, rejected }
}

/**
 * Claim approved rewards: mark all APPROVED rewards as PAID.
 * In the future this would trigger an actual on-chain payout.
 * For now it just updates the status.
 */
export async function claimRewards(userId: string): Promise<{ success: boolean; claimedAmount: number }> {
  // Find all approved rewards
  const approvedRewards = await prisma.rewardEvent.findMany({
    where: {
      userId,
      status: 'APPROVED',
    },
  })

  if (approvedRewards.length === 0) {
    return { success: true, claimedAmount: 0 }
  }

  const claimedAmount = approvedRewards.reduce((sum, r) => sum + r.amount, 0)

  // Mark all as PAID
  await prisma.rewardEvent.updateMany({
    where: {
      userId,
      status: 'APPROVED',
    },
    data: {
      status: 'PAID',
    },
  })

  return { success: true, claimedAmount }
}
