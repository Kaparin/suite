import { prisma } from '@/lib/prisma'
import type { Lock, LockTier } from '@prisma/client'
import { TIER_REQUIREMENTS, TIER_ORDER, toMicroAmount, fromMicroAmount, isTierSufficient } from './constants'
import { verifyOnChainBalance } from './verify'

/**
 * Calculate the highest achievable tier for a given amount and duration.
 * Returns null if requirements for even the lowest tier aren't met.
 */
export function calculateTier(amount: number, durationDays: number): LockTier | null {
  let bestTier: LockTier | null = null

  for (const tier of TIER_ORDER) {
    const req = TIER_REQUIREMENTS[tier]
    if (amount >= req.amount && durationDays >= req.durationDays) {
      bestTier = tier
    }
  }

  return bestTier
}

/**
 * Get user's highest active lock tier. Returns null if no active locks.
 */
export async function getUserTier(userId: string): Promise<LockTier | null> {
  const activeLocks = await prisma.lock.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'desc' },
  })

  if (activeLocks.length === 0) return null

  // Return the highest tier among active locks
  let highestTier: LockTier | null = null
  for (const lock of activeLocks) {
    if (!highestTier || TIER_ORDER.indexOf(lock.tier) > TIER_ORDER.indexOf(highestTier)) {
      highestTier = lock.tier
    }
  }

  return highestTier
}

/**
 * Get user's active locks.
 */
export async function getUserActiveLocks(userId: string): Promise<Lock[]> {
  return prisma.lock.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get all locks for a user (including expired/unlocked).
 */
export async function getUserLocks(userId: string): Promise<Lock[]> {
  return prisma.lock.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Create a new lock. Verifies on-chain balance before creating.
 */
export async function createLock(
  userId: string,
  walletAddress: string,
  amount: number,
  durationDays: number
): Promise<{ lock?: Lock; error?: string }> {
  // Calculate tier
  const tier = calculateTier(amount, durationDays)
  if (!tier) {
    return { error: 'Amount or duration too low for any tier' }
  }

  // Verify wallet belongs to user
  const wallet = await prisma.wallet.findFirst({
    where: { userId, address: walletAddress },
  })
  if (!wallet) {
    return { error: 'Wallet not found or does not belong to user' }
  }

  // Verify on-chain balance
  const balance = await verifyOnChainBalance(walletAddress)
  if (balance < amount) {
    return { error: `Insufficient LAUNCH balance. Required: ${amount}, Available: ${balance}` }
  }

  // Check for existing active lock on this wallet
  const existingLock = await prisma.lock.findFirst({
    where: {
      userId,
      walletAddress,
      status: 'ACTIVE',
    },
  })
  if (existingLock) {
    return { error: 'Active lock already exists for this wallet. Unlock first or wait for expiry.' }
  }

  // Create lock
  const lockEndDate = new Date()
  lockEndDate.setDate(lockEndDate.getDate() + durationDays)

  const lock = await prisma.lock.create({
    data: {
      userId,
      walletAddress,
      amount: toMicroAmount(amount),
      tier,
      durationDays,
      lockEndDate,
      lastVerifiedAt: new Date(),
    },
  })

  return { lock }
}

/**
 * Check if user has sufficient tier for an action.
 */
export async function canUserAccess(userId: string, requiredTier: LockTier): Promise<boolean> {
  const userTier = await getUserTier(userId)
  if (!userTier) return false
  return isTierSufficient(userTier, requiredTier)
}

/**
 * Process expired locks — called by cron.
 * Marks ACTIVE locks past their end date as EXPIRED.
 */
export async function processExpiredLocks(): Promise<number> {
  const result = await prisma.lock.updateMany({
    where: {
      status: 'ACTIVE',
      lockEndDate: { lt: new Date() },
    },
    data: { status: 'EXPIRED' },
  })
  return result.count
}

/**
 * Verify active locks on-chain — called by cron.
 * Checks that users still hold at least the locked amount.
 */
export async function verifyActiveLocks(): Promise<{ verified: number; violated: number }> {
  const activeLocks = await prisma.lock.findMany({
    where: { status: 'ACTIVE' },
  })

  let verified = 0
  let violated = 0

  for (const lock of activeLocks) {
    try {
      const balance = await verifyOnChainBalance(lock.walletAddress)
      const requiredAmount = fromMicroAmount(lock.amount)

      if (balance < requiredAmount) {
        await prisma.lock.update({
          where: { id: lock.id },
          data: { status: 'VIOLATED', lastVerifiedAt: new Date() },
        })
        violated++
      } else {
        await prisma.lock.update({
          where: { id: lock.id },
          data: { lastVerifiedAt: new Date() },
        })
        verified++
      }
    } catch (error) {
      console.error(`Failed to verify lock ${lock.id}:`, error)
    }
  }

  return { verified, violated }
}

/**
 * Unlock a lock (user action). Only allowed if lock is EXPIRED.
 */
export async function unlockLock(userId: string, lockId: string): Promise<{ success: boolean; error?: string }> {
  const lock = await prisma.lock.findFirst({
    where: { id: lockId, userId },
  })

  if (!lock) {
    return { success: false, error: 'Lock not found' }
  }

  if (lock.status !== 'EXPIRED' && lock.status !== 'VIOLATED') {
    return { success: false, error: 'Lock is still active. Wait for expiry.' }
  }

  await prisma.lock.update({
    where: { id: lockId },
    data: { status: 'UNLOCKED' },
  })

  return { success: true }
}

// Re-export utilities
export { TIER_REQUIREMENTS, TIER_ORDER, toMicroAmount, fromMicroAmount, isTierSufficient } from './constants'
export { verifyOnChainBalance } from './verify'
