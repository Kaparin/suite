import { NextRequest, NextResponse } from 'next/server'
import { createVerificationChallenge, VERIFICATION_ADDRESS, VERIFICATION_AMOUNT, VERIFICATION_AMOUNT_DISPLAY } from '@/lib/auth/verification'

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

    // Create verification challenge
    const challenge = createVerificationChallenge(walletAddress)

    console.log(`[WalletBind] Created challenge for ${walletAddress}:`, {
      code: challenge.code,
      verificationAddress: VERIFICATION_ADDRESS,
      expiresAt: new Date(challenge.expiresAt).toISOString()
    })

    // Create deep link for Axiome Wallet
    const deepLink = createAxiomeDeepLink(
      VERIFICATION_ADDRESS,
      VERIFICATION_AMOUNT,
      challenge.code
    )

    return NextResponse.json({
      code: challenge.code,
      expiresAt: challenge.expiresAt,
      verificationAddress: VERIFICATION_ADDRESS, // Explicitly use the constant
      amount: VERIFICATION_AMOUNT_DISPLAY, // Human readable (0.001 AXM)
      amountRaw: challenge.amount, // Raw (1000 uaxm)
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
