import { NextRequest, NextResponse } from 'next/server'
import { verifySessionTokenV2 } from '@/lib/auth/telegram'
import { prisma } from '@/lib/prisma'
import {
  generateVerificationCode,
  createChallengeToken,
  VERIFICATION_ADDRESS,
  VERIFICATION_AMOUNT,
  VERIFICATION_AMOUNT_DISPLAY
} from '@/lib/auth/verification'

// POST /api/auth/wallet/bind - Start wallet binding (requires auth)
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifySessionTokenV2(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { walletAddress } = body

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Validate address format
    if (!walletAddress.startsWith('axm1') || walletAddress.length < 20) {
      return NextResponse.json(
        { error: 'Invalid Axiome wallet address' },
        { status: 400 }
      )
    }

    const normalizedAddress = walletAddress.toLowerCase()

    // Check if wallet is already linked to another user
    const existingWallet = await prisma.wallet.findUnique({
      where: { address: normalizedAddress }
    })

    if (existingWallet && existingWallet.userId !== decoded.userId) {
      return NextResponse.json(
        { error: 'This wallet is already linked to another account' },
        { status: 409 }
      )
    }

    if (existingWallet && existingWallet.userId === decoded.userId) {
      return NextResponse.json(
        { error: 'This wallet is already linked to your account' },
        { status: 409 }
      )
    }

    // Generate verification code and expiry
    const code = generateVerificationCode()
    const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes

    // Create signed challenge token (stateless - contains all data needed)
    const challengeToken = createChallengeToken(normalizedAddress, code, expiresAt)

    // Save to DB for tracking
    await prisma.walletVerification.upsert({
      where: { walletAddress: normalizedAddress },
      update: {
        code,
        expiresAt: new Date(expiresAt),
        userId: decoded.userId
      },
      create: {
        walletAddress: normalizedAddress,
        code,
        expiresAt: new Date(expiresAt),
        userId: decoded.userId
      }
    })

    console.log(`[WalletBind] Created challenge for ${normalizedAddress} (user: ${decoded.userId}):`, {
      code,
      verificationAddress: VERIFICATION_ADDRESS,
      expiresAt: new Date(expiresAt).toISOString()
    })

    // Create deep link for Axiome Wallet
    const deepLink = createAxiomeDeepLink(
      VERIFICATION_ADDRESS,
      VERIFICATION_AMOUNT,
      code
    )

    return NextResponse.json({
      code,
      expiresAt,
      challengeToken, // Client must send this back when verifying
      verificationAddress: VERIFICATION_ADDRESS,
      amount: VERIFICATION_AMOUNT_DISPLAY, // Human readable (0.001 AXM)
      amountRaw: VERIFICATION_AMOUNT, // Raw (1000 uaxm)
      deepLink
    })
  } catch (error) {
    console.error('Wallet bind error:', error)
    return NextResponse.json(
      { error: 'Failed to create verification challenge' },
      { status: 500 }
    )
  }
}

/**
 * Create Axiome Wallet deep link for verification transaction
 */
function createAxiomeDeepLink(
  recipient: string,
  amount: string,
  memo: string
): string {
  const params = new URLSearchParams({
    recipient,
    amount,
    denom: 'uaxm',
    memo
  })

  return `axiomesign://send?${params.toString()}`
}
