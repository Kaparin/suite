'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { WalletState } from './types'
import { isValidAxiomeAddress } from './axiome-connect'

interface BalanceInfo {
  axm: string
  isLoading: boolean
  error: string | null
}

interface WalletContextType extends WalletState {
  connect: () => void
  disconnect: () => void
  showConnectionModal: boolean
  setShowConnectionModal: (show: boolean) => void
  connectWithAddress: (address: string) => void
  balance: BalanceInfo
  refreshBalance: () => Promise<void>
}

const initialState: WalletState = {
  isConnected: false,
  isConnecting: false,
  address: null,
  name: null,
  error: null,
}

const initialBalance: BalanceInfo = {
  axm: '0',
  isLoading: false,
  error: null,
}

const WalletContext = createContext<WalletContextType | null>(null)

const STORAGE_KEY = 'axiome_wallet'

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(initialState)
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [balance, setBalance] = useState<BalanceInfo>(initialBalance)

  // Fetch balance from API
  const fetchBalance = useCallback(async (address: string) => {
    setBalance(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`/api/wallet/balance?address=${address}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch balance')
      }

      setBalance({
        axm: data.axm?.displayAmount || '0',
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error('Error fetching balance:', error)
      setBalance(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch balance',
      }))
    }
  }, [])

  // Refresh balance manually
  const refreshBalance = useCallback(async () => {
    if (state.address) {
      await fetchBalance(state.address)
    }
  }, [state.address, fetchBalance])

  // Restore session from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return

    try {
      const { address, name } = JSON.parse(saved)
      if (address && isValidAxiomeAddress(address)) {
        setState({
          isConnected: true,
          isConnecting: false,
          address,
          name: name || null,
          error: null,
        })
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // Fetch balance when address changes
  useEffect(() => {
    if (state.address) {
      fetchBalance(state.address)
    } else {
      setBalance(initialBalance)
    }
  }, [state.address, fetchBalance])

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (!state.address) return

    const interval = setInterval(() => {
      fetchBalance(state.address!)
    }, 30000)

    return () => clearInterval(interval)
  }, [state.address, fetchBalance])

  const saveSession = (address: string, name: string | null) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ address, name }))
  }

  const connectWithAddress = useCallback((address: string) => {
    const trimmedAddress = address.trim()

    if (!isValidAxiomeAddress(trimmedAddress)) {
      setState(prev => ({
        ...prev,
        error: 'Invalid Axiome address. Address should start with "axm" and be 42 characters.',
      }))
      return
    }

    setState({
      isConnected: true,
      isConnecting: false,
      address: trimmedAddress,
      name: null,
      error: null,
    })

    saveSession(trimmedAddress, null)
    setShowConnectionModal(false)
  }, [])

  const connect = useCallback(() => {
    setShowConnectionModal(true)
  }, [])

  const disconnect = useCallback(() => {
    setState(initialState)
    setBalance(initialBalance)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <WalletContext.Provider
      value={{
        ...state,
        connect,
        disconnect,
        showConnectionModal,
        setShowConnectionModal,
        connectWithAddress,
        balance,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
