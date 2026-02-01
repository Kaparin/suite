'use client'

import { useState, useEffect, useCallback } from 'react'

export type TransactionType = 'send' | 'receive' | 'contract' | 'instantiate' | 'delegate' | 'undelegate'
export type TransactionStatus = 'success' | 'failed'

export interface Transaction {
  hash: string
  height: number
  timestamp: string
  type: TransactionType
  status: TransactionStatus
  from: string
  to: string
  amount: {
    value: string
    denom: string
    displayValue: string
    displayDenom: string
  }
  fee: {
    value: string
    displayValue: string
  }
  memo?: string
  contractAddress?: string
  contractAction?: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

interface TransactionsResponse {
  transactions: Transaction[]
  pagination: PaginationInfo
}

interface UseTransactionHistoryOptions {
  address: string | null
  type?: 'all' | TransactionType
  limit?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseTransactionHistoryReturn {
  transactions: Transaction[]
  pagination: PaginationInfo | null
  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

export function useTransactionHistory(options: UseTransactionHistoryOptions): UseTransactionHistoryReturn {
  const {
    address,
    type = 'all',
    limit = 20,
    autoRefresh = false,
    refreshInterval = 30000
  } = options

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const fetchTransactions = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!address) {
      setTransactions([])
      setPagination(null)
      return
    }

    if (append) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      const params = new URLSearchParams({
        address,
        page: pageNum.toString(),
        limit: limit.toString()
      })

      if (type !== 'all') {
        params.set('type', type)
      }

      const response = await fetch(`/api/wallet/transactions?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const data: TransactionsResponse = await response.json()

      if (append) {
        setTransactions(prev => [...prev, ...data.transactions])
      } else {
        setTransactions(data.transactions)
      }

      setPagination(data.pagination)
      setPage(pageNum)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      if (!append) {
        setTransactions([])
      }
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [address, type, limit])

  // Initial fetch
  useEffect(() => {
    setPage(1)
    fetchTransactions(1, false)
  }, [address, type, limit]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !address) return

    const interval = setInterval(() => {
      fetchTransactions(1, false)
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, address, fetchTransactions])

  const loadMore = useCallback(async () => {
    if (pagination?.hasMore && !isLoadingMore) {
      await fetchTransactions(page + 1, true)
    }
  }, [pagination, isLoadingMore, page, fetchTransactions])

  const refresh = useCallback(async () => {
    setPage(1)
    await fetchTransactions(1, false)
  }, [fetchTransactions])

  return {
    transactions,
    pagination,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    refresh
  }
}
