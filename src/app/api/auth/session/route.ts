import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/auth'

/**
 * GET /api/auth/session
 * Verify current session token
 *
 * Headers: Authorization: Bearer <token>
 * Returns: { verified: true, walletAddress } or { verified: false }
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
  const session = verifySessionToken(token)

  if (!session) {
    return NextResponse.json({
      verified: false,
      error: 'Invalid or expired token'
    })
  }

  return NextResponse.json({
    verified: true,
    walletAddress: session.walletAddress
  })
}
