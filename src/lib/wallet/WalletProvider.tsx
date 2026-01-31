'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { WalletContextType, WalletState } from './types'
import { AXIOME_CHAIN } from './chain'
import { isValidAxiomeAddress, isMobileDevice } from './axiome-connect'

const initialState: WalletState = {
  isConnected: false,
  isConnecting: false,
  address: null,
  name: null,
  error: null,
}

interface ExtendedWalletContext extends WalletContextType {
  connectionMethod: 'keplr' | 'manual' | null
  showConnectionModal: boolean
  setShowConnectionModal: (show: boolean) => void
  connectWithKeplr: () => Promise<void>
  connectWithAddress: (address: string) => void
  hasKeplr: boolean
}

const WalletContext = createContext<ExtendedWalletContext | null>(null)

const STORAGE_KEY = 'axiome_wallet'

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(initialState)
  const [connectionMethod, setConnectionMethod] = useState<'keplr' | 'manual' | null>(null)
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [hasKeplr, setHasKeplr] = useState(false)

  // Check for Keplr on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasKeplr(!!window.keplr)
    }
  }, [])

  // Restore session from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return

    try {
      const { address, name, method } = JSON.parse(saved)
      if (address && isValidAxiomeAddress(address)) {
        setState({
          isConnected: true,
          isConnecting: false,
          address,
          name: name || null,
          error: null,
        })
        setConnectionMethod(method || 'manual')
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // Listen for Keplr account changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.keplr) return
    if (connectionMethod !== 'keplr') return

    const handleAccountChange = () => {
      window.keplr?.getKey(AXIOME_CHAIN.chainId)
        .then((key) => {
          setState(prev => ({
            ...prev,
            address: key.bech32Address,
            name: key.name,
          }))
          saveSession(key.bech32Address, key.name, 'keplr')
        })
        .catch(console.error)
    }

    window.addEventListener('keplr_keystorechange', handleAccountChange)
    return () => window.removeEventListener('keplr_keystorechange', handleAccountChange)
  }, [connectionMethod])

  const saveSession = (address: string, name: string | null, method: 'keplr' | 'manual') => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ address, name, method }))
  }

  const connectWithKeplr = useCallback(async () => {
    const keplr = window.keplr

    if (!keplr) {
      setState(prev => ({
        ...prev,
        error: 'Keplr wallet not found. Please install the extension.',
      }))
      window.open('https://www.keplr.app/download', '_blank')
      return
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      // Try to enable the chain
      try {
        await keplr.enable(AXIOME_CHAIN.chainId)
      } catch {
        // Chain not found, suggest it
        await keplr.experimentalSuggestChain({
          chainId: AXIOME_CHAIN.chainId,
          chainName: AXIOME_CHAIN.chainName,
          rpc: AXIOME_CHAIN.rpc,
          rest: AXIOME_CHAIN.rest,
          bip44: AXIOME_CHAIN.bip44,
          bech32Config: AXIOME_CHAIN.bech32Config,
          currencies: AXIOME_CHAIN.currencies,
          feeCurrencies: AXIOME_CHAIN.feeCurrencies,
          stakeCurrency: AXIOME_CHAIN.stakeCurrency,
        })
        await keplr.enable(AXIOME_CHAIN.chainId)
      }

      const key = await keplr.getKey(AXIOME_CHAIN.chainId)

      setState({
        isConnected: true,
        isConnecting: false,
        address: key.bech32Address,
        name: key.name,
        error: null,
      })

      setConnectionMethod('keplr')
      saveSession(key.bech32Address, key.name, 'keplr')
      setShowConnectionModal(false)

    } catch (error) {
      console.error('Keplr connection failed:', error)
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect with Keplr',
      }))
    }
  }, [])

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

    setConnectionMethod('manual')
    saveSession(trimmedAddress, null, 'manual')
    setShowConnectionModal(false)
  }, [])

  const connect = useCallback(async () => {
    // If on mobile or no Keplr, show modal
    // If has Keplr, try Keplr first
    if (hasKeplr && !isMobileDevice()) {
      await connectWithKeplr()
    } else {
      setShowConnectionModal(true)
    }
  }, [hasKeplr, connectWithKeplr])

  const disconnect = useCallback(() => {
    setState(initialState)
    setConnectionMethod(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <WalletContext.Provider
      value={{
        ...state,
        connect,
        disconnect,
        connectionMethod,
        showConnectionModal,
        setShowConnectionModal,
        connectWithKeplr,
        connectWithAddress,
        hasKeplr,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet(): ExtendedWalletContext {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
