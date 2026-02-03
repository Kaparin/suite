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
 * Uses recipient-based query (faster - smaller result set)
 * Falls back to sender-based query if needed
 */
async function searchVerificationTransaction(
  senderAddress: string,
  expectedMemo: string
): Promise<boolean> {
  try {
    console.log(`[Verify] Searching for sender: ${senderAddress}, memo: ${expectedMemo}`)
    console.log(`[Verify] Verification address: ${VERIFICATION_ADDRESS}`)

    // Strategy 1: Query by recipient (faster - less transactions to the verification address)
    const recipientQuery = encodeURIComponent(`transfer.recipient='${VERIFICATION_ADDRESS}'`)
    const recipientUrl = `${AXIOME_REST_URL}/cosmos/tx/v1beta1/txs?query=${recipientQuery}&order_by=ORDER_BY_DESC&pagination.limit=20`

    console.log(`[Verify] Trying recipient query: ${recipientUrl}`)

    // Use AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(recipientUrl, {
        cache: 'no-store',
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        const txs = data.tx_responses || []
        console.log(`[Verify] Recipient query found ${txs.length} transactions`)

        // Check each transaction
        for (const tx of txs) {
          if (tx.code !== 0) continue

          const memo = tx.tx?.body?.memo || ''
          if (memo.trim().toUpperCase() !== expectedMemo.trim().toUpperCase()) {
            continue
          }

          console.log(`[Verify] Memo match! Checking sender...`)

          // Verify sender matches
          const messages = tx.tx?.body?.messages || []
          const bankSend = messages.find(
            (msg: { '@type': string }) => msg['@type'] === '/cosmos.bank.v1beta1.MsgSend'
          )

          if (bankSend && bankSend.from_address?.toLowerCase() === senderAddress.toLowerCase()) {
            console.log(`[Verify] SUCCESS! TX: ${tx.txhash}`)
            return true
          }
        }
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if ((fetchError as Error).name === 'AbortError') {
        console.log(`[Verify] Recipient query timed out, trying sender query...`)
      } else {
        console.error(`[Verify] Recipient query error:`, fetchError)
      }
    }

    // Strategy 2: Query by sender (fallback)
    const senderQuery = encodeURIComponent(`message.sender='${senderAddress}'`)
    const senderUrl = `${AXIOME_REST_URL}/cosmos/tx/v1beta1/txs?query=${senderQuery}&order_by=ORDER_BY_DESC&pagination.limit=10`

    console.log(`[Verify] Trying sender query: ${senderUrl}`)

    const controller2 = new AbortController()
    const timeoutId2 = setTimeout(() => controller2.abort(), 10000)

    try {
      const response = await fetch(senderUrl, {
        cache: 'no-store',
        signal: controller2.signal
      })
      clearTimeout(timeoutId2)

      if (!response.ok) {
        console.error(`[Verify] Sender query failed: ${response.status}`)
        return false
      }

      const data = await response.json()
      const txs = data.tx_responses || []
      console.log(`[Verify] Sender query found ${txs.length} transactions`)

      for (const tx of txs) {
        if (tx.code !== 0) continue

        const memo = tx.tx?.body?.memo || ''
        if (memo.trim().toUpperCase() !== expectedMemo.trim().toUpperCase()) {
          continue
        }

        const messages = tx.tx?.body?.messages || []
        const bankSend = messages.find(
          (msg: { '@type': string }) => msg['@type'] === '/cosmos.bank.v1beta1.MsgSend'
        )

        if (bankSend && bankSend.to_address?.toLowerCase() === VERIFICATION_ADDRESS.toLowerCase()) {
          console.log(`[Verify] SUCCESS via sender query! TX: ${tx.txhash}`)
          return true
        }
      }
    } catch (fetchError) {
      clearTimeout(timeoutId2)
      console.error(`[Verify] Sender query error:`, fetchError)
    }

    console.log(`[Verify] No matching transaction found`)
    return false
  } catch (error) {
    console.error('[Verify] Search error:', error)
    return false
  }
}

