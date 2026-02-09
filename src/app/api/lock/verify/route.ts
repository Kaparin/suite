import { NextRequest, NextResponse } from 'next/server'
import { verifySessionTokenV2 } from '@/lib/auth/telegram'
import { prisma } from '@/lib/prisma'
import { verifyOnChainBalance, fromMicroAmount } from '@/lib/lock'

/**
 * POST /api/lock/verify
 * Force re-verify on-chain balance for a specific lock.
 * Body: { lockId: string }
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
    const { lockId } = await request.json()
    if (!lockId) {
      return NextResponse.json({ error: 'Missing lockId' }, { status: 400 })
    }

    const lock = await prisma.lock.findFirst({
      where: { id: lockId, userId: decoded.userId },
    })

    if (!lock) {
      return NextResponse.json({ error: 'Lock not found' }, { status: 404 })
    }

    if (lock.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Lock is not active' }, { status: 400 })
    }

    const balance = await verifyOnChainBalance(lock.walletAddress)
    const requiredAmount = fromMicroAmount(lock.amount)

    if (balance < requiredAmount) {
      await prisma.lock.update({
        where: { id: lock.id },
        data: { status: 'VIOLATED', lastVerifiedAt: new Date() },
      })
      return NextResponse.json({
        verified: false,
        balance,
        required: requiredAmount,
        status: 'VIOLATED',
      })
    }

    await prisma.lock.update({
      where: { id: lock.id },
      data: { lastVerifiedAt: new Date() },
    })

    return NextResponse.json({
      verified: true,
      balance,
      required: requiredAmount,
      status: 'ACTIVE',
    })
  } catch (error) {
    console.error('[Lock Verify] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
