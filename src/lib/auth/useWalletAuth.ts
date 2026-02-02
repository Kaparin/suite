'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const AUTH_TOKEN_KEY = 'axiome_auth_token'
const AUTH_WALLET_KEY = 'axiome_auth_wallet'

interface VerificationChallenge {
  code: string
  expiresAt: number
  verificationAddress: string
  amount: string
  displayAmount: string
  deepLink: string
}

interface UseWalletAuthReturn {
  // Auth state
  isVerified: boolean
  verifiedWallet: string | null
  authToken: string | null

  // Verification flow
  verificationChallenge: VerificationChallenge | null
  isRequestingChallenge: boolean
  isPolling: boolean
  error: string | null

  // Actions
  requestVerification: (walletAddress: string) => Promise<VerificationChallenge | null>
  startPolling: (walletAddress: string) => void
  stopPolling: () => void
  logout: () => void
  checkSession: () => Promise<boolean>
}

export function useWalletAuth(): UseWalletAuthReturn {
  const [isVerified, setIsVerified] = useState(false)
  const [verifiedWallet, setVerifiedWallet] = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [verificationChallenge, setVerificationChallenge] = useState<VerificationChallenge | null>(null)
  const [isRequestingChallenge, setIsRequestingChallenge] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingAddressRef = useRef<string | null>(null)

  // Load saved auth on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    const savedWallet = localStorage.getItem(AUTH_WALLET_KEY)

    if (savedToken && savedWallet) {
      setAuthToken(savedToken)
      setVerifiedWallet(savedWallet)
      setIsVerified(true)
    }
  }, [])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  // Check if current session is still valid
  const checkSession = useCallback(async (): Promise<boolean> => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)

    if (!token) {
      setIsVerified(false)
      return false
    }

    try {
      const response = await fetch('/api/auth/session', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.verified) {
        setIsVerified(true)
        setVerifiedWallet(data.walletAddress)
        setAuthToken(token)
        return true
      } else {
        // Session expired, clear local storage
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_WALLET_KEY)
        setIsVerified(false)
        setVerifiedWallet(null)
        setAuthToken(null)
        return false
      }
    } catch {
      return false
    }
  }, [])

  // Request verification challenge
  const requestVerification = useCallback(async (walletAddress: string): Promise<VerificationChallenge | null> => {
    setIsRequestingChallenge(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request verification')
      }

      const challenge: VerificationChallenge = {
        code: data.code,
        expiresAt: data.expiresAt,
        verificationAddress: data.verificationAddress,
        amount: data.amount,
        displayAmount: data.displayAmount,
        deepLink: data.deepLink
      }

      setVerificationChallenge(challenge)
      return challenge
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification request failed'
      setError(message)
      return null
    } finally {
      setIsRequestingChallenge(false)
    }
  }, [])

  // Poll for verification status
  const pollVerificationStatus = useCallback(async (walletAddress: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/auth/verify/check?address=${encodeURIComponent(walletAddress)}`)
      const data = await response.json()

      if (data.verified && data.token) {
        // Success! Save to local storage
        localStorage.setItem(AUTH_TOKEN_KEY, data.token)
        localStorage.setItem(AUTH_WALLET_KEY, walletAddress.toLowerCase())

        // Update state
        setAuthToken(data.token)
        setVerifiedWallet(walletAddress.toLowerCase())
        setIsVerified(true)
        setVerificationChallenge(null)
        setIsPolling(false)

        return true
      }

      if (!data.pending) {
        // Verification expired or failed
        setError(data.error || 'Verification expired')
        setIsPolling(false)
        return false
      }

      // Still pending, continue polling
      return false
    } catch {
      // Network error, continue polling
      return false
    }
  }, [])

  // Start polling for verification
  const startPolling = useCallback((walletAddress: string) => {
    // Stop any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    setIsPolling(true)
    setError(null)
    pollingAddressRef.current = walletAddress

    // Initial check
    pollVerificationStatus(walletAddress)

    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(async () => {
      if (pollingAddressRef.current) {
        const success = await pollVerificationStatus(pollingAddressRef.current)
        if (success) {
          // Stop polling on success
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
        }
      }
    }, 3000)

    // Auto-stop after 15 minutes (verification expiry)
    setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
        setIsPolling(false)
      }
    }, 15 * 60 * 1000)
  }, [pollVerificationStatus])

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    pollingAddressRef.current = null
    setIsPolling(false)
  }, [])

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_WALLET_KEY)
    setAuthToken(null)
    setVerifiedWallet(null)
    setIsVerified(false)
    setVerificationChallenge(null)
    setError(null)
    stopPolling()
  }, [stopPolling])

  return {
    isVerified,
    verifiedWallet,
    authToken,
    verificationChallenge,
    isRequestingChallenge,
    isPolling,
    error,
    requestVerification,
    startPolling,
    stopPolling,
    logout,
    checkSession
  }
}

/**
 * Get auth token for API requests
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

/**
 * Get auth headers for fetch requests
 */
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken()
  if (!token) return {}
  return {
    Authorization: `Bearer ${token}`
  }
}
