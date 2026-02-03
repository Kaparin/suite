import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPendingVerificationAsync, deleteVerification, VERIFICATION_ADDRESS } from '@/lib/auth/verification'
import { createTelegramSessionToken, verifyTelegramSessionToken } from '@/lib/auth/telegram'

const AXIOME_REST_URL = process.env.AXIOME_REST_URL || 'https://axiome-api.quantnode.tech'

// GET /api/auth/wallet/verify - Check verification status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')

    console.log(`[Verify] Checking verification for wallet: ${walletAddress}`)

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Check if there's a pending verification (using async DB lookup)
    const pending = await getPendingVerificationAsync(walletAddress)
    console.log(`[Verify] Pending verification:`, pending ? `code=${pending.code}` : 'none')

    if (!pending) {
      return NextResponse.json({ verified: false, pending: false })
    }

    // Search for verification transaction on chain
    const verified = await searchVerificationTransaction(
      walletAddress,
      pending.code
    )

    if (verified) {
      console.log(`[Verify] Transaction verified! Cleaning up and updating user...`)

      // Delete the verification challenge from DB and cache
      await deleteVerification(walletAddress)

      // Get auth token from header to update user
      const authHeader = request.headers.get('authorization')
      let userId: string | null = null

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const decoded = verifyTelegramSessionToken(token)
        if (decoded) {
          userId = decoded.userId
          console.log(`[Verify] Found user ID from token: ${userId}`)
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

          console.log(`[Verify] User updated: ${user.id}, wallet: ${user.walletAddress}`)

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
          console.error('[Verify] Failed to update user:', dbError)
          // Still return success, just without updating user
          return NextResponse.json({
            verified: true,
            pending: false,
            walletAddress,
            error: 'Failed to update user profile'
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
 * Tries multiple approaches to find the matching transaction
 */
async function searchVerificationTransaction(
  senderAddress: string,
  expectedMemo: string
): Promise<boolean> {
  console.log(`[Verify] ========== Starting transaction search ==========`)
  console.log(`[Verify] Sender: ${senderAddress}`)
  console.log(`[Verify] Expected memo: ${expectedMemo}`)
  console.log(`[Verify] Expected recipient: ${VERIFICATION_ADDRESS}`)

  // Try approach 1: Search by sender
  const result1 = await searchBySender(senderAddress, expectedMemo)
  if (result1) return true

  // Try approach 2: Search by recipient (transfer.recipient event)
  const result2 = await searchByRecipient(senderAddress, expectedMemo)
  if (result2) return true

  console.log(`[Verify] No matching transaction found with any approach`)
  return false
}

/**
 * Search transactions by sender address
 */
async function searchBySender(
  senderAddress: string,
  expectedMemo: string
): Promise<boolean> {
  try {
    const query = encodeURIComponent(`message.sender='${senderAddress}'`)
    const url = `${AXIOME_REST_URL}/cosmos/tx/v1beta1/txs?events=${query}&order_by=2&pagination.limit=30`

    console.log(`[Verify] Approach 1: Search by sender`)
    console.log(`[Verify] URL: ${url}`)

    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) {
      console.error(`[Verify] Sender search failed: ${response.status}`)
      return false
    }

    const data = await response.json()
    return checkTransactionsForMatch(data.tx_responses || [], senderAddress, expectedMemo)
  } catch (error) {
    console.error('[Verify] Sender search error:', error)
    return false
  }
}

/**
 * Search transactions by recipient address (for bank transfers)
 */
async function searchByRecipient(
  senderAddress: string,
  expectedMemo: string
): Promise<boolean> {
  try {
    const query = encodeURIComponent(`transfer.recipient='${VERIFICATION_ADDRESS}'`)
    const url = `${AXIOME_REST_URL}/cosmos/tx/v1beta1/txs?events=${query}&order_by=2&pagination.limit=30`

    console.log(`[Verify] Approach 2: Search by recipient`)
    console.log(`[Verify] URL: ${url}`)

    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) {
      console.error(`[Verify] Recipient search failed: ${response.status}`)
      return false
    }

    const data = await response.json()
    return checkTransactionsForMatch(data.tx_responses || [], senderAddress, expectedMemo)
  } catch (error) {
    console.error('[Verify] Recipient search error:', error)
    return false
  }
}

/**
 * Check array of transactions for a matching verification tx
 */
function checkTransactionsForMatch(
  txs: any[],
  expectedSender: string,
  expectedMemo: string
): boolean {
  console.log(`[Verify] Checking ${txs.length} transactions...`)

  for (const tx of txs) {
    // Skip failed transactions
    if (tx.code !== 0) {
      continue
    }

    const memo = tx.tx?.body?.memo || ''
    const messages = tx.tx?.body?.messages || []
    const height = tx.height
    const txHash = tx.txhash?.substring(0, 16)

    // Check memo match (case insensitive)
    const memoMatches = memo.trim().toUpperCase() === expectedMemo.trim().toUpperCase()

    if (!memoMatches) {
      continue
    }

    console.log(`[Verify] TX ${txHash}... (height ${height}): Memo matches!`)

    // Check messages for matching sender and recipient
    for (const msg of messages) {
      const msgType = msg['@type'] || msg.type || ''
      const fromAddress = msg.from_address || msg.fromAddress || ''
      const toAddress = msg.to_address || msg.toAddress || ''

      // Check if this is a bank send message
      if (msgType.includes('MsgSend') || msgType.includes('bank')) {
        const senderMatches = fromAddress.toLowerCase() === expectedSender.toLowerCase()
        const recipientMatches = toAddress.toLowerCase() === VERIFICATION_ADDRESS.toLowerCase()

        console.log(`[Verify]   Message: ${msgType}`)
        console.log(`[Verify]   From: ${fromAddress} (matches: ${senderMatches})`)
        console.log(`[Verify]   To: ${toAddress} (matches: ${recipientMatches})`)

        if (senderMatches && recipientMatches) {
          console.log(`[Verify] SUCCESS! Verified transaction: ${tx.txhash}`)
          return true
        }
      }
    }
  }

  return false
}
