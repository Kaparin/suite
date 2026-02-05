import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySessionTokenV2 } from '@/lib/auth/telegram'

// PATCH /api/auth/wallets/[id] - Update wallet (label, isPrimary)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifySessionTokenV2(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Verify wallet belongs to user
    const wallet = await prisma.wallet.findUnique({ where: { id } })
    if (!wallet || wallet.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    const body = await request.json()
    const { label, isPrimary } = body

    // If setting as primary, unset all others first
    if (isPrimary) {
      await prisma.wallet.updateMany({
        where: { userId: decoded.userId, isPrimary: true },
        data: { isPrimary: false }
      })
    }

    const updated = await prisma.wallet.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(isPrimary !== undefined && { isPrimary })
      }
    })

    return NextResponse.json({
      wallet: {
        id: updated.id,
        address: updated.address,
        label: updated.label,
        isPrimary: updated.isPrimary,
        verifiedAt: updated.verifiedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error updating wallet:', error)
    return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 })
  }
}

// DELETE /api/auth/wallets/[id] - Remove wallet
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifySessionTokenV2(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Verify wallet belongs to user
    const wallet = await prisma.wallet.findUnique({ where: { id } })
    if (!wallet || wallet.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    await prisma.wallet.delete({ where: { id } })

    // If deleted wallet was primary, set the first remaining wallet as primary
    if (wallet.isPrimary) {
      const remaining = await prisma.wallet.findFirst({
        where: { userId: decoded.userId },
        orderBy: { createdAt: 'asc' }
      })
      if (remaining) {
        await prisma.wallet.update({
          where: { id: remaining.id },
          data: { isPrimary: true }
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting wallet:', error)
    return NextResponse.json({ error: 'Failed to delete wallet' }, { status: 500 })
  }
}
