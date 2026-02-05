/**
 * Telegram Login Widget Validation
 *
 * Validates data from Telegram Login Widget using HMAC-SHA256.
 * https://core.telegram.org/widgets/login#checking-authorization
 */

import crypto from 'crypto'

export interface TelegramAuthData {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

/**
 * Validate Telegram Login Widget data
 * @param authData - Data received from Telegram widget
 * @returns true if data is valid and not expired
 */
export function validateTelegramAuth(authData: TelegramAuthData): boolean {
  if (!BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not set')
    return false
  }

  const { hash, ...data } = authData

  // Check if auth_date is not too old (max 1 day)
  const authDate = data.auth_date
  const now = Math.floor(Date.now() / 1000)
  if (now - authDate > 86400) {
    console.error('Telegram auth data expired')
    return false
  }

  // Create data-check-string
  const checkString = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key as keyof typeof data]}`)
    .join('\n')

  // Create secret key = SHA256(bot_token)
  const secretKey = crypto
    .createHash('sha256')
    .update(BOT_TOKEN)
    .digest()

  // Calculate HMAC-SHA256
  const hmac = crypto
    .createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex')

  return hmac === hash
}

/**
 * Parse Telegram auth data from URL params or form data
 */
export function parseTelegramAuthData(data: Record<string, string>): TelegramAuthData | null {
  try {
    return {
      id: parseInt(data.id),
      first_name: data.first_name,
      last_name: data.last_name,
      username: data.username,
      photo_url: data.photo_url,
      auth_date: parseInt(data.auth_date),
      hash: data.hash
    }
  } catch {
    return null
  }
}

// ============================================================
// V2 Session Tokens (simplified — only identity, no wallet data)
// ============================================================

const JWT_SECRET = process.env.JWT_SECRET || 'axiome-launch-suite-secret-key-change-in-production'

/**
 * Create V2 session token — contains only userId and telegramId.
 * Wallet data is NEVER stored in the token, so the token stays valid
 * regardless of wallet changes.
 */
export function createSessionTokenV2(userId: string, telegramId: string): string {
  const jwt = require('jsonwebtoken')
  return jwt.sign(
    {
      sub: userId,
      tid: telegramId,
      v: 2,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

/**
 * Verify and decode a session token (supports both V1 and V2).
 * Returns normalized { userId, telegramId } regardless of version.
 */
export function verifySessionTokenV2(token: string): {
  userId: string
  telegramId: string
} | null {
  try {
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>

    // V2 token
    if (decoded.v === 2) {
      return {
        userId: decoded.sub as string,
        telegramId: decoded.tid as string
      }
    }

    // V1 token (backward compatibility)
    if (decoded.userId && decoded.telegramId) {
      return {
        userId: decoded.userId as string,
        telegramId: decoded.telegramId as string
      }
    }

    return null
  } catch {
    return null
  }
}

// ============================================================
// V1 Session Tokens (deprecated — kept for backward compat during migration)
// ============================================================

/**
 * @deprecated Use createSessionTokenV2 instead
 */
export function createTelegramSessionToken(
  telegramId: string,
  userId: string,
  walletAddress?: string | null
): string {
  const jwt = require('jsonwebtoken')
  return jwt.sign(
    {
      telegramId,
      userId,
      walletAddress: walletAddress || null,
      verified: !!walletAddress,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

/**
 * @deprecated Use verifySessionTokenV2 instead
 */
export function verifyTelegramSessionToken(token: string): {
  telegramId: string
  userId: string
  walletAddress: string | null
  verified: boolean
} | null {
  try {
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>

    // Handle V2 tokens transparently
    if (decoded.v === 2) {
      return {
        telegramId: decoded.tid as string,
        userId: decoded.sub as string,
        walletAddress: null,
        verified: false
      }
    }

    return {
      telegramId: decoded.telegramId as string,
      userId: decoded.userId as string,
      walletAddress: (decoded.walletAddress as string) || null,
      verified: !!decoded.verified
    }
  } catch {
    return null
  }
}
