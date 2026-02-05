import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyChallengeToken, VERIFICATION_ADDRESS } from '@/lib/auth/verification'
import { verifySessionTokenV2 } from '@/lib/auth/telegram'

const AXIOME_REST_URL = process.env.AXIOME_REST_URL || 'https://axiome-api.quantnode.tech'

// GET /api/auth/wallet/verify - Check verification status (requires auth)
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

    // Require authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in first.' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifySessionTokenV2(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token. Please log in again.' },
        { status: 401 }
      )
    }

    const userId = decoded.userId

    console.log(`[Verify] Checking wallet: ${walletAddress} for user: ${userId}`)

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

      const normalizedAddress = walletAddress.toLowerCase()

      // Check if wallet already exists (re-verification or race condition)
      const existingWallet = await prisma.wallet.findUnique({
        where: { address: normalizedAddress }
      })

      if (existingWallet) {
        // Wallet already exists - return it
        const allWallets = await prisma.wallet.findMany({
          where: { userId }
        })

        return NextResponse.json({
          verified: true,
          pending: false,
          wallet: {
            id: existingWallet.id,
            address: existingWallet.address,
            label: existingWallet.label,
            isPrimary: existingWallet.isPrimary,
            verifiedAt: existingWallet.verifiedAt.toISOString()
          },
          wallets: allWallets.map(w => ({
            id: w.id,
            address: w.address,
            label: w.label,
            isPrimary: w.isPrimary,
            verifiedAt: w.verifiedAt.toISOString()
          }))
        })
      }

      // Check if user already has wallets (to determine isPrimary)
      const existingWallets = await prisma.wallet.findMany({
        where: { userId }
      })

      const isPrimary = existingWallets.length === 0

      // Create new Wallet record
      const newWallet = await prisma.wallet.create({
        data: {
          userId,
          address: normalizedAddress,
          isPrimary,
          verifiedAt: new Date()
        }
      })

      // Clean up verification record
      await prisma.walletVerification.delete({
        where: { walletAddress: normalizedAddress }
      }).catch(() => {})

      // Fetch all wallets for the response
      const allWallets = await prisma.wallet.findMany({
        where: { userId }
      })

      console.log(`[Verify] Wallet ${normalizedAddress} linked to user ${userId}, isPrimary: ${isPrimary}`)

      // No new token issued — V2 token has no wallet data, stays valid
      return NextResponse.json({
        verified: true,
        pending: false,
        wallet: {
          id: newWallet.id,
          address: newWallet.address,
          label: newWallet.label,
          isPrimary: newWallet.isPrimary,
          verifiedAt: newWallet.verifiedAt.toISOString()
        },
        wallets: allWallets.map(w => ({
          id: w.id,
          address: w.address,
          label: w.label,
          isPrimary: w.isPrimary,
          verifiedAt: w.verifiedAt.toISOString()
        }))
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
