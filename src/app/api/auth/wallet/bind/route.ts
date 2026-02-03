import { NextRequest, NextResponse } from 'next/server'
import {
  generateVerificationCode,
  createChallengeToken,
  VERIFICATION_ADDRESS,
  VERIFICATION_AMOUNT,
  VERIFICATION_AMOUNT_DISPLAY
} from '@/lib/auth/verification'

// POST /api/auth/wallet/bind - Start wallet binding, return challenge
export async function POST(request: NextRequest) {
  try {
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

    // Generate verification code and expiry
    const code = generateVerificationCode()
    const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes

    // Create signed challenge token (stateless - contains all data needed)
    const challengeToken = createChallengeToken(walletAddress, code, expiresAt)

    console.log(`[WalletBind] Created stateless challenge for ${walletAddress}:`, {
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
