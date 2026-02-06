import { NextRequest, NextResponse } from 'next/server'

// Axiome Chain LCD endpoint
const LCD_ENDPOINT = 'http://api-docs.axiomeinfo.org:1317'

// Map token addresses to their pool addresses
const TOKEN_TO_POOL: Record<string, string> = {
  'axm18a0pvw326fydfdat5tzyf4t8lhz0v6fyfaujpeg07fwqkygcxejs0gqae4': 'axm1fh0hm98gkd96rx3w92ea2wm45q85eu9g3hqvx2p968ppfqv392vs8d4jqx', // ATT
  'axm1t3f4zxve6725sf4glrnlar8uku78j0nyfl0ppzgfju9ft9phvqwqfhrfg5': 'axm1zjd5lwhch4ndnmayqxurja4x5y5mavy9ktrk6fzsyzan4wcgawnqeh4llv', // CHAPA
  'axm14rse3e7rkc3qt7drmlulwlkrlzqvh7hv277zv05kyfuwl74udx5sdlw02u': 'axm1tzv867e4qz06rue60k4v2pk5xevj9gn3r7274qv0nprl68kvykgs6w4emy', // SIMBA
  'axm1etxtq3v4chzn7xrah3w6ukkxy7vlc889n5ervgxz425msar6ajzskdmm0v': 'axm1qsufk856fmakeycjq5swmtd53l4drqtu4xefdfuu9h4m5ce89rhschkv0c', // AXP
  'axm14vjqp6cq9mr90wzmqxsa5erx70h4xy5eep0jynjqmlstupngtghqspmr7q': 'axm1n8zk28ycq7s5epdknwytvvpt8848954yfuz0vcf6l3yz73g4sd2s36s3wm', // KEPY
}

interface PoolInfo {
  token1_reserve: string
  token2_reserve: string
}

interface TokenInfo {
  name: string
  symbol: string
  decimals: number
  total_supply: string
}

export interface SingleTokenPriceData {
  symbol: string
  name: string
  contractAddress: string
  poolAddress: string | null
  priceInAxm: number | null
  priceInUsd: number | null
  axmReserve: number | null
  tokenReserve: number | null
  decimals: number
  totalSupply: number
  hasPool: boolean
  timestamp: number
}

// Simple cache per token
const tokenCache = new Map<string, { data: SingleTokenPriceData; time: number }>()
const CACHE_TTL = 30000 // 30 seconds

async function queryContract<T>(contractAddress: string, query: object): Promise<T | null> {
  try {
    const queryBase64 = Buffer.from(JSON.stringify(query)).toString('base64')
    const response = await fetch(
      `${LCD_ENDPOINT}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${queryBase64}`,
      { next: { revalidate: 30 } }
    )

    if (!response.ok) return null
    const result = await response.json()
    return result.data as T
  } catch {
    return null
  }
}

async function getAxmPriceUsd(): Promise<number | null> {
  try {
    const response = await fetch(
      'https://api.mexc.com/api/v3/ticker/24hr?symbol=AXMUSDT',
      { next: { revalidate: 30 } }
    )
    if (!response.ok) return null
    const data = await response.json()
    return parseFloat(data.lastPrice)
  } catch {
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params
  const tokenAddress = address.toLowerCase()

  try {
    const now = Date.now()

    // Check cache
    const cached = tokenCache.get(tokenAddress)
    if (cached && now - cached.time < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }

    // Query token info
    const tokenInfo = await queryContract<TokenInfo>(tokenAddress, { token_info: {} })
    if (!tokenInfo) {
      return NextResponse.json(
        { error: 'Token not found or not a valid CW20 token' },
        { status: 404 }
      )
    }

    const tokenDecimals = tokenInfo.decimals || 6
    const poolAddress = TOKEN_TO_POOL[tokenAddress] || null

    let priceInAxm: number | null = null
    let priceInUsd: number | null = null
    let axmReserve: number | null = null
    let tokenReserve: number | null = null

    // If token has a pool, get price data
    if (poolAddress) {
      const poolInfo = await queryContract<PoolInfo>(poolAddress, { info: {} })
      if (poolInfo) {
        const axmDecimals = 6
        axmReserve = parseInt(poolInfo.token1_reserve) / Math.pow(10, axmDecimals)
        tokenReserve = parseInt(poolInfo.token2_reserve) / Math.pow(10, tokenDecimals)
        priceInAxm = axmReserve / tokenReserve

        const axmPriceUsd = await getAxmPriceUsd()
        if (axmPriceUsd) {
          priceInUsd = priceInAxm * axmPriceUsd
        }
      }
    }

    const data: SingleTokenPriceData = {
      symbol: tokenInfo.symbol,
      name: tokenInfo.name,
      contractAddress: tokenAddress,
      poolAddress,
      priceInAxm,
      priceInUsd,
      axmReserve,
      tokenReserve,
      decimals: tokenDecimals,
      totalSupply: parseInt(tokenInfo.total_supply) / Math.pow(10, tokenDecimals),
      hasPool: poolAddress !== null,
      timestamp: now
    }

    // Update cache
    tokenCache.set(tokenAddress, { data, time: now })

    return NextResponse.json(data)
  } catch (error) {
    console.error(`Failed to fetch token price for ${tokenAddress}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch token price' },
      { status: 500 }
    )
  }
}
