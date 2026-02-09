import { NextRequest, NextResponse } from 'next/server'
import { verifySessionTokenV2 } from '@/lib/auth/telegram'
import { getUserLocks, getUserTier, createLock, unlockLock } from '@/lib/lock'
import { fromMicroAmount, TIER_REQUIREMENTS } from '@/lib/lock/constants'

/**
 * GET /api/lock
 * Returns user's locks and current tier.
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
    const [locks, tier] = await Promise.all([
      getUserLocks(decoded.userId),
      getUserTier(decoded.userId),
    ])

    return NextResponse.json({
      tier,
      tierRequirements: TIER_REQUIREMENTS,
      locks: locks.map(lock => ({
        id: lock.id,
        walletAddress: lock.walletAddress,
        amount: fromMicroAmount(lock.amount),
        tier: lock.tier,
        durationDays: lock.durationDays,
        lockStartDate: lock.lockStartDate.toISOString(),
        lockEndDate: lock.lockEndDate.toISOString(),
        status: lock.status,
        lastVerifiedAt: lock.lastVerifiedAt?.toISOString() || null,
        createdAt: lock.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('[Lock GET] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * POST /api/lock
 * Create a new lock or unlock an expired lock.
 *
 * Body for create: { action: 'lock', walletAddress, amount, durationDays }
 * Body for unlock: { action: 'unlock', lockId }
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

    if (action === 'lock') {
      const { walletAddress, amount, durationDays } = body

      if (!walletAddress || !amount || !durationDays) {
        return NextResponse.json({ error: 'Missing required fields: walletAddress, amount, durationDays' }, { status: 400 })
      }

      if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
      }

      if (typeof durationDays !== 'number' || durationDays < 7) {
        return NextResponse.json({ error: 'Duration must be at least 7 days' }, { status: 400 })
      }

      const result = await createLock(decoded.userId, walletAddress, amount, durationDays)

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        lock: {
          id: result.lock!.id,
          tier: result.lock!.tier,
          amount: fromMicroAmount(result.lock!.amount),
          durationDays: result.lock!.durationDays,
          lockEndDate: result.lock!.lockEndDate.toISOString(),
          status: result.lock!.status,
        },
      })
    }

    if (action === 'unlock') {
      const { lockId } = body
      if (!lockId) {
        return NextResponse.json({ error: 'Missing lockId' }, { status: 400 })
      }

      const result = await unlockLock(decoded.userId, lockId)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action. Use "lock" or "unlock"' }, { status: 400 })
  } catch (error) {
    console.error('[Lock POST] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
