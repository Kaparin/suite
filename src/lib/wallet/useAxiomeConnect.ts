'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'

export interface AxiomeConnectState {
  authToken: string | null
  walletAddress: string | null
  isConnecting: boolean
  isConnected: boolean
}

/** Returned from startConnect() with association info */
export interface ConnectResult {
  token: string
  walletAddress: string | null
}

const AUTH_TOKEN_KEY = 'axiome_connect_token'
const AUTH_TOKEN_TS_KEY = 'axiome_connect_token_ts'
const AUTH_WALLET_KEY = 'axiome_connect_wallet'

// Only unassociated tokens expire (5 min waiting for user to scan QR)
// Associated tokens persist until server rejects them or user disconnects
const UNASSOCIATED_TOKEN_MAX_AGE = 300_000

// Call Axiome API directly from browser so it sees real user IP/browser
const AXIOME_IDX_API = 'https://api-idx.axiomechain.pro'

/**
 * Axiome Connect — wallet connection & transaction signing
 *
 * Flow:
 * 1. createConnectToken() — GET /connect/create_token -> get token
 * 2. Show QR or open https://axiome.pro/app/connect?token=TOKEN
 * 3. User confirms in Axiome Wallet -> token gets associated with wallet address
 * 4. pollTokenInfo() — POST /connect/get_token_info -> check if account is set
 * 5. Once connected: use token for POST /connect/sign
 */
export function useAxiomeConnect() {
  const [state, setState] = useState<AxiomeConnectState>(() => {
    if (typeof window === 'undefined') {
      return { authToken: null, walletAddress: null, isConnecting: false, isConnected: false }
    }
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    const wallet = localStorage.getItem(AUTH_WALLET_KEY)

    // Previously associated token — no TTL, stays valid until server rejects
    if (token && wallet) {
      return {
        authToken: token,
        walletAddress: wallet,
        isConnecting: false,
        isConnected: true,
      }
    }

    // Unassociated token — apply TTL
    if (token) {
      const ts = Number(localStorage.getItem(AUTH_TOKEN_TS_KEY) || '0')
      const isValid = (Date.now() - ts) < UNASSOCIATED_TOKEN_MAX_AGE
      return {
        authToken: isValid ? token : null,
        walletAddress: null,
        isConnecting: false,
        isConnected: false,
      }
    }

    return { authToken: null, walletAddress: null, isConnecting: false, isConnected: false }
  })

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
  }, [])

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), [stopPolling])

  // Poll token info — call Axiome API directly so it sees user's real browser/IP
  const pollTokenInfo = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${AXIOME_IDX_API}/connect/get_token_info`, {
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

  // Poll for wallet association (every 8s for 5 minutes)
  const startAssociationPolling = useCallback((token: string) => {
    stopPolling()

    const poll = async () => {
      const info = await pollTokenInfo(token)
      if (info?.account) {
        stopPolling()
        localStorage.setItem(AUTH_WALLET_KEY, info.account)
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

  /**
   * Start connection flow.
   * Returns { token, walletAddress } or null.
   * walletAddress is non-null only if the token is associated with a wallet.
   */
  const startConnect = useCallback(async (): Promise<ConnectResult | null> => {
    setState(prev => ({ ...prev, isConnecting: true }))

    try {
      const existingToken = localStorage.getItem(AUTH_TOKEN_KEY)
      const storedWallet = localStorage.getItem(AUTH_WALLET_KEY)
      const ts = Number(localStorage.getItem(AUTH_TOKEN_TS_KEY) || '0')

      // Case 1: Previously associated token — verify with server
      if (existingToken && storedWallet) {
        const info = await pollTokenInfo(existingToken)
        if (info?.account) {
          localStorage.setItem(AUTH_WALLET_KEY, info.account)
          setState({
            authToken: existingToken,
            walletAddress: info.account,
            isConnecting: false,
            isConnected: true,
          })
          return { token: existingToken, walletAddress: info.account }
        }
        // Server rejected the token — clean up and create new
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_TOKEN_TS_KEY)
        localStorage.removeItem(AUTH_WALLET_KEY)
        // Fall through to create new token
      }

      // Case 2: Unassociated token within TTL
      if (existingToken && !storedWallet && (Date.now() - ts) < UNASSOCIATED_TOKEN_MAX_AGE) {
        const info = await pollTokenInfo(existingToken)
        if (info?.account) {
          localStorage.setItem(AUTH_WALLET_KEY, info.account)
          setState({
            authToken: existingToken,
            walletAddress: info.account,
            isConnecting: false,
            isConnected: true,
          })
          return { token: existingToken, walletAddress: info.account }
        }
        // Still not associated — continue polling
        setState(prev => ({ ...prev, authToken: existingToken }))
        startAssociationPolling(existingToken)
        return { token: existingToken, walletAddress: null }
      }

      // Case 3: No valid token — create new one
      const res = await fetch(`${AXIOME_IDX_API}/connect/create_token`)
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
      localStorage.removeItem(AUTH_WALLET_KEY)

      setState(prev => ({ ...prev, authToken: token }))

      // Start polling for association
      startAssociationPolling(token)

      return { token, walletAddress: null }
    } catch (err) {
      console.error('[AxiomeConnect] startConnect error:', err)
      setState(prev => ({ ...prev, isConnecting: false }))
      return null
    }
  }, [pollTokenInfo, startAssociationPolling])

  // Check current token status (for resume-on-visibility)
  const checkTokenStatus = useCallback(async (): Promise<boolean> => {
    const token = state.authToken || localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) return false

    const info = await pollTokenInfo(token)
    if (info?.account) {
      localStorage.setItem(AUTH_WALLET_KEY, info.account)
      setState({
        authToken: token,
        walletAddress: info.account,
        isConnecting: false,
        isConnected: true,
      })
      return true
    }
    return false
  }, [state.authToken, pollTokenInfo])

  /**
   * Create a fresh token (always new, ignores localStorage).
   * Used for signing sessions — each signing needs a fresh token because
   * Axiome invalidates tokens after first use in the wallet app.
   */
  const createFreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(`${AXIOME_IDX_API}/connect/create_token`)
      if (!res.ok) return null

      const data = await res.json()
      const token = data.token
      if (!token) return null

      // Register token with Axiome API
      await pollTokenInfo(token)

      // Store as current token
      localStorage.setItem(AUTH_TOKEN_KEY, token)
      localStorage.setItem(AUTH_TOKEN_TS_KEY, String(Date.now()))
      localStorage.removeItem(AUTH_WALLET_KEY)

      setState(prev => ({ ...prev, authToken: token, walletAddress: null, isConnected: false }))
      return token
    } catch (err) {
      console.error('[AxiomeConnect] createFreshToken error:', err)
      return null
    }
  }, [pollTokenInfo])

  /**
   * Wait for a token to become associated with a wallet.
   * Returns wallet address on success, null on timeout/abort.
   * Polls every 5s for up to 5 minutes.
   */
  const waitForAssociation = useCallback(async (token: string, signal?: AbortSignal): Promise<string | null> => {
    const POLL_INTERVAL = 5000
    const MAX_DURATION = 300_000
    let elapsed = 0

    while (elapsed < MAX_DURATION) {
      if (signal?.aborted) return null

      await new Promise(r => setTimeout(r, POLL_INTERVAL))
      elapsed += POLL_INTERVAL

      if (signal?.aborted) return null

      const info = await pollTokenInfo(token)
      if (info?.account) {
        localStorage.setItem(AUTH_WALLET_KEY, info.account)
        setState({
          authToken: token,
          walletAddress: info.account,
          isConnecting: false,
          isConnected: true,
        })
        return info.account
      }
    }

    return null
  }, [pollTokenInfo])

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

  // Get the QR code value for scanning (universal link)
  const getConnectQrValue = useCallback((token: string) => {
    return `https://axiome.pro/app/connect?token=${token}`
  }, [])

  // Disconnect
  const disconnect = useCallback(() => {
    stopPolling()
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_TOKEN_TS_KEY)
    localStorage.removeItem(AUTH_WALLET_KEY)
    setState({ authToken: null, walletAddress: null, isConnecting: false, isConnected: false })
  }, [stopPolling])

  // Memoize return value so consumers don't re-render on unrelated parent renders
  return useMemo(() => ({
    ...state,
    startConnect,
    createFreshToken,
    waitForAssociation,
    checkTokenStatus,
    submitSigningRequest,
    getConnectUrl,
    getConnectQrValue,
    disconnect,
    stopPolling,
  }), [state, startConnect, createFreshToken, waitForAssociation, checkTokenStatus, submitSigningRequest, getConnectUrl, getConnectQrValue, disconnect, stopPolling])
}
