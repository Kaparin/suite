'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui'
import { useWallet, truncateAddress, isMobileDevice } from '@/lib/wallet'
import { useAuth } from '@/lib/auth/useAuth'

interface WalletBindModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (walletAddress: string) => void
}

interface VerificationChallenge {
  code: string
  expiresAt: number
  verificationAddress: string
  amount: string
  deepLink: string
  challengeToken: string
}

type CopyState = 'idle' | 'copied'

export function WalletBindModal({ isOpen, onClose, onSuccess }: WalletBindModalProps) {
  const { isConnected, address, connect, isConnecting } = useWallet()
  const { getToken, updateUser } = useAuth()
  const [step, setStep] = useState<'connect' | 'verify' | 'success'>('connect')
  const [challenge, setChallenge] = useState<VerificationChallenge | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [copyAddressState, setCopyAddressState] = useState<CopyState>('idle')
  const [copyMemoState, setCopyMemoState] = useState<CopyState>('idle')

  // Move to verify step when wallet is connected
  useEffect(() => {
    if (isConnected && address && step !== 'success') {
      setStep('verify')
    } else if (!isConnected && !address) {
      setStep('connect')
    }
  }, [isConnected, address, step])

  // Request verification challenge
  useEffect(() => {
    if (step === 'verify' && address && !challenge && !isLoading) {
      requestChallenge()
    }
  }, [step, address, challenge, isLoading])

  // Timer
  useEffect(() => {
    if (challenge) {
      const updateTimer = () => {
        const remaining = Math.max(0, challenge.expiresAt - Date.now())
        setTimeLeft(Math.floor(remaining / 1000))
        if (remaining <= 0) {
          setIsPolling(false)
          setChallenge(null)
          setError('Verification code expired. Please try again.')
        }
      }

      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    }
  }, [challenge])

  // Polling for verification
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isPolling && address && challenge?.challengeToken) {
      const checkVerification = async () => {
        try {
          const token = getToken()
          const headers: HeadersInit = {
            'Cache-Control': 'no-cache'
          }
          if (token) {
            headers['Authorization'] = `Bearer ${token}`
          }

          const params = new URLSearchParams({
            walletAddress: address,
            challengeToken: challenge.challengeToken
          })

          const res = await fetch(`/api/auth/wallet/verify?${params.toString()}`, {
            headers,
            cache: 'no-store'
          })
          const data = await res.json()

          console.log('[WalletBind] Verification check:', data)

          if (data.verified) {
            setIsPolling(false)

            // If new token provided, update it
            if (data.token) {
              localStorage.setItem('axiome_auth_token', data.token)
            }

            // Update user state if user data returned
            if (data.user) {
              updateUser({
                walletAddress: data.user.walletAddress,
                isVerified: data.user.isVerified
              })
            } else if (data.walletAddress) {
              updateUser({
                walletAddress: data.walletAddress,
                isVerified: true
              })
            }

            // Show success state briefly
            setStep('success')

            // Call success callback and close after delay
            setTimeout(() => {
              onSuccess(data.walletAddress || address)
              onClose()
            }, 1500)
          }
        } catch (err) {
          console.error('[WalletBind] Polling error:', err)
        }
      }

      // Check immediately
      checkVerification()

      // Then every 3 seconds
      interval = setInterval(checkVerification, 3000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPolling, address, challenge?.challengeToken, onSuccess, onClose, getToken, updateUser])

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      setIsPolling(false)
      setChallenge(null)
      setError(null)
      setStep('connect')
      setCopyAddressState('idle')
      setCopyMemoState('idle')
    }
  }, [isOpen])

  const requestChallenge = async () => {
    if (!address) return

    setIsLoading(true)
    setError(null)

    try {
      const token = getToken()
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const res = await fetch('/api/auth/wallet/bind', {
        method: 'POST',
        headers,
        body: JSON.stringify({ walletAddress: address })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get verification challenge')
      }

      setChallenge(data)
      console.log('[WalletBind] Challenge received:', data.code)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start verification')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenWallet = () => {
    if (!challenge) return

    setIsPolling(true)

    if (isMobileDevice()) {
      window.location.href = challenge.deepLink
    } else {
      window.open(challenge.deepLink, '_blank')
    }
  }

  const handleCopyAddress = useCallback(async () => {
    if (!challenge) return
    try {
      await navigator.clipboard.writeText(challenge.verificationAddress)
      setCopyAddressState('copied')
      setTimeout(() => setCopyAddressState('idle'), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }, [challenge])

  const handleCopyMemo = useCallback(async () => {
    if (!challenge) return
    try {
      await navigator.clipboard.writeText(challenge.code)
      setCopyMemoState('copied')
      setTimeout(() => setCopyMemoState('idle'), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }, [challenge])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleRetry = () => {
    setChallenge(null)
    setError(null)
    requestChallenge()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Success State */}
          {step === 'success' && (
            <div className="text-center py-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 bg-green-500/20 rounded-full mx-auto mb-6 flex items-center justify-center"
              >
                <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-2">Wallet Verified!</h3>
              <p className="text-gray-400">Your wallet has been successfully linked</p>
            </div>
          )}

          {step !== 'success' && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Verify Wallet</h3>
                    <p className="text-sm text-gray-400">Link your Axiome wallet</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-red-400 text-sm">{error}</span>
                    <button
                      onClick={handleRetry}
                      className="text-xs text-red-300 hover:text-red-200 underline ml-2"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {/* Step 1: Connect wallet */}
              {step === 'connect' && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gray-800 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">Connect your wallet</h4>
                  <p className="text-gray-400 mb-6">
                    First, connect your Axiome Wallet to verify ownership.
                  </p>
                  <Button
                    onClick={connect}
                    disabled={isConnecting}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                    size="lg"
                  >
                    {isConnecting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Connecting...
                      </>
                    ) : (
                      'Connect Axiome Wallet'
                    )}
                  </Button>
                </div>
              )}

              {/* Step 2: Verify */}
              {step === 'verify' && (
                <div className="space-y-4">
                  {/* Wallet connected */}
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <div className="flex-1 min-w-0">
                        <p className="text-green-300 font-medium text-sm">Wallet Connected</p>
                        <p className="text-xs text-gray-400 font-mono truncate">{truncateAddress(address || '')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Loading challenge */}
                  {isLoading && (
                    <div className="text-center py-4">
                      <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">Generating verification code...</p>
                    </div>
                  )}

                  {/* Challenge ready */}
                  {challenge && (
                    <>
                      {/* Polling status */}
                      {isPolling && (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin flex-shrink-0" />
                            <div>
                              <p className="text-blue-300 font-medium text-sm">Waiting for transaction...</p>
                              <p className="text-xs text-gray-400">Confirm in Axiome Wallet</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Instructions */}
                      <div className="text-center py-2">
                        <p className="text-gray-300 text-sm">
                          Send <span className="text-purple-400 font-semibold">{challenge.amount} AXM</span> to verify
                        </p>
                      </div>

                      {/* Verification Address */}
                      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500 uppercase">Send to Address</span>
                          <button
                            onClick={handleCopyAddress}
                            className={`text-xs flex items-center gap-1 transition-colors ${
                              copyAddressState === 'copied'
                                ? 'text-green-400'
                                : 'text-purple-400 hover:text-purple-300'
                            }`}
                          >
                            {copyAddressState === 'copied' ? (
                              <>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Copied!
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs font-mono text-green-400 break-all select-all leading-relaxed">
                          {challenge.verificationAddress}
                        </p>
                      </div>

                      {/* Memo Code */}
                      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500 uppercase">Memo (Required)</span>
                          <button
                            onClick={handleCopyMemo}
                            className={`text-xs flex items-center gap-1 transition-colors ${
                              copyMemoState === 'copied'
                                ? 'text-green-400'
                                : 'text-purple-400 hover:text-purple-300'
                            }`}
                          >
                            {copyMemoState === 'copied' ? (
                              <>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Copied!
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-sm font-mono text-white break-all select-all">
                          {challenge.code}
                        </p>
                      </div>

                      {/* Amount reminder */}
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2">
                        <div className="flex items-center gap-2 text-xs">
                          <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-amber-300">
                            Amount: <span className="font-mono font-bold">{challenge.amount} AXM</span> - Include the memo!
                          </span>
                        </div>
                      </div>

                      {/* Timer */}
                      <div className="text-center">
                        <p className="text-xs text-gray-400">
                          Expires in:{' '}
                          <span className={`font-mono ${timeLeft < 60 ? 'text-red-400' : 'text-white'}`}>
                            {formatTime(timeLeft)}
                          </span>
                        </p>
                      </div>

                      {/* Action button */}
                      <Button
                        onClick={handleOpenWallet}
                        disabled={isPolling}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                        size="lg"
                      >
                        {isPolling ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Waiting for confirmation...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Open Axiome Wallet
                          </>
                        )}
                      </Button>

                      {/* Manual verification option */}
                      {!isPolling && (
                        <button
                          onClick={() => setIsPolling(true)}
                          className="w-full text-sm text-gray-400 hover:text-gray-300 py-2 transition-colors"
                        >
                          Already sent? Click to check status
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Info */}
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs text-gray-400">
                    <p className="text-blue-300 font-medium mb-1">Why verify?</p>
                    <p>
                      Verifying your wallet proves ownership and allows you to create tokens on the platform.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
