import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySessionTokenV2 } from '@/lib/auth/telegram'

// GET /api/auth/wallets - List user's wallets
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifySessionTokenV2(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const wallets = await prisma.wallet.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({
      wallets: wallets.map(w => ({
        id: w.id,
        address: w.address,
        label: w.label,
        isPrimary: w.isPrimary,
        verifiedAt: w.verifiedAt.toISOString(),
        createdAt: w.createdAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('Error fetching wallets:', error)
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 })
  }
}
