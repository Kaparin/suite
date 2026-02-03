'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui'
import { useWallet, truncateAddress, isMobileDevice } from '@/lib/wallet'

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
}

export function WalletBindModal({ isOpen, onClose, onSuccess }: WalletBindModalProps) {
  const { isConnected, address, connect, isConnecting } = useWallet()
  const [step, setStep] = useState<'connect' | 'verify'>('connect')
  const [challenge, setChallenge] = useState<VerificationChallenge | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)

  // Move to verify step when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      setStep('verify')
    } else {
      setStep('connect')
    }
  }, [isConnected, address])

  // Request verification challenge
  useEffect(() => {
    if (step === 'verify' && address && !challenge && !isLoading) {
      requestChallenge()
    }
  }, [step, address])

  // Timer
  useEffect(() => {
    if (challenge) {
      const updateTimer = () => {
        const remaining = Math.max(0, challenge.expiresAt - Date.now())
        setTimeLeft(Math.floor(remaining / 1000))
        if (remaining <= 0) {
          setIsPolling(false)
          setChallenge(null)
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

    if (isPolling && address) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/auth/wallet/verify?walletAddress=${address}`)
          const data = await res.json()

          if (data.verified) {
            setIsPolling(false)
            onSuccess(address)
            onClose()
          }
        } catch (err) {
          console.error('Polling error:', err)
        }
      }, 3000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPolling, address, onSuccess, onClose])

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      setIsPolling(false)
      setChallenge(null)
      setError(null)
    }
  }, [isOpen])

  const requestChallenge = async () => {
    if (!address) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/wallet/bind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get verification challenge')
      }

      setChallenge(data)
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
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
            <div className="space-y-6">
              {/* Wallet connected */}
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <div>
                    <p className="text-green-300 font-medium">Wallet Connected</p>
                    <p className="text-sm text-gray-400 font-mono">{truncateAddress(address || '')}</p>
                  </div>
                </div>
              </div>

              {/* Loading challenge */}
              {isLoading && (
                <div className="text-center py-4">
                  <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-400">Generating verification code...</p>
                </div>
              )}

              {/* Challenge ready */}
              {challenge && (
                <>
                  {/* Polling status */}
                  {isPolling && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        <div>
                          <p className="text-blue-300 font-medium">Waiting for transaction...</p>
                          <p className="text-sm text-gray-400">Confirm in Axiome Wallet</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  <div className="text-center">
                    <p className="text-gray-300">
                      Send <span className="text-purple-400 font-semibold">{challenge.amount} AXM</span> to verify your wallet
                    </p>
                  </div>

                  {/* Verification Address */}
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">SEND TO ADDRESS</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(challenge.verificationAddress)}
                        className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </button>
                    </div>
                    <p className="text-sm font-mono text-green-400 break-all select-all">
                      {challenge.verificationAddress}
                    </p>
                  </div>

                  {/* Memo Code */}
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">MEMO (REQUIRED)</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(challenge.code)}
                        className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </button>
                    </div>
                    <p className="text-sm font-mono text-white break-all select-all">
                      {challenge.code}
                    </p>
                  </div>

                  {/* Amount reminder */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-amber-300">
                        Amount: <span className="font-mono font-bold">{challenge.amount} AXM</span> - Don&apos;t forget the memo!
                      </span>
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="text-center">
                    <p className="text-sm text-gray-400">
                      Expires in:{' '}
                      <span className={`font-mono ${timeLeft < 60 ? 'text-red-400' : 'text-white'}`}>
                        {formatTime(timeLeft)}
                      </span>
                    </p>
                  </div>

                  {/* Action button */}
                  <Button
                    onClick={handleOpenWallet}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                    size="lg"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open Axiome Wallet
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Info */}
          <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-gray-400">
                <p className="text-blue-300 font-medium mb-1">Why verify?</p>
                <p>
                  Verifying your wallet proves ownership and allows you to create tokens on the platform.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
