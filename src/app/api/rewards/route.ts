import { NextRequest, NextResponse } from 'next/server'
import { verifySessionTokenV2 } from '@/lib/auth/telegram'
import { getUserRewards, getUserRewardStats, claimRewards } from '@/lib/rewards'

/**
 * GET /api/rewards
 * Returns user's rewards history and aggregated stats.
 * Requires auth via verifySessionTokenV2.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const decoded = verifySessionTokenV2(authHeader.substring(7))
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  try {
    const [rewards, stats] = await Promise.all([
      getUserRewards(decoded.userId),
      getUserRewardStats(decoded.userId),
    ])

    return NextResponse.json({
      stats,
      rewards: rewards.map(r => ({
        id: r.id,
        type: r.type,
        amount: r.amount,
        status: r.status,
        projectId: r.projectId,
        commentId: r.commentId,
        txHash: r.txHash,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('[Rewards GET] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * POST /api/rewards
 * Actions:
 *   { action: 'claim' } — claim all approved rewards (mark as PAID)
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const decoded = verifySessionTokenV2(authHeader.substring(7))
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action } = body

    if (action === 'claim') {
      const result = await claimRewards(decoded.userId)
      return NextResponse.json({
        success: result.success,
        claimedAmount: result.claimedAmount,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported: "claim"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Rewards POST] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
