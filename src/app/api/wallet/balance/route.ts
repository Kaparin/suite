import { NextRequest, NextResponse } from 'next/server'
import { axiomeClient } from '@/lib/axiome/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 })
  }

  // Validate address format
  if (!address.startsWith('axm') || address.length !== 42) {
    return NextResponse.json({ error: 'Invalid address format' }, { status: 400 })
  }

  // Check if REST API is configured
  if (!process.env.AXIOME_REST_URL) {
    // Return mock balance when API not configured
    return NextResponse.json({
      address,
      balances: [],
      axm: {
        amount: '0',
        displayAmount: '-.--'
      },
      warning: 'Blockchain API not configured'
    })
  }

  try {
    const balances = await axiomeClient.getBalances(address)

    // Find AXM balance (uaxm)
    const axmBalance = balances.find(b => b.denom === 'uaxm')
    const axmAmount = axmBalance ? parseInt(axmBalance.amount) / 1_000_000 : 0

    return NextResponse.json({
      address,
      balances: balances.map(b => ({
        denom: b.denom,
        amount: b.amount,
        displayAmount: b.denom === 'uaxm'
          ? (parseInt(b.amount) / 1_000_000).toFixed(2)
          : b.amount
      })),
      axm: {
        amount: axmBalance?.amount || '0',
        displayAmount: axmAmount.toFixed(2)
      }
    })
  } catch (error) {
    console.error('Error fetching balance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    )
  }
}
