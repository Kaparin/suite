'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { WalletState } from './types'
import { isValidAxiomeAddress } from './axiome-connect'

const initialState: WalletState = {
  isConnected: false,
  isConnecting: false,
  address: null,
  name: null,
  error: null,
}

interface WalletContextType extends WalletState {
  connect: () => void
  disconnect: () => void
  showConnectionModal: boolean
  setShowConnectionModal: (show: boolean) => void
  connectWithAddress: (address: string) => void
}

const WalletContext = createContext<WalletContextType | null>(null)

const STORAGE_KEY = 'axiome_wallet'

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(initialState)
  const [showConnectionModal, setShowConnectionModal] = useState(false)

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
