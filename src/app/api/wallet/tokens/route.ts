import { NextRequest, NextResponse } from 'next/server'
import { axiomeClient } from '@/lib/axiome/client'
import { prisma } from '@/lib/prisma'

interface CW20TokenBalance {
  contractAddress: string
  name: string
  symbol: string
  decimals: number
  balance: string
  displayBalance: string
  logoUrl?: string
}

function formatTokenAmount(amount: string, decimals: number): string {
  const value = parseInt(amount || '0')
  const divisor = Math.pow(10, decimals)
  const formatted = (value / divisor).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals > 2 ? 4 : 2
  })
  return formatted
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 })
  }

  try {
    // Get native balance
    const nativeBalances = await axiomeClient.getBalances(address)
    const axmBalance = nativeBalances.find(b => b.denom === 'uaxm')

    // Get all projects with token addresses from database
    const tokensFromDb = await prisma.project.findMany({
      where: {
        tokenAddress: { not: null }
      },
      select: {
        tokenAddress: true,
        name: true,
        ticker: true,
        logo: true
      },
      take: 100
    })

    // Fetch CW20 balances for known tokens
    const cw20Tokens: CW20TokenBalance[] = []

    for (const token of tokensFromDb) {
      if (!token.tokenAddress) continue

      try {
        const balance = await axiomeClient.getCW20Balance(token.tokenAddress, address)

        // Only include tokens with non-zero balance
        if (balance !== '0') {
          cw20Tokens.push({
            contractAddress: token.tokenAddress,
            name: token.name,
            symbol: token.ticker,
            decimals: 6, // Default decimals
            balance,
            displayBalance: formatTokenAmount(balance, 6),
            logoUrl: token.logo || undefined
          })
        }
      } catch {
        // Skip tokens that fail to fetch
        continue
      }
    }

    return NextResponse.json({
      nativeBalance: {
        denom: 'uaxm',
        amount: axmBalance?.amount || '0',
        displayAmount: formatTokenAmount(axmBalance?.amount || '0', 6),
        displayDenom: 'AXM'
      },
      cw20Tokens
    })
  } catch (error) {
    console.error('Error fetching tokens:', error)

    // Return empty data on error
    return NextResponse.json({
      nativeBalance: {
        denom: 'uaxm',
        amount: '0',
        displayAmount: '0.00',
        displayDenom: 'AXM'
      },
      cw20Tokens: []
    })
  }
}
