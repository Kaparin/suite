'use client'

import { useState, useEffect, useCallback } from 'react'

export interface CW20TokenBalance {
  contractAddress: string
  name: string
  symbol: string
  decimals: number
  balance: string
  displayBalance: string
  logoUrl?: string
  verified?: boolean
}

interface TokensResponse {
  nativeBalance: {
    denom: string
    amount: string
    displayAmount: string
    displayDenom: string
  }
  cw20Tokens: CW20TokenBalance[]
}

interface UseTokenBalancesReturn {
  tokens: CW20TokenBalance[]
  nativeBalance: TokensResponse['nativeBalance'] | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useTokenBalances(address: string | null): UseTokenBalancesReturn {
  const [tokens, setTokens] = useState<CW20TokenBalance[]>([])
  const [nativeBalance, setNativeBalance] = useState<TokensResponse['nativeBalance'] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTokens = useCallback(async () => {
    if (!address) {
      setTokens([])
      setNativeBalance(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/wallet/tokens?address=${encodeURIComponent(address)}`)

      if (!response.ok) {
        throw new Error('Failed to fetch token balances')
      }

      const data: TokensResponse = await response.json()
      setNativeBalance(data.nativeBalance)
      setTokens(data.cw20Tokens || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setTokens([])
    } finally {
      setIsLoading(false)
    }
  }, [address])

  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  return {
    tokens,
    nativeBalance,
    isLoading,
    error,
    refresh: fetchTokens
  }
}
