'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import {
  isMobileDevice,
  AXIOME_WALLET_IOS,
  AXIOME_WALLET_ANDROID,
  pollSigningStatus,
  extractTxHash,
  type SigningStatus,
} from '@/lib/wallet/axiome-connect'

type FlowStep = 'preview' | 'signing' | 'checking' | 'success' | 'error'

interface SignTransactionFlowProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (txHash: string) => void
  deepLink: string
  signingCode?: string | null
  connectToken?: string | null
  title: string
  description: string
  checkTransaction?: () => Promise<{ success: boolean; txHash?: string; error?: string }>
}


export function SignTransactionFlow({
  isOpen,
  onClose,
  onSuccess,
  deepLink,
  signingCode,
  connectToken,
  title,
  description,
  checkTransaction,
}: SignTransactionFlowProps) {
  const [step, setStep] = useState<FlowStep>('preview')
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<SigningStatus | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const signingCodeRef = useRef<string | null>(null)

  const isMobile = isMobileDevice()

  // Keep ref in sync
  useEffect(() => {
    signingCodeRef.current = signingCode ?? null
  }, [signingCode])

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('preview')
      setError(null)
      setTxHash(null)
      setApiStatus(null)
      stopPolling()
    }
    return () => stopPolling()
  }, [isOpen, stopPolling])

  // Poll for transaction status when in signing step
  useEffect(() => {
    if (step !== 'signing') {
      stopPolling()
      return
    }

    const startDelay = setTimeout(() => {
      pollRef.current = setInterval(async () => {
        const code = signingCodeRef.current

        // Poll Axiome Connect API if we have a signing code
        if (code) {
          try {
            const result = await pollSigningStatus(code)
            setApiStatus(result.status)

            if (result.status === 'result') {
              stopPolling()
              const hash = extractTxHash(result.payload)
              setTxHash(hash)
              setStep('success')
              if (hash && onSuccess) onSuccess(hash)
              return
            }
            if (result.status === 'cancel') {
              stopPolling()
              setError('Transaction cancelled by user')
              setStep('error')
              return
            }
            if (result.status === 'error') {
              stopPolling()
              setError('Transaction failed')
              setStep('error')
              return
            }
          } catch {
            // Ignore poll errors
          }
        }

        // Also try blockchain polling
        if (checkTransaction) {
          try {
            const result = await checkTransaction()
            if (result.success) {
              stopPolling()
              setTxHash(result.txHash || null)
              setStep('success')
              if (result.txHash && onSuccess) onSuccess(result.txHash)
            }
          } catch {
            // Ignore
          }
        }
      }, 10_000)

      timeoutRef.current = setTimeout(() => {
        stopPolling()
        setApiStatus('pulling_timeout')
      }, 300_000)
    }, 5000)

    return () => {
      clearTimeout(startDelay)
      stopPolling()
    }
  }, [step, checkTransaction, onSuccess, stopPolling])

  // Open the wallet app
  const openWalletApp = useCallback(() => {
    if (connectToken) {
      // Use the official Axiome Connect URL (App Link / Universal Link)
      const connectUrl = `https://axiome.pro/app/connect?token=${connectToken}`
      window.location.href = connectUrl
    } else {
      // Fallback: try deep link directly
      const isAndroid = /Android/i.test(navigator.userAgent)
      if (isAndroid) {
        const base64Part = deepLink.replace('axiomesign://', '')
        const intentUrl = `intent://${base64Part}#Intent;scheme=axiomesign;package=club.relounge.axiomewallet;end`
        const a = document.createElement('a')
        a.href = intentUrl
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        setTimeout(() => document.body.removeChild(a), 100)
      } else {
        window.location.href = deepLink
      }
    }
  }, [connectToken, deepLink])

  const handleOpenWallet = () => {
    setStep('signing')
    openWalletApp()
  }

  const handleCheckTransaction = useCallback(async () => {
    setIsChecking(true)

    // First try API check
    const code = signingCodeRef.current
    if (code) {
      try {
        const result = await pollSigningStatus(code)
        if (result.status === 'result') {
          const hash = extractTxHash(result.payload)
          setTxHash(hash)
          setStep('success')
          stopPolling()
          if (hash && onSuccess) onSuccess(hash)
          setIsChecking(false)
          return
        }
      } catch {
        // Fall through
      }
    }

    // Blockchain check
    if (checkTransaction) {
      try {
        const result = await checkTransaction()
        if (result.success) {
          setTxHash(result.txHash || null)
          setStep('success')
          stopPolling()
          if (result.txHash && onSuccess) onSuccess(result.txHash)
        } else {
          setError(result.error || 'Transaction not found yet. Please wait or try again.')
          setStep('error')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check transaction')
        setStep('error')
      }
    } else {
      setStep('success')
    }

    setIsChecking(false)
  }, [checkTransaction, onSuccess, stopPolling])

  const handleRetry = () => {
    setStep('signing')
    setError(null)
    setApiStatus(null)
  }

  const handleClose = () => {
    stopPolling()
    onClose()
  }

  if (!isOpen) return null

  const getStatusLabel = () => {
    switch (apiStatus) {
      case 'new': return 'Waiting for wallet...'
      case 'broadcast': return 'Broadcasting transaction...'
      case 'pulling_timeout': return 'Timeout — please check manually'
      default: return 'Waiting for confirmation...'
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step: Preview */}
            {step === 'preview' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <p className="text-gray-400 text-center">{description}</p>

                {/* Signing code (if available) */}
                {signingCode ? (
                  <CopyCodeBlock code={signingCode} label="Transaction code" />
                ) : (
                  <div className="space-y-2">
                    <span className="text-xs text-gray-400 font-medium">Transaction code</span>
                    <div className="p-3 bg-gray-800/80 rounded-xl border border-gray-700 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                        <span className="text-sm text-gray-400">Getting code...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* QR code */}
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-xl">
                    <QRCodeSVG value={deepLink} size={isMobile ? 180 : 240} level="L" />
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-white font-medium">
                    {signingCode ? 'Enter code or scan QR' : 'Scan QR with Axiome Wallet'}
                  </p>
                  <p className="text-sm text-gray-400">
                    Open Axiome Wallet → Axiome Connect → Enter code or scan QR
                  </p>
                </div>

                <button
                  onClick={handleOpenWallet}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium rounded-xl transition-all"
                >
                  Open Axiome Wallet
                </button>

                <div className="flex gap-2">
                  <a
                    href={AXIOME_WALLET_IOS}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 text-center bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-xl transition-colors"
                  >
                    App Store
                  </a>
                  <a
                    href={AXIOME_WALLET_ANDROID}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 text-center bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-xl transition-colors"
                  >
                    Google Play
                  </a>
                </div>
              </motion.div>
            )}

            {/* Step: Signing (waiting for user to sign in wallet) */}
            {step === 'signing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Signing code */}
                {signingCode && (
                  <CopyCodeBlock code={signingCode} label="Transaction code" />
                )}

                {/* QR code */}
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-xl">
                    <QRCodeSVG value={deepLink} size={isMobile ? 180 : 240} level="L" />
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-white font-medium">Sign the transaction in Axiome Wallet</p>
                  <p className="text-sm text-gray-400">
                    Review and confirm the transaction in your wallet app
                  </p>
                </div>

                {/* Status indicator */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    apiStatus === 'broadcast' ? 'bg-yellow-500' : 'bg-purple-500'
                  }`} />
                  {getStatusLabel()}
                </div>

                {/* Action buttons */}
                <div className="space-y-2">
                  <button
                    onClick={openWalletApp}
                    className="w-full py-2.5 text-center bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors text-sm"
                  >
                    Open Axiome Wallet
                  </button>
                </div>

                {/* Manual check button */}
                <button
                  onClick={handleCheckTransaction}
                  disabled={isChecking}
                  className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isChecking ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "I've signed — check transaction"
                  )}
                </button>
              </motion.div>
            )}

            {/* Step: Checking */}
            {step === 'checking' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 text-center space-y-4"
              >
                <div className="w-16 h-16 mx-auto border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <p className="text-white font-medium">Checking transaction...</p>
                <p className="text-sm text-gray-400">This may take a few moments</p>
              </motion.div>
            )}

            {/* Step: Success */}
            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center space-y-4"
              >
                <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-xl font-medium text-white">Transaction Successful!</p>
                {txHash && (
                  <a
                    href={`https://axiomechain.pro/transactions/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-400 hover:text-purple-300 font-mono break-all transition-colors"
                  >
                    TX: {txHash.slice(0, 16)}...{txHash.slice(-8)}
                  </a>
                )}
                <button
                  onClick={handleClose}
                  className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-colors"
                >
                  Done
                </button>
              </motion.div>
            )}

            {/* Step: Error */}
            {step === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center space-y-4"
              >
                <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-xl font-medium text-white">Transaction Failed</p>
                <p className="text-sm text-red-400">{error}</p>
                <div className="flex gap-3 justify-center mt-4">
                  <button
                    onClick={handleRetry}
                    className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 border border-gray-700 hover:border-gray-600 text-gray-300 font-medium rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

/** Copyable code block */
function CopyCodeBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = code
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div
        onClick={handleCopy}
        className="p-3 bg-gray-800/80 rounded-xl border border-gray-700 cursor-pointer hover:border-purple-500/40 transition-colors text-center"
      >
        <p className="text-lg text-white font-mono tracking-wider select-all">
          {code}
        </p>
      </div>
      <p className="text-[11px] text-gray-500 text-center">
        Open Axiome Wallet → Axiome Connect → Enter this code
      </p>
    </div>
  )
}
