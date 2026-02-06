/**
 * Axiome DEX Pool Discovery Service
 *
 * Automatically discovers all swap pools and their token pairs
 * from the Axiome blockchain.
 */

const LCD_ENDPOINT = process.env.AXIOME_REST_URL || 'http://api-docs.axiomeinfo.org:1317'
const SWAP_POOL_CODE_ID = '2' // WasmSwap contract code ID

export interface PoolInfo {
  poolAddress: string
  token1Denom: { native: string } | { cw20: string }
  token2Denom: { native: string } | { cw20: string }
  token1Reserve: string
  token2Reserve: string
  lpTokenAddress: string
  lpTokenSupply: string
}

export interface TokenPoolData {
  tokenAddress: string
  poolAddress: string
  priceInAxm: number
  axmReserve: number
  tokenReserve: number
  liquidity: number // Total liquidity in AXM
}

// Cache for pool data
let poolCache: Map<string, TokenPoolData> = new Map()
let poolCacheTime = 0
const POOL_CACHE_TTL = 60000 // 1 minute

// AXM price cache
let axmPriceCache: number | null = null
let axmPriceCacheTime = 0
const AXM_PRICE_CACHE_TTL = 30000 // 30 seconds

/**
 * Query a CosmWasm contract
 */
async function queryContract<T>(contractAddress: string, query: object): Promise<T | null> {
  try {
    const queryBase64 = Buffer.from(JSON.stringify(query)).toString('base64')
    const response = await fetch(
      `${LCD_ENDPOINT}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${queryBase64}`,
      { next: { revalidate: 60 } }
    )

    if (!response.ok) return null
    const result = await response.json()
    return result.data as T
  } catch {
    return null
  }
}

/**
 * Get all swap pool contract addresses
 */
async function getAllPoolAddresses(): Promise<string[]> {
  try {
    const response = await fetch(
      `${LCD_ENDPOINT}/cosmwasm/wasm/v1/code/${SWAP_POOL_CODE_ID}/contracts?pagination.limit=100`,
      { next: { revalidate: 60 } }
    )

    if (!response.ok) return []
    const data = await response.json()
    return data.contracts || []
  } catch {
    return []
  }
}

/**
 * Get pool info from a swap contract
 */
async function getPoolInfo(poolAddress: string): Promise<PoolInfo | null> {
  const info = await queryContract<{
    token1_reserve: string
    token1_denom: { native: string } | { cw20: string }
    token2_reserve: string
    token2_denom: { native: string } | { cw20: string }
    lp_token_supply: string
    lp_token_address: string
  }>(poolAddress, { info: {} })

  if (!info) return null

  return {
    poolAddress,
    token1Denom: info.token1_denom,
    token2Denom: info.token2_denom,
    token1Reserve: info.token1_reserve,
    token2Reserve: info.token2_reserve,
    lpTokenAddress: info.lp_token_address,
    lpTokenSupply: info.lp_token_supply
  }
}

/**
 * Get AXM price in USD from MEXC
 */
export async function getAxmPriceUsd(): Promise<number | null> {
  const now = Date.now()
  if (axmPriceCache !== null && now - axmPriceCacheTime < AXM_PRICE_CACHE_TTL) {
    return axmPriceCache
  }

  try {
    const response = await fetch(
      'https://api.mexc.com/api/v3/ticker/24hr?symbol=AXMUSDT',
      { next: { revalidate: 30 } }
    )
    if (!response.ok) return null
    const data = await response.json()
    axmPriceCache = parseFloat(data.lastPrice)
    axmPriceCacheTime = now
    return axmPriceCache
  } catch {
    return null
  }
}

/**
 * Discover all pools and create a mapping of token address -> pool data
 */
export async function discoverAllPools(): Promise<Map<string, TokenPoolData>> {
  const now = Date.now()

  // Return cached data if still valid
  if (poolCache.size > 0 && now - poolCacheTime < POOL_CACHE_TTL) {
    return poolCache
  }

  const tokenToPool = new Map<string, TokenPoolData>()

  try {
    const poolAddresses = await getAllPoolAddresses()

    // Fetch all pool info in parallel
    const poolInfos = await Promise.all(
      poolAddresses.map(addr => getPoolInfo(addr))
    )

    for (const poolInfo of poolInfos) {
      if (!poolInfo) continue

      // Determine which side is AXM (native uaxm) and which is the CW20 token
      let tokenAddress: string | null = null
      let axmReserve = 0
      let tokenReserve = 0

      // token1 is usually native AXM, token2 is CW20
      if ('native' in poolInfo.token1Denom && poolInfo.token1Denom.native === 'uaxm') {
        if ('cw20' in poolInfo.token2Denom) {
          tokenAddress = poolInfo.token2Denom.cw20
          axmReserve = parseInt(poolInfo.token1Reserve) / 1e6 // uaxm -> AXM
          tokenReserve = parseInt(poolInfo.token2Reserve) / 1e6 // assuming 6 decimals
        }
      } else if ('native' in poolInfo.token2Denom && poolInfo.token2Denom.native === 'uaxm') {
        if ('cw20' in poolInfo.token1Denom) {
          tokenAddress = poolInfo.token1Denom.cw20
          axmReserve = parseInt(poolInfo.token2Reserve) / 1e6
          tokenReserve = parseInt(poolInfo.token1Reserve) / 1e6
        }
      }

      if (tokenAddress && axmReserve > 0 && tokenReserve > 0) {
        const priceInAxm = axmReserve / tokenReserve
        const liquidity = axmReserve * 2 // Both sides in AXM terms

        tokenToPool.set(tokenAddress.toLowerCase(), {
          tokenAddress,
          poolAddress: poolInfo.poolAddress,
          priceInAxm,
          axmReserve,
          tokenReserve,
          liquidity
        })
      }
    }

    // Update cache
    poolCache = tokenToPool
    poolCacheTime = now

    return tokenToPool
  } catch (error) {
    console.error('Error discovering pools:', error)
    return poolCache.size > 0 ? poolCache : new Map()
  }
}

/**
 * Get pool data for a specific token
 */
export async function getTokenPoolData(tokenAddress: string): Promise<TokenPoolData | null> {
  const pools = await discoverAllPools()
  return pools.get(tokenAddress.toLowerCase()) || null
}

/**
 * Get token price in AXM and USD
 */
export async function getTokenPrice(tokenAddress: string): Promise<{
  priceInAxm: number | null
  priceInUsd: number | null
  hasPool: boolean
}> {
  const poolData = await getTokenPoolData(tokenAddress)

  if (!poolData) {
    return { priceInAxm: null, priceInUsd: null, hasPool: false }
  }

  const axmPriceUsd = await getAxmPriceUsd()
  const priceInUsd = axmPriceUsd ? poolData.priceInAxm * axmPriceUsd : null

  return {
    priceInAxm: poolData.priceInAxm,
    priceInUsd,
    hasPool: true
  }
}

/**
 * Get all token prices (batch operation)
 */
export async function getAllTokenPrices(): Promise<Map<string, {
  priceInAxm: number
  priceInUsd: number | null
  liquidity: number
}>> {
  const pools = await discoverAllPools()
  const axmPriceUsd = await getAxmPriceUsd()

  const prices = new Map<string, {
    priceInAxm: number
    priceInUsd: number | null
    liquidity: number
  }>()

  for (const [tokenAddress, poolData] of pools) {
    prices.set(tokenAddress, {
      priceInAxm: poolData.priceInAxm,
      priceInUsd: axmPriceUsd ? poolData.priceInAxm * axmPriceUsd : null,
      liquidity: poolData.liquidity
    })
  }

  return prices
}
