import { NextRequest, NextResponse } from 'next/server'
import { verifySessionTokenV2 } from '@/lib/auth/telegram'
import { verifyPayment } from '@/lib/payments'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/payments/verify — Verify a payment by txHash
 * Body: { paymentId: string, txHash: string }
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
    const { paymentId, txHash } = await request.json()

    if (!paymentId || !txHash) {
      return NextResponse.json(
        { error: 'paymentId and txHash are required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const payment = await prisma.platformPayment.findUnique({
      where: { id: paymentId },
    })

    if (!payment || payment.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const confirmed = await verifyPayment(paymentId, txHash)

    return NextResponse.json({
      success: true,
      payment: confirmed,
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
