import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/auth/verification'
import { verifyTelegramSessionToken } from '@/lib/auth/telegram'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/auth/session
 * Verify current session token (supports both wallet and Telegram tokens)
 *
 * Headers: Authorization: Bearer <token>
 * Returns: { verified: true, user } or { verified: false }
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({
      verified: false,
      error: 'No token provided'
    })
  }

  const token = authHeader.substring(7) // Remove 'Bearer '

  // Try Telegram session token first (most common)
  const telegramSession = verifyTelegramSessionToken(token)
  if (telegramSession) {
    try {
      // Fetch fresh user data from database
      const user = await prisma.user.findUnique({
        where: { id: telegramSession.userId }
      })

      if (user) {
        return NextResponse.json({
          verified: true,
          user: {
            id: user.id,
            telegramId: user.telegramId,
            telegramUsername: user.telegramUsername,
            telegramPhotoUrl: user.telegramPhotoUrl,
            telegramFirstName: user.telegramFirstName,
            walletAddress: user.walletAddress,
            isVerified: user.isVerified,
            plan: user.plan
          }
        })
      }
    } catch (error) {
      console.error('[Session] DB error:', error)
    }

    // Fallback to token data if DB fails
    return NextResponse.json({
      verified: true,
      user: {
        id: telegramSession.userId,
        telegramId: telegramSession.telegramId,
        walletAddress: telegramSession.walletAddress,
        isVerified: telegramSession.verified
      }
    })
  }

  // Try wallet session token as fallback
  const walletSession = verifySessionToken(token)
  if (walletSession) {
    return NextResponse.json({
      verified: true,
      walletAddress: walletSession.walletAddress
    })
  }

  return NextResponse.json({
    verified: false,
    error: 'Invalid or expired token'
  })
}
