import { NextRequest, NextResponse } from 'next/server'
import {
  getPendingVerification,
  verifyTransaction,
  createSessionToken,
  VERIFICATION_ADDRESS
} from '@/lib/auth'

const REST_URL = process.env.AXIOME_REST_URL

/**
 * GET /api/auth/verify/check?address=...
 *
 * Automatically check blockchain for verification transaction.
 * Called by client polling after user opens deep link.
 *
 * Returns:
 * - { verified: false, pending: true } - still waiting
 * - { verified: true, token: "..." } - success!
 * - { verified: false, pending: false, error: "..." } - expired or error
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

  // Get pending verification
  const pending = getPendingVerification(walletAddress)

  if (!pending) {
    return NextResponse.json({
      verified: false,
      pending: false,
      error: 'No pending verification or it has expired'
    })
  }

  if (!REST_URL) {
    return NextResponse.json({
      verified: false,
      pending: true,
      error: 'Blockchain connection not configured'
    })
  }

  try {
    // Search for transactions from this wallet to verification address
    // Using the Cosmos SDK tx search endpoint
    const query = encodeURIComponent(
      `message.sender='${walletAddress}' AND transfer.recipient='${VERIFICATION_ADDRESS}'`
    )

    const response = await fetch(
      `${REST_URL}/cosmos/tx/v1beta1/txs?events=${query}&order_by=ORDER_BY_DESC&pagination.limit=10`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      // Try alternative search method - get recent transactions from sender
      return await checkTransactionsAlternative(walletAddress, pending.code)
    }

    const data = await response.json()
    const txs = data.tx_responses || []

    // Check each transaction
    for (const tx of txs) {
      // Only check successful transactions
      if (tx.code !== 0) continue

      // Check if transaction is recent (within last 20 minutes)
      const txTime = new Date(tx.timestamp).getTime()
      if (txTime < pending.createdAt - 60000) continue // Skip if before verification was created

      // Get memo
      const memo = tx.tx?.body?.memo || ''

      // Check if memo matches our code
      if (memo.trim().toUpperCase() === pending.code) {
        // Find the bank send message to verify recipient
        const messages = tx.tx?.body?.messages || []
        const bankSend = messages.find(
          (msg: { '@type': string }) => msg['@type'] === '/cosmos.bank.v1beta1.MsgSend'
        )

        if (bankSend) {
          const fromAddress = bankSend.from_address
          const toAddress = bankSend.to_address

          // Verify transaction details
          const isValid = verifyTransaction(walletAddress, fromAddress, toAddress, memo)

          if (isValid) {
            // Success! Create session token
            const token = createSessionToken(walletAddress)

            return NextResponse.json({
              verified: true,
              token,
              walletAddress: walletAddress.toLowerCase(),
              txHash: tx.txhash,
              message: 'Wallet verified successfully!'
            })
          }
        }
      }
    }

    // No matching transaction found yet
    return NextResponse.json({
      verified: false,
      pending: true,
      expiresAt: pending.expiresAt,
      message: 'Waiting for transaction confirmation...'
    })
  } catch (error) {
    console.error('Error checking verification:', error)
    return NextResponse.json({
      verified: false,
      pending: true,
      error: 'Error checking blockchain'
    })
  }
}

/**
 * Alternative method: Check recent blocks for the transaction
 */
async function checkTransactionsAlternative(walletAddress: string, code: string) {
  const pending = getPendingVerification(walletAddress)

  if (!pending || !REST_URL) {
    return NextResponse.json({
      verified: false,
      pending: false
    })
  }

  try {
    // Get account transactions using bank module query
    // This queries transactions where the account sent funds
    const response = await fetch(
      `${REST_URL}/cosmos/tx/v1beta1/txs?events=message.sender='${walletAddress}'&order_by=ORDER_BY_DESC&pagination.limit=20`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      return NextResponse.json({
        verified: false,
        pending: true,
        message: 'Waiting for transaction...'
      })
    }

    const data = await response.json()
    const txs = data.tx_responses || []

    for (const tx of txs) {
      if (tx.code !== 0) continue

      const memo = tx.tx?.body?.memo || ''
      if (memo.trim().toUpperCase() !== code) continue

      const messages = tx.tx?.body?.messages || []
      const bankSend = messages.find(
        (msg: { '@type': string }) => msg['@type'] === '/cosmos.bank.v1beta1.MsgSend'
      )

      if (bankSend && bankSend.to_address.toLowerCase() === VERIFICATION_ADDRESS.toLowerCase()) {
        const isValid = verifyTransaction(walletAddress, bankSend.from_address, bankSend.to_address, memo)

        if (isValid) {
          const token = createSessionToken(walletAddress)
          return NextResponse.json({
            verified: true,
            token,
            walletAddress: walletAddress.toLowerCase(),
            txHash: tx.txhash
          })
        }
      }
    }

    return NextResponse.json({
      verified: false,
      pending: true,
      expiresAt: pending.expiresAt
    })
  } catch {
    return NextResponse.json({
      verified: false,
      pending: true
    })
  }
}
