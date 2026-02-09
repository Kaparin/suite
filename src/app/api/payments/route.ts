import { NextRequest, NextResponse } from 'next/server'
import { verifySessionTokenV2 } from '@/lib/auth/telegram'
import { createPaymentRequest, getUserPayments, PAYMENT_PRICES } from '@/lib/payments'
import type { PaymentType } from '@prisma/client'

/**
 * GET /api/payments — Get user's payment history
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

  const payments = await getUserPayments(decoded.userId)
  return NextResponse.json({ payments, prices: PAYMENT_PRICES })
}

/**
 * POST /api/payments — Create a new payment request
 * Body: { type: PaymentType, walletAddress: string, projectId?: string }
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
    const { type, walletAddress, projectId } = body as {
      type: PaymentType
      walletAddress: string
      projectId?: string
    }

    if (!type || !walletAddress) {
      return NextResponse.json(
        { error: 'type and walletAddress are required' },
        { status: 400 }
      )
    }

    const validTypes: PaymentType[] = ['PRO_SUBSCRIPTION', 'PROJECT_VERIFICATION', 'PROJECT_PROMOTION']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 })
    }

    const result = await createPaymentRequest(
      decoded.userId,
      type,
      walletAddress,
      projectId,
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
