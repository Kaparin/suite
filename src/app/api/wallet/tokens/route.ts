import { NextRequest, NextResponse } from 'next/server'
import { axiomeClient } from '@/lib/axiome/client'
import { prisma } from '@/lib/prisma'
import { KNOWN_TOKENS, getRegisteredToken } from '@/lib/axiome/token-registry'

const REST_URL = process.env.AXIOME_REST_URL
const CW20_CODE_ID = process.env.NEXT_PUBLIC_CW20_CODE_ID || '1'

interface CW20TokenBalance {
  contractAddress: string
  name: string
  symbol: string
  decimals: number
  balance: string
  displayBalance: string
  logoUrl?: string
  verified?: boolean
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

// Get all CW20 contracts from chain (by code_id)
async function getCW20ContractsByCodeId(codeId: string): Promise<string[]> {
  try {
    const response = await fetch(
      `${REST_URL}/cosmwasm/wasm/v1/code/${codeId}/contracts?pagination.limit=100`,
      { next: { revalidate: 300 } }
    )

    if (response.ok) {
      const data = await response.json()
      return data.contracts || []
    }
  } catch {
    // Ignore errors
  }
  return []
}

// Get token info from contract
async function getTokenInfo(contractAddress: string): Promise<{ name: string; symbol: string; decimals: number } | null> {
  try {
    const query = Buffer.from(JSON.stringify({ token_info: {} })).toString('base64')
    const response = await fetch(
      `${REST_URL}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
      { next: { revalidate: 300 } }
    )

    if (response.ok) {
      const data = await response.json()
      if (data.data) {
        // data.data can be either a base64 string OR already parsed object
        let tokenInfo: { name?: string; symbol?: string; decimals?: number }
        if (typeof data.data === 'string') {
          tokenInfo = JSON.parse(Buffer.from(data.data, 'base64').toString())
        } else {
          tokenInfo = data.data
        }
        return {
          name: tokenInfo.name || 'Unknown Token',
          symbol: tokenInfo.symbol || 'TOKEN',
          decimals: tokenInfo.decimals || 6
        }
      }
    }
  } catch {
    // Ignore errors - not a CW20 contract
  }
  return null
}

// Get CW20 balance for a specific contract
async function getCW20Balance(contractAddress: string, walletAddress: string): Promise<string> {
  try {
    const query = Buffer.from(JSON.stringify({ balance: { address: walletAddress } })).toString('base64')
    const url = `${REST_URL}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`
    const response = await fetch(url, {
      cache: 'no-store' // Disable caching for balance checks
    })

    if (response.ok) {
      const data = await response.json()
      if (data.data) {
        // data.data can be either a base64 string OR already parsed object
        let result: { balance?: string }
        if (typeof data.data === 'string') {
          // Base64 encoded response
          result = JSON.parse(Buffer.from(data.data, 'base64').toString())
        } else {
          // Already parsed object
          result = data.data
        }
        const balance = result.balance || '0'
        if (balance !== '0') {
          console.log(`Found balance ${balance} for ${contractAddress}`)
        }
        return balance
      }
    }
  } catch {
    // Ignore errors - contract may not be CW20
  }
  return '0'
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 })
  }

  if (!REST_URL) {
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

  try {
    // Get native balance
    const nativeBalances = await axiomeClient.getBalances(address)
    const axmBalance = nativeBalances.find(b => b.denom === 'uaxm')

    // Collect all contract addresses to check
    const allContracts = new Set<string>()

    // 1. Add known/verified tokens from registry
    console.log(`Registry has ${KNOWN_TOKENS.length} known tokens`)
    for (const token of KNOWN_TOKENS) {
      allContracts.add(token.contractAddress)
      console.log(`Added registry token: ${token.symbol} - ${token.contractAddress}`)
    }

    // 2. Add CW20 contracts from chain (code_id 1)
    const chainContracts = await getCW20ContractsByCodeId(CW20_CODE_ID)
    console.log(`Chain has ${chainContracts.length} contracts from code_id ${CW20_CODE_ID}`)
    for (const contract of chainContracts) {
      allContracts.add(contract)
    }

    // 3. Get tokens from database for logo/name overrides
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

    for (const token of tokensFromDb) {
      if (token.tokenAddress) {
        allContracts.add(token.tokenAddress)
      }
    }

    const dbTokenMap = new Map(
      tokensFromDb.map(t => [t.tokenAddress, t])
    )

    console.log(`Checking ${allContracts.size} contracts for address ${address}`)

    // Check balance for each contract
    const cw20Tokens: CW20TokenBalance[] = []

    // Process contracts in parallel (batch of 10)
    const contractList = Array.from(allContracts)
    const batchSize = 10

    for (let i = 0; i < contractList.length; i += batchSize) {
      const batch = contractList.slice(i, i + batchSize)

      const results = await Promise.all(
        batch.map(async (contractAddress) => {
          try {
            // Get balance first (fast check)
            const balance = await getCW20Balance(contractAddress, address)

            // Only process if balance > 0
            if (balance !== '0') {
              // Check registry first (verified tokens)
              const registeredToken = getRegisteredToken(contractAddress)
              if (registeredToken) {
                return {
                  contractAddress,
                  name: registeredToken.name,
                  symbol: registeredToken.symbol,
                  decimals: registeredToken.decimals,
                  balance,
                  displayBalance: formatTokenAmount(balance, registeredToken.decimals),
                  logoUrl: registeredToken.logoUrl,
                  verified: registeredToken.verified
                }
              }

              // Check database
              const dbToken = dbTokenMap.get(contractAddress)
              if (dbToken) {
                return {
                  contractAddress,
                  name: dbToken.name,
                  symbol: dbToken.ticker,
                  decimals: 6,
                  balance,
                  displayBalance: formatTokenAmount(balance, 6),
                  logoUrl: dbToken.logo || undefined
                }
              }

              // Fetch from contract
              const tokenInfo = await getTokenInfo(contractAddress)
              if (tokenInfo) {
                return {
                  contractAddress,
                  name: tokenInfo.name,
                  symbol: tokenInfo.symbol,
                  decimals: tokenInfo.decimals,
                  balance,
                  displayBalance: formatTokenAmount(balance, tokenInfo.decimals)
                }
              }
            }
          } catch {
            // Skip failed contracts
          }
          return null
        })
      )

      // Add non-null results
      for (const result of results) {
        if (result) {
          cw20Tokens.push(result)
        }
      }
    }

    // Sort: verified first, then by symbol
    cw20Tokens.sort((a, b) => {
      if (a.verified && !b.verified) return -1
      if (!a.verified && b.verified) return 1
      return a.symbol.localeCompare(b.symbol)
    })

    console.log(`User ${address} has ${cw20Tokens.length} CW20 tokens: ${cw20Tokens.map(t => t.symbol).join(', ')}`)

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
