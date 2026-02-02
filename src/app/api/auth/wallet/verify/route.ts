import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPendingVerification, verifyTransaction, VERIFICATION_ADDRESS } from '@/lib/auth/verification'
import { createTelegramSessionToken, verifyTelegramSessionToken } from '@/lib/auth/telegram'

const AXIOME_REST_URL = process.env.AXIOME_REST_URL || 'https://axiome-api.quantnode.tech'

// GET /api/auth/wallet/verify - Check verification status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Check if there's a pending verification
    const pending = getPendingVerification(walletAddress)
    if (!pending) {
      return NextResponse.json({ verified: false, pending: false })
    }

    // Search for verification transaction on chain
    const verified = await searchVerificationTransaction(
      walletAddress,
      pending.code
    )

    if (verified) {
      // Get auth token from header to update user
      const authHeader = request.headers.get('authorization')
      let userId: string | null = null

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const decoded = verifyTelegramSessionToken(token)
        if (decoded) {
          userId = decoded.userId
        }
      }

      // Update user with verified wallet
      if (userId) {
        const user = await prisma.user.update({
          where: { id: userId },
          data: {
            walletAddress: walletAddress.toLowerCase(),
            walletVerifiedAt: new Date(),
            isVerified: true
          }
        })

        // Create new token with wallet address
        const newToken = createTelegramSessionToken(
          user.telegramId || '',
          user.id,
          user.walletAddress
        )

        return NextResponse.json({
          verified: true,
          pending: false,
          token: newToken,
          walletAddress: user.walletAddress
        })
      }

      return NextResponse.json({
        verified: true,
        pending: false,
        walletAddress
      })
    }

    return NextResponse.json({
      verified: false,
      pending: true,
      expiresAt: pending.expiresAt
    })
  } catch (error) {
    console.error('Wallet verify error:', error)
    return NextResponse.json(
      { error: 'Verification check failed' },
      { status: 500 }
    )
  }
}

/**
 * Search for verification transaction on the blockchain
 */
async function searchVerificationTransaction(
  senderAddress: string,
  expectedMemo: string
): Promise<boolean> {
  try {
    // Use Cosmos SDK tx search
    const query = encodeURIComponent(
      `message.sender='${senderAddress}' AND transfer.recipient='${VERIFICATION_ADDRESS}'`
    )

    const response = await fetch(
      `${AXIOME_REST_URL}/cosmos/tx/v1beta1/txs?events=${query}&order_by=2&pagination.limit=10`,
      { next: { revalidate: 0 } }
    )

    if (!response.ok) {
      console.error('Failed to search transactions:', response.status)
      return false
    }

    const data = await response.json()
    const txs = data.tx_responses || []

    // Check each transaction for matching memo
    for (const tx of txs) {
      const memo = tx.tx?.body?.memo || ''
      if (memo.trim().toUpperCase() === expectedMemo.trim().toUpperCase()) {
        // Verify the transaction was successful
        if (tx.code === 0) {
          return true
        }
      }
    }

    return false
  } catch (error) {
    console.error('Transaction search error:', error)
    return false
  }
}
