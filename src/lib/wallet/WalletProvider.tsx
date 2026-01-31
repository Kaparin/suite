'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { WalletContextType, WalletState } from './types'
import { AXIOME_CHAIN } from './chain'

const initialState: WalletState = {
  isConnected: false,
  isConnecting: false,
  address: null,
  name: null,
  error: null,
}

const WalletContext = createContext<WalletContextType | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(initialState)

  // Check if Keplr is available
  const getKeplr = useCallback(() => {
    if (typeof window === 'undefined') return null
    return window.keplr
  }, [])

  // Restore connection from localStorage
  useEffect(() => {
    const savedAddress = localStorage.getItem('wallet_address')
    const savedName = localStorage.getItem('wallet_name')

    if (savedAddress) {
      // Verify connection is still valid
      const keplr = getKeplr()
      if (keplr) {
        keplr.getKey(AXIOME_CHAIN.chainId)
          .then((key) => {
            if (key.bech32Address === savedAddress) {
              setState({
                isConnected: true,
                isConnecting: false,
                address: savedAddress,
                name: savedName || key.name,
                error: null,
              })
            } else {
              // Address changed, clear storage
              localStorage.removeItem('wallet_address')
              localStorage.removeItem('wallet_name')
            }
          })
          .catch(() => {
            // Connection no longer valid
            localStorage.removeItem('wallet_address')
            localStorage.removeItem('wallet_name')
          })
      }
    }
  }, [getKeplr])

  // Listen for account changes
  useEffect(() => {
    const handleAccountChange = () => {
      const keplr = getKeplr()
      if (keplr && state.isConnected) {
        keplr.getKey(AXIOME_CHAIN.chainId)
          .then((key) => {
            setState(prev => ({
              ...prev,
              address: key.bech32Address,
              name: key.name,
            }))
            localStorage.setItem('wallet_address', key.bech32Address)
            localStorage.setItem('wallet_name', key.name)
          })
          .catch(console.error)
      }
    }

    window.addEventListener('keplr_keystorechange', handleAccountChange)
    return () => window.removeEventListener('keplr_keystorechange', handleAccountChange)
  }, [getKeplr, state.isConnected])

  const connect = useCallback(async () => {
    const keplr = getKeplr()

    if (!keplr) {
      setState(prev => ({
        ...prev,
        error: 'Please install Keplr wallet extension',
      }))
      // Open Keplr installation page
      window.open('https://www.keplr.app/download', '_blank')
      return
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      // Try to enable the chain, suggest it if not already added
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

      // Save to localStorage
      localStorage.setItem('wallet_address', key.bech32Address)
      localStorage.setItem('wallet_name', key.name)

    } catch (error) {
      console.error('Failed to connect wallet:', error)
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      }))
    }
  }, [getKeplr])

  const disconnect = useCallback(() => {
    setState(initialState)
    localStorage.removeItem('wallet_address')
    localStorage.removeItem('wallet_name')
  }, [])

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect }}>
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
