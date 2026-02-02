import { NextRequest, NextResponse } from 'next/server'
import {
  createVerificationChallenge,
  getPendingVerification,
  verifyTransaction,
  createSessionToken,
  VERIFICATION_ADDRESS,
  VERIFICATION_AMOUNT
} from '@/lib/auth'

const REST_URL = process.env.AXIOME_REST_URL

/**
 * POST /api/auth/verify
 *
 * Step 1: Request verification challenge
 * Body: { walletAddress: string }
 * Returns: { code, expiresAt, verificationAddress, amount, deepLink }
 *
 * Step 2: Confirm verification (after user sends tx)
 * Body: { walletAddress: string, txHash: string }
 * Returns: { token, verified: true }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, txHash } = body

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Step 2: Confirm verification with tx hash
    if (txHash) {
      return await confirmVerification(walletAddress, txHash)
    }

    // Step 1: Generate new challenge
    const challenge = createVerificationChallenge(walletAddress)

    // Create deep link for the verification transaction
    const payload = {
      type: 'bank_send',
      network: 'axiome-1',
      to_address: challenge.verificationAddress,
      amount: [{ denom: 'uaxm', amount: challenge.amount }],
      memo: challenge.code
    }
    const deepLink = `axiomesign://${Buffer.from(JSON.stringify(payload)).toString('base64')}`

    return NextResponse.json({
      code: challenge.code,
      expiresAt: challenge.expiresAt,
      verificationAddress: challenge.verificationAddress,
      amount: challenge.amount,
      displayAmount: '0.001 AXM',
      deepLink,
      message: 'Send 0.001 AXM to verification address with the code as memo'
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}

/**
 * Confirm verification by checking transaction on chain
 */
async function confirmVerification(walletAddress: string, txHash: string) {
  const pending = getPendingVerification(walletAddress)

  if (!pending) {
    return NextResponse.json(
      { error: 'No pending verification found or it has expired' },
      { status: 400 }
    )
  }

  if (!REST_URL) {
    return NextResponse.json(
      { error: 'Blockchain connection not configured' },
      { status: 500 }
    )
  }

  try {
    // Fetch transaction from blockchain
    const response = await fetch(
      `${REST_URL}/cosmos/tx/v1beta1/txs/${txHash}`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Transaction not found. Please wait for confirmation.' },
        { status: 404 }
      )
    }

    const txData = await response.json()
    const tx = txData.tx_response

    // Check if tx was successful
    if (tx.code !== 0) {
      return NextResponse.json(
        { error: 'Transaction failed on chain' },
        { status: 400 }
      )
    }

    // Parse transaction to extract sender, recipient, memo
    const messages = tx.tx?.body?.messages || []
    const memo = tx.tx?.body?.memo || ''

    // Find bank send message
    const bankSend = messages.find(
      (msg: { '@type': string }) => msg['@type'] === '/cosmos.bank.v1beta1.MsgSend'
    )

    if (!bankSend) {
      return NextResponse.json(
        { error: 'Transaction is not a bank send' },
        { status: 400 }
      )
    }

    const fromAddress = bankSend.from_address
    const toAddress = bankSend.to_address

    // Verify the transaction matches our challenge
    const isValid = verifyTransaction(walletAddress, fromAddress, toAddress, memo)

    if (!isValid) {
      return NextResponse.json(
        {
          error: 'Verification failed',
          details: {
            expectedSender: walletAddress,
            actualSender: fromAddress,
            expectedRecipient: VERIFICATION_ADDRESS,
            actualRecipient: toAddress,
            expectedMemo: pending.code,
            actualMemo: memo
          }
        },
        { status: 400 }
      )
    }

    // Success! Create session token
    const token = createSessionToken(walletAddress)

    return NextResponse.json({
      verified: true,
      token,
      walletAddress,
      message: 'Wallet verified successfully!'
    })
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { error: 'Failed to verify transaction' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/verify?address=...
 * Check verification status for a wallet
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const walletAddress = searchParams.get('address')

  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Wallet address is required' },
      { status: 400 }
    )
  }

  const pending = getPendingVerification(walletAddress)

  if (!pending) {
    return NextResponse.json({
      hasPendingVerification: false
    })
  }

  return NextResponse.json({
    hasPendingVerification: true,
    code: pending.code,
    expiresAt: pending.expiresAt,
    verificationAddress: VERIFICATION_ADDRESS,
    amount: VERIFICATION_AMOUNT,
    displayAmount: '0.001 AXM'
  })
}
