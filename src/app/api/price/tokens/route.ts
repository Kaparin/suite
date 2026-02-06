import { NextResponse } from 'next/server'

// Axiome Chain LCD endpoint
const LCD_ENDPOINT = 'http://api-docs.axiomeinfo.org:1317'

// Known swap pools on Axiome DEX
const SWAP_POOLS = [
  {
    address: 'axm1fh0hm98gkd96rx3w92ea2wm45q85eu9g3hqvx2p968ppfqv392vs8d4jqx',
    name: 'ATT',
    tokenAddress: 'axm18a0pvw326fydfdat5tzyf4t8lhz0v6fyfaujpeg07fwqkygcxejs0gqae4'
  },
  {
    address: 'axm1zjd5lwhch4ndnmayqxurja4x5y5mavy9ktrk6fzsyzan4wcgawnqeh4llv',
    name: 'CHAPA',
    tokenAddress: 'axm1t3f4zxve6725sf4glrnlar8uku78j0nyfl0ppzgfju9ft9phvqwqfhrfg5'
  },
  {
    address: 'axm1tzv867e4qz06rue60k4v2pk5xevj9gn3r7274qv0nprl68kvykgs6w4emy',
    name: 'SIMBA',
    tokenAddress: 'axm14rse3e7rkc3qt7drmlulwlkrlzqvh7hv277zv05kyfuwl74udx5sdlw02u'
  },
  {
    address: 'axm1qsufk856fmakeycjq5swmtd53l4drqtu4xefdfuu9h4m5ce89rhschkv0c',
    name: 'AXP',
    tokenAddress: 'axm1etxtq3v4chzn7xrah3w6ukkxy7vlc889n5ervgxz425msar6ajzskdmm0v'
  },
  {
    address: 'axm1n8zk28ycq7s5epdknwytvvpt8848954yfuz0vcf6l3yz73g4sd2s36s3wm',
    name: 'KEPY',
    tokenAddress: 'axm14vjqp6cq9mr90wzmqxsa5erx70h4xy5eep0jynjqmlstupngtghqspmr7q'
  }
]

interface PoolInfo {
  token1_reserve: string
  token1_denom: { native: string } | { cw20: string }
  token2_reserve: string
  token2_denom: { native: string } | { cw20: string }
  lp_token_supply: string
  lp_token_address: string
}

interface TokenInfo {
  name: string
  symbol: string
  decimals: number
  total_supply: string
}

export interface TokenPriceData {
  symbol: string
  name: string
  contractAddress: string
  poolAddress: string
  priceInAxm: number
  priceInUsd: number | null
  axmReserve: number
  tokenReserve: number
  liquidity: number
  decimals: number
  totalSupply: number
  timestamp: number
}

export interface TokenPricesResponse {
  tokens: TokenPriceData[]
  axmPriceUsd: number | null
  timestamp: number
}

// Cache for 30 seconds
let cachedData: TokenPricesResponse | null = null
let cacheTime = 0
const CACHE_TTL = 30000 // 30 seconds

async function queryContract<T>(contractAddress: string, query: object): Promise<T | null> {
  try {
    const queryBase64 = Buffer.from(JSON.stringify(query)).toString('base64')
    const response = await fetch(
      `${LCD_ENDPOINT}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${queryBase64}`,
      { next: { revalidate: 30 } }
    )

    if (!response.ok) {
      console.error(`Contract query failed for ${contractAddress}:`, response.status)
      return null
    }

    const result = await response.json()
    return result.data as T
  } catch (error) {
    console.error(`Contract query error for ${contractAddress}:`, error)
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

async function fetchTokenPrices(): Promise<TokenPricesResponse> {
  const axmPriceUsd = await getAxmPriceUsd()
  const tokens: TokenPriceData[] = []

  await Promise.all(
    SWAP_POOLS.map(async (pool) => {
      try {
        // Query pool info
        const poolInfo = await queryContract<PoolInfo>(pool.address, { info: {} })
        if (!poolInfo) return

        // Query token info
        const tokenInfo = await queryContract<TokenInfo>(pool.tokenAddress, { token_info: {} })
        if (!tokenInfo) return

        // Calculate reserves (assuming 6 decimals for both AXM and tokens)
        const axmDecimals = 6
        const tokenDecimals = tokenInfo.decimals || 6

        const axmReserve = parseInt(poolInfo.token1_reserve) / Math.pow(10, axmDecimals)
        const tokenReserve = parseInt(poolInfo.token2_reserve) / Math.pow(10, tokenDecimals)

        // Price = AXM reserve / Token reserve
        const priceInAxm = axmReserve / tokenReserve
        const priceInUsd = axmPriceUsd ? priceInAxm * axmPriceUsd : null

        // Total liquidity in AXM (both sides)
        const liquidity = axmReserve * 2

        tokens.push({
          symbol: tokenInfo.symbol,
          name: tokenInfo.name,
          contractAddress: pool.tokenAddress,
          poolAddress: pool.address,
          priceInAxm,
          priceInUsd,
          axmReserve,
          tokenReserve,
          liquidity,
          decimals: tokenDecimals,
          totalSupply: parseInt(tokenInfo.total_supply) / Math.pow(10, tokenDecimals),
          timestamp: Date.now()
        })
      } catch (error) {
        console.error(`Error fetching pool ${pool.name}:`, error)
      }
    })
  )

  // Sort by liquidity (highest first)
  tokens.sort((a, b) => b.liquidity - a.liquidity)

  return {
    tokens,
    axmPriceUsd,
    timestamp: Date.now()
  }
}

export async function GET() {
  try {
    const now = Date.now()

    // Return cached data if still valid
    if (cachedData && now - cacheTime < CACHE_TTL) {
      return NextResponse.json(cachedData)
    }

    const data = await fetchTokenPrices()

    // Update cache
    cachedData = data
    cacheTime = now

    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch token prices:', error)

    // Return cached data if available, even if stale
    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    return NextResponse.json(
      { error: 'Failed to fetch token prices' },
      { status: 500 }
    )
  }
}
