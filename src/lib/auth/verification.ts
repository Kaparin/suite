/**
 * Wallet Verification System
 *
 * Proves wallet ownership via micro-transaction with unique code.
 *
 * Flow:
 * 1. User requests verification code
 * 2. Server generates unique code and stores it with expiry
 * 3. User sends 0.001 AXM to verification address with memo = code
 * 4. Server monitors blockchain for the transaction
 * 5. Upon finding matching tx, marks wallet as verified
 * 6. Issues session token (JWT) for authenticated requests
 */

import { randomBytes } from 'crypto'
import jwt from 'jsonwebtoken'

// Verification wallet address (should be controlled by the app)
// IMPORTANT: Set VERIFICATION_WALLET_ADDRESS in .env to your own wallet
export const VERIFICATION_ADDRESS = process.env.VERIFICATION_WALLET_ADDRESS || 'axm1weskc3hd8d5u0d5s0wprys0sqljqkcak6twd24' // Default for testing
export const VERIFICATION_AMOUNT = '1000' // 0.001 AXM = 1000 uaxm
export const VERIFICATION_AMOUNT_DISPLAY = '0.001' // Human readable

// JWT settings
const JWT_SECRET = process.env.JWT_SECRET || 'axiome-launch-suite-secret-key-change-in-production'
const JWT_EXPIRY = '7d' // Session lasts 7 days

// In-memory store for pending verifications (use Redis in production)
const pendingVerifications = new Map<string, {
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
 */
export function createVerificationChallenge(walletAddress: string): {
  code: string
  expiresAt: number
  verificationAddress: string
  amount: string
} {
  const code = generateVerificationCode()
  const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes

  // Store pending verification
  pendingVerifications.set(walletAddress.toLowerCase(), {
    walletAddress: walletAddress.toLowerCase(),
    code,
    expiresAt,
    createdAt: Date.now()
  })

  return {
    code,
    expiresAt,
    verificationAddress: VERIFICATION_ADDRESS,
    amount: VERIFICATION_AMOUNT
  }
}

/**
 * Get pending verification for a wallet
 */
export function getPendingVerification(walletAddress: string) {
  const verification = pendingVerifications.get(walletAddress.toLowerCase())

  if (!verification) return null

  // Check if expired
  if (Date.now() > verification.expiresAt) {
    pendingVerifications.delete(walletAddress.toLowerCase())
    return null
  }

  return verification
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
    return false
  }

  // Check all conditions
  const isCorrectSender = fromAddress.toLowerCase() === walletAddress.toLowerCase()
  const isCorrectRecipient = toAddress.toLowerCase() === VERIFICATION_ADDRESS.toLowerCase()
  const isCorrectCode = memo.trim().toUpperCase() === verification.code

  if (isCorrectSender && isCorrectRecipient && isCorrectCode) {
    // Clear pending verification
    pendingVerifications.delete(walletAddress.toLowerCase())
    return true
  }

  return false
}

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
 * Clean up expired verifications (call periodically)
 */
export function cleanupExpiredVerifications(): void {
  const now = Date.now()
  for (const [key, verification] of pendingVerifications.entries()) {
    if (now > verification.expiresAt) {
      pendingVerifications.delete(key)
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredVerifications, 5 * 60 * 1000)
}
