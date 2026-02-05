/**
 * Wallet Verification System
 *
 * Proves wallet ownership via micro-transaction with unique code.
 *
 * Flow:
 * 1. User requests verification code
 * 2. Server generates unique code and stores it in DB with expiry
 * 3. User sends 0.001 AXM to verification address with memo = code
 * 4. Server monitors blockchain for the transaction
 * 5. Upon finding matching tx, marks wallet as verified
 * 6. Issues session token (JWT) for authenticated requests
 */

import { randomBytes } from 'crypto'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// Verification wallet address (should be controlled by the app)
// IMPORTANT: Set VERIFICATION_WALLET_ADDRESS in .env to your own wallet
export const VERIFICATION_ADDRESS = process.env.VERIFICATION_WALLET_ADDRESS || 'axm1weskc3hd8d5u0d5s0wprys0sqljqkcak6twd24'
export const VERIFICATION_AMOUNT = '1000' // 0.001 AXM = 1000 uaxm
export const VERIFICATION_AMOUNT_DISPLAY = '0.001' // Human readable

// JWT settings
const JWT_SECRET = process.env.JWT_SECRET || 'axiome-launch-suite-secret-key-change-in-production'
const JWT_EXPIRY = '7d' // Session lasts 7 days

// Fallback in-memory store (for edge cases when DB is unavailable)
const pendingVerificationsCache = new Map<string, {
  walletAddress: string
  code: string
  expiresAt: number
  createdAt: number
}>()

/**
 * Generate a unique verification code
 */
export function generateVerificationCode(): string {
  return randomBytes(16).toString('hex').toUpperCase()
}

/**
 * Create a new verification challenge for a wallet
 * Uses database for persistence with in-memory fallback
 */
export async function createVerificationChallengeAsync(
  walletAddress: string,
  userId: string
): Promise<{
  code: string
  expiresAt: number
  verificationAddress: string
  amount: string
}> {
  const code = generateVerificationCode()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  try {
    // Upsert to handle existing challenges
    await prisma.walletVerification.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: {
        code,
        expiresAt,
        userId
      },
      create: {
        walletAddress: walletAddress.toLowerCase(),
        code,
        expiresAt,
        userId
      }
    })

    console.log(`[Verification] Created challenge for ${walletAddress}: code=${code}`)
  } catch (error) {
    console.error('[Verification] DB error, using in-memory fallback:', error)
    // Fallback to in-memory
    pendingVerificationsCache.set(walletAddress.toLowerCase(), {
      walletAddress: walletAddress.toLowerCase(),
      code,
      expiresAt: expiresAt.getTime(),
      createdAt: Date.now()
    })
  }

  return {
    code,
    expiresAt: expiresAt.getTime(),
    verificationAddress: VERIFICATION_ADDRESS,
    amount: VERIFICATION_AMOUNT
  }
}

/**
 * Synchronous version for backwards compatibility
 * Uses only in-memory storage
 */
export function createVerificationChallenge(walletAddress: string): {
  code: string
  expiresAt: number
  verificationAddress: string
  amount: string
} {
  const code = generateVerificationCode()
  const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes

  // Store in memory cache
  pendingVerificationsCache.set(walletAddress.toLowerCase(), {
    walletAddress: walletAddress.toLowerCase(),
    code,
    expiresAt,
    createdAt: Date.now()
  })

  // Note: DB persistence requires userId, so sync version only uses in-memory cache.
  // Use createVerificationChallengeAsync() with userId for DB persistence.

  return {
    code,
    expiresAt,
    verificationAddress: VERIFICATION_ADDRESS,
    amount: VERIFICATION_AMOUNT
  }
}

/**
 * Get pending verification for a wallet
 * Checks both DB and in-memory cache
 */
export async function getPendingVerificationAsync(walletAddress: string): Promise<{
  walletAddress: string
  code: string
  expiresAt: number
  createdAt: number
} | null> {
  const normalizedAddress = walletAddress.toLowerCase()

  try {
    // First check DB
    const dbVerification = await prisma.walletVerification.findUnique({
      where: { walletAddress: normalizedAddress }
    })

    if (dbVerification) {
      // Check if expired
      if (new Date() > dbVerification.expiresAt) {
        await prisma.walletVerification.delete({
          where: { walletAddress: normalizedAddress }
        }).catch(() => {})
        return null
      }

      return {
        walletAddress: dbVerification.walletAddress,
        code: dbVerification.code,
        expiresAt: dbVerification.expiresAt.getTime(),
        createdAt: dbVerification.createdAt.getTime()
      }
    }
  } catch (error) {
    console.warn('[Verification] DB lookup failed, checking cache:', error)
  }

  // Fallback to in-memory cache
  const cacheVerification = pendingVerificationsCache.get(normalizedAddress)
  if (cacheVerification) {
    if (Date.now() > cacheVerification.expiresAt) {
      pendingVerificationsCache.delete(normalizedAddress)
      return null
    }
    return cacheVerification
  }

  return null
}

/**
 * Synchronous version - only checks in-memory cache
 */
export function getPendingVerification(walletAddress: string): {
  walletAddress: string
  code: string
  expiresAt: number
  createdAt: number
} | null {
  const normalizedAddress = walletAddress.toLowerCase()
  const verification = pendingVerificationsCache.get(normalizedAddress)

  if (!verification) return null

  // Check if expired
  if (Date.now() > verification.expiresAt) {
    pendingVerificationsCache.delete(normalizedAddress)
    return null
  }

  return verification
}

/**
 * Delete verification after successful verification
 */
export async function deleteVerification(walletAddress: string): Promise<void> {
  const normalizedAddress = walletAddress.toLowerCase()

  // Delete from cache
  pendingVerificationsCache.delete(normalizedAddress)

  // Delete from DB
  try {
    await prisma.walletVerification.delete({
      where: { walletAddress: normalizedAddress }
    })
    console.log(`[Verification] Deleted challenge for ${walletAddress}`)
  } catch (error) {
    // Ignore if not found
    console.warn('[Verification] Delete failed (may not exist):', error)
  }
}

/**
 * Verify a transaction matches the pending verification
 */
export function verifyTransaction(
  walletAddress: string,
  fromAddress: string,
  toAddress: string,
  memo: string
): boolean {
  const verification = getPendingVerification(walletAddress)

  if (!verification) {
    console.log(`[Verification] No pending verification for ${walletAddress}`)
    return false
  }

  // Check all conditions
  const isCorrectSender = fromAddress.toLowerCase() === walletAddress.toLowerCase()
  const isCorrectRecipient = toAddress.toLowerCase() === VERIFICATION_ADDRESS.toLowerCase()
  const isCorrectCode = memo.trim().toUpperCase() === verification.code

  console.log(`[Verification] Checking tx:`, {
    sender: isCorrectSender,
    recipient: isCorrectRecipient,
    code: isCorrectCode,
    expectedCode: verification.code,
    receivedMemo: memo
  })

  if (isCorrectSender && isCorrectRecipient && isCorrectCode) {
    // Clear pending verification
    pendingVerificationsCache.delete(walletAddress.toLowerCase())
    // Also delete from DB asynchronously
    deleteVerification(walletAddress).catch(() => {})
    return true
  }

  return false
}

// ============================================================
// STATELESS CHALLENGE TOKEN (for serverless environments)
// ============================================================

/**
 * Create a signed challenge token that contains all verification data
 * This eliminates the need for server-side state storage
 */
export function createChallengeToken(
  walletAddress: string,
  code: string,
  expiresAt: number
): string {
  return jwt.sign(
    {
      type: 'verification_challenge',
      walletAddress: walletAddress.toLowerCase(),
      code,
      expiresAt,
      verificationAddress: VERIFICATION_ADDRESS
    },
    JWT_SECRET,
    { expiresIn: '20m' } // Slightly longer than challenge expiry
  )
}

/**
 * Verify and decode a challenge token
 * Returns the challenge data if valid, null if invalid/expired
 */
export function verifyChallengeToken(token: string): {
  walletAddress: string
  code: string
  expiresAt: number
  verificationAddress: string
} | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      type: string
      walletAddress: string
      code: string
      expiresAt: number
      verificationAddress: string
    }

    // Verify it's a challenge token
    if (decoded.type !== 'verification_challenge') {
      return null
    }

    // Check if the challenge itself has expired
    if (Date.now() > decoded.expiresAt) {
      return null
    }

    return {
      walletAddress: decoded.walletAddress,
      code: decoded.code,
      expiresAt: decoded.expiresAt,
      verificationAddress: decoded.verificationAddress
    }
  } catch {
    return null
  }
}

// ============================================================
// SESSION TOKENS
// ============================================================

/**
 * Create a JWT session token for verified wallet
 */
export function createSessionToken(walletAddress: string): string {
  return jwt.sign(
    {
      walletAddress: walletAddress.toLowerCase(),
      verified: true,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  )
}

/**
 * Verify and decode a session token
 */
export function verifySessionToken(token: string): {
  walletAddress: string
  verified: boolean
} | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      walletAddress: string
      verified: boolean
    }
    return decoded
  } catch {
    return null
  }
}

/**
 * Clean up expired verifications in memory cache
 */
export function cleanupExpiredVerifications(): void {
  const now = Date.now()
  for (const [key, verification] of pendingVerificationsCache.entries()) {
    if (now > verification.expiresAt) {
      pendingVerificationsCache.delete(key)
    }
  }
}

/**
 * Clean up expired verifications in database
 */
export async function cleanupExpiredVerificationsInDB(): Promise<number> {
  try {
    const result = await prisma.walletVerification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
    if (result.count > 0) {
      console.log(`[Verification] Cleaned up ${result.count} expired verifications`)
    }
    return result.count
  } catch (error) {
    console.error('[Verification] DB cleanup failed:', error)
    return 0
  }
}

// Clean up in-memory cache every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredVerifications, 5 * 60 * 1000)
}

// Clean up DB every 15 minutes (less frequent to reduce DB load)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupExpiredVerificationsInDB().catch(() => {})
  }, 15 * 60 * 1000)
}
