import { NextRequest, NextResponse } from 'next/server'
import { verifySessionTokenV2 } from '@/lib/auth/telegram'
import { prisma } from '@/lib/prisma'
import { buildAuthUserResponse } from '@/lib/auth/userResponse'

/**
 * GET /api/auth/session
 * Verify current session token and return fresh user data with wallets.
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

  // Verify token (supports both V1 and V2)
  const decoded = verifySessionTokenV2(token)
  if (!decoded) {
    return NextResponse.json({
      verified: false,
      error: 'Invalid or expired token'
    })
  }

  try {
    // Fetch fresh user data from database with wallets
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { wallets: true }
    })

    if (user) {
      return NextResponse.json({
        verified: true,
        user: buildAuthUserResponse(user)
      })
    }
  } catch (error) {
    console.error('[Session] DB error:', error)
  }

  // Fallback: user not found in DB
  return NextResponse.json({
    verified: false,
    error: 'User not found'
  })
}
