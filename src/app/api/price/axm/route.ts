import { NextResponse } from 'next/server'

interface MexcTickerResponse {
  symbol: string
  lastPrice: string
  priceChange: string
  priceChangePercent: string
  highPrice: string
  lowPrice: string
  volume: string
  quoteVolume: string
  openPrice: string
  openTime: number
  closeTime: number
}

export interface AXMPriceData {
  price: number
  change24h: number
  changePercent24h: number
  high24h: number
  low24h: number
  volume24h: number
  volumeUSDT24h: number
  timestamp: number
}

// Cache for 10 seconds to avoid rate limiting
let cachedData: AXMPriceData | null = null
let cacheTime = 0
const CACHE_TTL = 10000 // 10 seconds

export async function GET() {
  try {
    const now = Date.now()

    // Return cached data if still valid
    if (cachedData && now - cacheTime < CACHE_TTL) {
      return NextResponse.json(cachedData)
    }

    const response = await fetch(
      'https://api.mexc.com/api/v3/ticker/24hr?symbol=AXMUSDT',
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 10 } // Next.js cache for 10 seconds
      }
    )

    if (!response.ok) {
      throw new Error(`MEXC API error: ${response.status}`)
    }

    const data: MexcTickerResponse = await response.json()

    const priceData: AXMPriceData = {
      price: parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChange),
      changePercent24h: parseFloat(data.priceChangePercent),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      volume24h: parseFloat(data.volume),
      volumeUSDT24h: parseFloat(data.quoteVolume),
      timestamp: Date.now()
    }

    // Update cache
    cachedData = priceData
    cacheTime = now

    return NextResponse.json(priceData)
  } catch (error) {
    console.error('Failed to fetch AXM price:', error)

    // Return cached data if available, even if stale
    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    return NextResponse.json(
      { error: 'Failed to fetch price data' },
      { status: 500 }
    )
  }
}
