'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface AxiomeConnectState {
  authToken: string | null
  walletAddress: string | null
  isConnecting: boolean
  isConnected: boolean
}

const AUTH_TOKEN_KEY = 'axiome_connect_token'
const AUTH_TOKEN_TS_KEY = 'axiome_connect_token_ts'
const TOKEN_MAX_AGE = 250_000 // ~4 minutes

/**
 * Axiome Connect — wallet connection & transaction signing
 *
 * Flow:
 * 1. createConnectToken() — GET /connect/create_token → get token
 * 2. Show QR ("axm:auth:token:TOKEN") or open https://axiome.pro/app/connect?token=TOKEN
 * 3. User confirms in Axiome Wallet → token gets associated with wallet address
 * 4. pollTokenInfo() — POST /connect/get_token_info → check if account is set
 * 5. Once connected: use token for POST /connect/sign
 */
export function useAxiomeConnect() {
  const [state, setState] = useState<AxiomeConnectState>(() => {
    if (typeof window === 'undefined') {
      return { authToken: null, walletAddress: null, isConnecting: false, isConnected: false }
    }
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    const ts = Number(localStorage.getItem(AUTH_TOKEN_TS_KEY) || '0')
    const isValid = token && (Date.now() - ts) < TOKEN_MAX_AGE
    return {
      authToken: isValid ? token : null,
      walletAddress: null,
      isConnecting: false,
      isConnected: false,
    }
  })

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
  }, [])

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), [stopPolling])

  // Poll token info to check if wallet has claimed it
  const pollTokenInfo = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/connect/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (!res.ok) return null
      const data = await res.json()
      return data
    } catch {
      return null
    }
  }, [])

  // Start the connection flow
  const startConnect = useCallback(async (): Promise<string | null> => {
    setState(prev => ({ ...prev, isConnecting: true }))

    try {
      // Check if we have a valid existing token
      const existingToken = localStorage.getItem(AUTH_TOKEN_KEY)
      const ts = Number(localStorage.getItem(AUTH_TOKEN_TS_KEY) || '0')

      if (existingToken && (Date.now() - ts) < TOKEN_MAX_AGE) {
        // Check if it's already associated
        const info = await pollTokenInfo(existingToken)
        if (info?.account) {
          setState({
            authToken: existingToken,
            walletAddress: info.account,
            isConnecting: false,
            isConnected: true,
          })
          return existingToken
        }
        // Token exists but not yet associated — use it
        setState(prev => ({ ...prev, authToken: existingToken }))
        return existingToken
      }

      // Get new token
      const res = await fetch('/api/connect/auth')
      if (!res.ok) {
        setState(prev => ({ ...prev, isConnecting: false }))
        return null
      }

      const data = await res.json()
      const token = data.token
      if (!token) {
        setState(prev => ({ ...prev, isConnecting: false }))
        return null
      }

      // Register token
      await pollTokenInfo(token)

      // Store token
      localStorage.setItem(AUTH_TOKEN_KEY, token)
      localStorage.setItem(AUTH_TOKEN_TS_KEY, String(Date.now()))

      setState(prev => ({ ...prev, authToken: token }))

      // Start polling for association
      startAssociationPolling(token)

      return token
    } catch (err) {
      console.error('[AxiomeConnect] startConnect error:', err)
      setState(prev => ({ ...prev, isConnecting: false }))
      return null
    }
  }, [pollTokenInfo]) // eslint-disable-line react-hooks/exhaustive-deps

  // Poll for wallet association (every 8s for 5 minutes)
  const startAssociationPolling = useCallback((token: string) => {
    stopPolling()

    const poll = async () => {
      const info = await pollTokenInfo(token)
      if (info?.account) {
        stopPolling()
        setState({
          authToken: token,
          walletAddress: info.account,
          isConnecting: false,
          isConnected: true,
        })
        return
      }
      // Schedule next poll
      pollRef.current = setTimeout(poll, 8000)
    }

    // Start first poll
    pollRef.current = setTimeout(poll, 8000)

    // Timeout after 5 minutes
    timeoutRef.current = setTimeout(() => {
      stopPolling()
      setState(prev => ({ ...prev, isConnecting: false }))
    }, 300_000)
  }, [stopPolling, pollTokenInfo])

  // Submit a signing request (requires connected auth token)
  const submitSigningRequest = useCallback(async (axiomeSignPayload: string, token: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/connect/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: axiomeSignPayload, authToken: token }),
      })

      if (!res.ok) {
        const errorBody = await res.text()
        console.error('[AxiomeConnect] Sign request failed:', res.status, errorBody)
        return null
      }

      const data = await res.json()
      if (typeof data === 'string') return data
      if (data?.id) return data.id
      if (data?._id) return data._id
      return null
    } catch (err) {
      console.error('[AxiomeConnect] submitSigningRequest error:', err)
      return null
    }
  }, [])

  // Get the connect URL for opening the wallet app
  const getConnectUrl = useCallback((token: string) => {
    return `https://axiome.pro/app/connect?token=${token}`
  }, [])

  // Get the QR code value for scanning
  const getConnectQrValue = useCallback((token: string) => {
    return `axm:auth:token:${token}`
  }, [])

  // Disconnect
  const disconnect = useCallback(() => {
    stopPolling()
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_TOKEN_TS_KEY)
    setState({ authToken: null, walletAddress: null, isConnecting: false, isConnected: false })
  }, [stopPolling])

  return {
    ...state,
    startConnect,
    submitSigningRequest,
    getConnectUrl,
    getConnectQrValue,
    disconnect,
    stopPolling,
  }
}
