import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { KNOWN_TOKENS } from '@/lib/axiome/token-registry'

const REST_URL = process.env.AXIOME_REST_URL
const CW20_CODE_ID = process.env.NEXT_PUBLIC_CW20_CODE_ID || '1'

interface TokenData {
  contractAddress: string
  name: string
  symbol: string
  decimals: number
  totalSupply: string
  displayTotalSupply: string
  logoUrl?: string
  description?: string
  verified: boolean
  createdAt?: string
  holderCount: number
  owner?: string
  isNew: boolean
  isTrending: boolean
  isVerified: boolean
}

// Get all CW20 contracts from chain
async function getChainContracts(): Promise<string[]> {
  if (!REST_URL) return []

  try {
    const response = await fetch(
      `${REST_URL}/cosmwasm/wasm/v1/code/${CW20_CODE_ID}/contracts?pagination.limit=100`,
      { next: { revalidate: 60 } }
    )

    if (response.ok) {
      const data = await response.json()
      return data.contracts || []
    }
  } catch {
    // Ignore
  }
  return []
}

// Get token info from contract
async function getTokenInfo(contractAddress: string) {
  if (!REST_URL) return null

  try {
    const query = Buffer.from(JSON.stringify({ token_info: {} })).toString('base64')
    const response = await fetch(
      `${REST_URL}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
      { next: { revalidate: 300 } }
    )

    if (response.ok) {
      const data = await response.json()
      if (data.data) {
        let tokenInfo
        if (typeof data.data === 'string') {
          tokenInfo = JSON.parse(Buffer.from(data.data, 'base64').toString())
        } else {
          tokenInfo = data.data
        }
        return tokenInfo
      }
    }
  } catch {
    // Not a CW20 or error
  }
  return null
}

// Get marketing info from contract
async function getMarketingInfo(contractAddress: string) {
  if (!REST_URL) return null

  try {
    const query = Buffer.from(JSON.stringify({ marketing_info: {} })).toString('base64')
    const response = await fetch(
      `${REST_URL}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
      { next: { revalidate: 300 } }
    )

    if (response.ok) {
      const data = await response.json()
      if (data.data) {
        let info
        if (typeof data.data === 'string') {
          info = JSON.parse(Buffer.from(data.data, 'base64').toString())
        } else {
          info = data.data
        }
        return info
      }
    }
  } catch {
    // No marketing info
  }
  return null
}

function formatAmount(amount: string, decimals: number): string {
  const value = BigInt(amount || '0')
  const divisor = BigInt(10 ** decimals)
  const wholePart = value / divisor
  return wholePart.toLocaleString()
}

// GET /api/tokens/live - On-chain tokens only
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'all'
  const search = searchParams.get('search') || ''
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    // Get all contracts from chain
    const chainContracts = await getChainContracts()

    // Get projects from database for metadata
    const dbProjects = await prisma.project.findMany({
      where: {
        tokenAddress: { not: null },
        status: 'LAUNCHED'
      },
      select: {
        tokenAddress: true,
        name: true,
        ticker: true,
        logo: true,
        descriptionShort: true,
        links: true,
        createdAt: true,
        isVerified: true,
        owner: {
          select: { walletAddress: true }
        }
      }
    })

    const dbProjectMap = new Map(
      dbProjects.map(p => [p.tokenAddress?.toLowerCase(), p])
    )

    // Collect all unique contracts
    const allContracts = new Set<string>()

    // Add known tokens
    for (const token of KNOWN_TOKENS) {
      allContracts.add(token.contractAddress)
    }

    // Add chain contracts
    for (const contract of chainContracts) {
      allContracts.add(contract)
    }

    // Fetch token data
    const tokens: TokenData[] = []
    const contractList = Array.from(allContracts)

    // Process in parallel batches
    const batchSize = 10
    for (let i = 0; i < contractList.length; i += batchSize) {
      const batch = contractList.slice(i, i + batchSize)

      const results = await Promise.all(
        batch.map(async (contractAddress) => {
          try {
            const knownToken = KNOWN_TOKENS.find(
              t => t.contractAddress.toLowerCase() === contractAddress.toLowerCase()
            )
            const dbProject = dbProjectMap.get(contractAddress.toLowerCase())

            const tokenInfo = await getTokenInfo(contractAddress)
            if (!tokenInfo) return null

            const marketingInfo = await getMarketingInfo(contractAddress)
            const decimals = tokenInfo.decimals || 6
            const now = new Date()
            const createdAt = dbProject?.createdAt || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            const ageInDays = Math.floor((now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))

            const token: TokenData = {
              contractAddress,
              name: knownToken?.name || dbProject?.name || tokenInfo.name || 'Unknown',
              symbol: knownToken?.symbol || dbProject?.ticker || tokenInfo.symbol || 'TOKEN',
              decimals,
              totalSupply: tokenInfo.total_supply || '0',
              displayTotalSupply: formatAmount(tokenInfo.total_supply || '0', decimals),
              logoUrl: knownToken?.logoUrl || dbProject?.logo || marketingInfo?.logo?.url,
              description: dbProject?.descriptionShort || marketingInfo?.description,
              verified: knownToken?.verified || dbProject?.isVerified || false,
              createdAt: createdAt.toISOString(),
              holderCount: 0,
              owner: dbProject?.owner?.walletAddress || undefined,
              isNew: ageInDays <= 7,
              isTrending: false,
              isVerified: knownToken?.verified || dbProject?.isVerified || false
            }

            return token
          } catch {
            return null
          }
        })
      )

      for (const token of results) {
        if (token) tokens.push(token)
      }
    }

    // Apply filters
    let filteredTokens = tokens

    if (search) {
      const searchLower = search.toLowerCase()
      filteredTokens = filteredTokens.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        t.symbol.toLowerCase().includes(searchLower) ||
        t.contractAddress.toLowerCase().includes(searchLower)
      )
    }

    switch (category) {
      case 'new':
        filteredTokens = filteredTokens.filter(t => t.isNew)
        break
      case 'verified':
        filteredTokens = filteredTokens.filter(t => t.isVerified)
        break
      case 'trending':
        filteredTokens = filteredTokens.filter(t => t.isTrending)
        break
    }

    // Sort: verified first, then by creation date
    filteredTokens.sort((a, b) => {
      if (a.isVerified && !b.isVerified) return -1
      if (!a.isVerified && b.isVerified) return 1
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })

    const total = filteredTokens.length
    const paginatedTokens = filteredTokens.slice(offset, offset + limit)

    const counts = {
      all: tokens.length,
      new: tokens.filter(t => t.isNew).length,
      verified: tokens.filter(t => t.isVerified).length,
      trending: tokens.filter(t => t.isTrending).length
    }

    return NextResponse.json({
      tokens: paginatedTokens,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
      counts
    })
  } catch (error) {
    console.error('Error fetching live tokens:', error)

    const fallbackTokens: TokenData[] = KNOWN_TOKENS.map(t => ({
      contractAddress: t.contractAddress,
      name: t.name,
      symbol: t.symbol,
      decimals: t.decimals,
      totalSupply: '0',
      displayTotalSupply: '0',
      logoUrl: t.logoUrl,
      verified: t.verified || false,
      holderCount: 0,
      isNew: false,
      isTrending: false,
      isVerified: t.verified || false
    }))

    return NextResponse.json({
      tokens: fallbackTokens,
      pagination: { total: fallbackTokens.length, limit, offset, hasMore: false },
      counts: { all: fallbackTokens.length, new: 0, verified: fallbackTokens.filter(t => t.verified).length, trending: 0 }
    })
  }
}
