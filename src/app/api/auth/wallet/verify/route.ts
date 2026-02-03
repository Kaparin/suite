import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyChallengeToken, VERIFICATION_ADDRESS } from '@/lib/auth/verification'
import { createTelegramSessionToken, verifyTelegramSessionToken } from '@/lib/auth/telegram'

const AXIOME_REST_URL = process.env.AXIOME_REST_URL || 'https://axiome-api.quantnode.tech'

// GET /api/auth/wallet/verify - Check verification status (stateless)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')
    const challengeToken = searchParams.get('challengeToken')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    if (!challengeToken) {
      return NextResponse.json(
        { error: 'Challenge token is required' },
        { status: 400 }
      )
    }

    console.log(`[Verify] Checking wallet: ${walletAddress}`)

    // Decode the challenge token (stateless - no server state needed)
    const challenge = verifyChallengeToken(challengeToken)

    if (!challenge) {
      console.log(`[Verify] Invalid or expired challenge token`)
      return NextResponse.json({
        verified: false,
        pending: false,
        error: 'Challenge expired or invalid'
      })
    }

    // Verify the token is for this wallet
    if (challenge.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      console.log(`[Verify] Wallet mismatch: token=${challenge.walletAddress}, request=${walletAddress}`)
      return NextResponse.json({
        verified: false,
        pending: false,
        error: 'Wallet address mismatch'
      })
    }

    console.log(`[Verify] Challenge decoded: code=${challenge.code}`)

    // Search for verification transaction on chain
    const verified = await searchVerificationTransaction(
      walletAddress,
      challenge.code
    )

    if (verified) {
      console.log(`[Verify] SUCCESS! Transaction verified`)

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
        try {
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
            walletAddress: user.walletAddress,
            user: {
              id: user.id,
              telegramUsername: user.telegramUsername,
              walletAddress: user.walletAddress,
              isVerified: user.isVerified
            }
          })
        } catch (dbError) {
          console.error('[Verify] DB error:', dbError)
          return NextResponse.json({
            verified: true,
            pending: false,
            walletAddress
          })
        }
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
      expiresAt: challenge.expiresAt
    })
  } catch (error) {
    console.error('[Verify] Error:', error)
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
    // Build query - search by sender
    const query = `message.sender='${senderAddress}'`
    const encodedQuery = encodeURIComponent(query)
    const url = `${AXIOME_REST_URL}/cosmos/tx/v1beta1/txs?events=${encodedQuery}&order_by=2&pagination.limit=20`

    console.log(`[Verify] Searching: ${url}`)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      console.error(`[Verify] API error ${response.status}: ${text.substring(0, 200)}`)
      return false
    }

    const data = await response.json()
    const txs = data.tx_responses || data.txs || []

    console.log(`[Verify] Found ${txs.length} transactions`)

    // Check each transaction
    for (const tx of txs) {
      // Skip failed transactions
      if (tx.code !== 0 && tx.code !== undefined) {
        continue
      }

      const memo = tx.tx?.body?.memo || ''

      // Check memo match (case insensitive)
      if (memo.trim().toUpperCase() !== expectedMemo.trim().toUpperCase()) {
        continue
      }

      console.log(`[Verify] Memo match found! TX: ${tx.txhash?.substring(0, 16)}...`)

      // Check messages
      const messages = tx.tx?.body?.messages || []
      for (const msg of messages) {
        const toAddress = msg.to_address || msg.toAddress || ''

        if (toAddress.toLowerCase() === VERIFICATION_ADDRESS.toLowerCase()) {
          console.log(`[Verify] Recipient match! Verification complete.`)
          return true
        }
      }
    }

    console.log(`[Verify] No matching transaction found`)
    return false
  } catch (error) {
    console.error('[Verify] Search error:', error)
    return false
  }
}
