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
      console.log(`[Verify] SUCCESS! Transaction verified for wallet: ${walletAddress}`)

      // Get auth token from header to update user
      const authHeader = request.headers.get('authorization')
      console.log(`[Verify] Auth header present: ${!!authHeader}`)

      let userId: string | null = null

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const decoded = verifyTelegramSessionToken(token)
        console.log(`[Verify] Token decoded: ${!!decoded}, userId: ${decoded?.userId || 'null'}`)
        if (decoded) {
          userId = decoded.userId
        }
      }

      // If no userId from token, try to find user by existing records or wallet
      if (!userId) {
        console.log(`[Verify] No userId from token, searching by wallet address...`)
        // Try to find a user who might have this wallet or find by telegram session
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { walletAddress: walletAddress.toLowerCase() },
              // Find any user without wallet who recently started verification
              { walletAddress: null, isVerified: false }
            ]
          },
          orderBy: { updatedAt: 'desc' }
        })

        if (existingUser) {
          userId = existingUser.id
          console.log(`[Verify] Found existing user: ${userId}`)
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

          console.log(`[Verify] User updated in DB: ${user.id}, isVerified: ${user.isVerified}`)

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
            error: 'Failed to update user in database',
            walletAddress
          })
        }
      }

      console.log(`[Verify] WARNING: No user found to update! Verification passed but user not linked.`)
      return NextResponse.json({
        verified: true,
        pending: false,
        warning: 'Verification passed but could not link to user account. Please try logging in again.',
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

        // Log first few transactions for debugging
        if (txs.length > 0) {
          console.log(`[Verify] Recent txs to verification address:`)
          txs.slice(0, 3).forEach((tx: { txhash?: string; tx?: { body?: { memo?: string; messages?: Array<{ from_address?: string; to_address?: string }> } } }, i: number) => {
            const memo = tx.tx?.body?.memo || '(no memo)'
            const from = tx.tx?.body?.messages?.[0]?.from_address || '?'
            console.log(`[Verify]   ${i + 1}. TX ${tx.txhash?.substring(0, 10)}... | memo: "${memo}" | from: ${from.substring(0, 15)}...`)
          })
        }

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

      // Log transactions for debugging
      if (txs.length > 0) {
        console.log(`[Verify] Recent txs from sender:`)
        txs.slice(0, 5).forEach((tx: { txhash?: string; tx?: { body?: { memo?: string; messages?: Array<{ from_address?: string; to_address?: string }> } } }, i: number) => {
          const memo = tx.tx?.body?.memo || '(no memo)'
          const to = tx.tx?.body?.messages?.[0]?.to_address || '?'
          console.log(`[Verify]   ${i + 1}. TX ${tx.txhash?.substring(0, 10)}... | memo: "${memo}" | to: ${to.substring(0, 15)}...`)
        })
      }

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

