/**
 * Wallet Verification System
 *
 * Proves wallet ownership via micro-transaction with unique code.
 *
 * Flow:
 * 1. Authenticated user requests verification code via /api/auth/wallet/bind
 * 2. Server generates unique code and stores it in DB with expiry
 * 3. User sends 0.001 AXM to verification address with memo = code
 * 4. Server monitors blockchain for the transaction via /api/auth/wallet/verify
 * 5. Upon finding matching tx, creates Wallet record linked to user
 */

import { randomBytes } from 'crypto'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// Verification wallet address (should be controlled by the app)
// IMPORTANT: Set VERIFICATION_WALLET_ADDRESS in .env to your own wallet
export const VERIFICATION_ADDRESS = process.env.VERIFICATION_WALLET_ADDRESS || 'axm1weskc3hd8d5u0d5s0wprys0sqljqkcak6twd24'
export const VERIFICATION_AMOUNT = '1000' // 0.001 AXM = 1000 uaxm
export const VERIFICATION_AMOUNT_DISPLAY = '0.001' // Human readable

// JWT settings for challenge tokens
const JWT_SECRET = process.env.JWT_SECRET || 'axiome-launch-suite-secret-key-change-in-production'

/**
 * Generate a unique verification code
 */
export function generateVerificationCode(): string {
  return randomBytes(16).toString('hex').toUpperCase()
}

/**
 * Create a new verification challenge for a wallet.
 * Requires userId — anonymous verification is not supported.
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

  return {
    code,
    expiresAt: expiresAt.getTime(),
    verificationAddress: VERIFICATION_ADDRESS,
    amount: VERIFICATION_AMOUNT
  }
}

/**
 * Get pending verification for a wallet from DB
 */
export async function getPendingVerificationAsync(walletAddress: string): Promise<{
  walletAddress: string
  code: string
  expiresAt: number
  createdAt: number
  userId: string
} | null> {
  const normalizedAddress = walletAddress.toLowerCase()

  const dbVerification = await prisma.walletVerification.findUnique({
    where: { walletAddress: normalizedAddress }
  })

  if (!dbVerification) {
    return null
  }

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
    createdAt: dbVerification.createdAt.getTime(),
    userId: dbVerification.userId
  }
}

/**
 * Delete verification after successful verification
 */
export async function deleteVerification(walletAddress: string): Promise<void> {
  const normalizedAddress = walletAddress.toLowerCase()

  try {
    await prisma.walletVerification.delete({
      where: { walletAddress: normalizedAddress }
    })
    console.log(`[Verification] Deleted challenge for ${walletAddress}`)
  } catch {
    // Ignore if not found
  }
}

/**
 * Verify a transaction matches the pending verification.
 * Returns true if valid, false otherwise.
 */
export async function verifyTransactionAsync(
  walletAddress: string,
  fromAddress: string,
  toAddress: string,
  memo: string
): Promise<boolean> {
  const verification = await getPendingVerificationAsync(walletAddress)

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
    await deleteVerification(walletAddress)
    return true
  }

  return false
}

// ============================================================
// STATELESS CHALLENGE TOKEN (for serverless environments)
// ============================================================

/**
 * Create a signed challenge token that contains all verification data.
 * Used by WalletBindModal to maintain state across polling.
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
 * Verify and decode a challenge token.
 * Returns the challenge data if valid, null if invalid/expired.
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

// Clean up DB every 15 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupExpiredVerificationsInDB().catch(() => {})
  }, 15 * 60 * 1000)
}
