'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import {
  isMobileDevice,
  openAxiomeConnect,
  AXIOME_WALLET_IOS,
  AXIOME_WALLET_ANDROID,
  pollSigningStatus,
  cancelSigningRequest,
  extractTxHash,
  type SigningStatus,
} from '@/lib/wallet/axiome-connect'

type FlowStep = 'preview' | 'signing' | 'checking' | 'success' | 'error'

interface SignTransactionFlowProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (txHash: string) => void
  deepLink: string
  transactionId?: string | null
  title: string
  description: string
  checkTransaction?: () => Promise<{ success: boolean; txHash?: string; error?: string }>
}


export function SignTransactionFlow({
  isOpen,
  onClose,
  onSuccess,
  deepLink,
  transactionId,
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
  const transactionIdRef = useRef<string | null>(null)

  const isMobile = isMobileDevice()

  // Keep ref in sync
  useEffect(() => {
    transactionIdRef.current = transactionId ?? null
  }, [transactionId])

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

  // Poll Axiome Connect API for status when in signing step
  useEffect(() => {
    if (step !== 'signing') {
      stopPolling()
      return
    }

    // Start polling after 3s delay
    const startDelay = setTimeout(() => {
      pollRef.current = setInterval(async () => {
        const txId = transactionIdRef.current

        // Poll Axiome Connect API if we have a transaction ID
        if (txId) {
          try {
            const result = await pollSigningStatus(txId)
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
            // Ignore poll errors, continue polling
          }
        }

        // Also try the legacy checkTransaction callback (blockchain polling)
        if (checkTransaction) {
          try {
            const result = await checkTransaction()
            if (result.success) {
              stopPolling()
              setTxHash(result.txHash || null)
              setStep('success')
              if (result.txHash && onSuccess) onSuccess(result.txHash)
              return
            }
          } catch {
            // Ignore
          }
        }
      }, 10_000) // Poll every 10 seconds (matching official app)

      // Timeout after 5 minutes
      timeoutRef.current = setTimeout(() => {
        stopPolling()
        setApiStatus('pulling_timeout')
      }, 300_000)
    }, 3000)

    return () => {
      clearTimeout(startDelay)
      stopPolling()
    }
  }, [step, checkTransaction, onSuccess, stopPolling])

  const handleOpenWallet = () => {
    setStep('signing')
    if (isMobile) {
      openAxiomeConnect(deepLink)
    }
  }

  const handleCheckTransaction = useCallback(async () => {
    setIsChecking(true)

    // First try API check
    const txId = transactionIdRef.current
    if (txId) {
      try {
        const result = await pollSigningStatus(txId)
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
        // Fall through to legacy check
      }
    }

    // Legacy blockchain check
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
    // Cancel signing request if still pending
    const txId = transactionIdRef.current
    if (txId && (apiStatus === 'new' || apiStatus === null)) {
      cancelSigningRequest(txId).catch(() => {})
    }
    stopPolling()
    onClose()
  }

  if (!isOpen) return null

  // Status label for API polling
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
                className="space-y-6"
              >
                <p className="text-gray-400 text-center">{description}</p>

                <button
                  onClick={handleOpenWallet}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium rounded-xl transition-all"
                >
                  Continue to Sign
                </button>
              </motion.div>
            )}

            {/* Step: Signing */}
            {step === 'signing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Transaction Code — show the short ID from API */}
                {transactionId && (
                  <CopyCodeBlock code={transactionId} label="Transaction code" />
                )}

                {/* QR code — shown on ALL devices */}
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-xl">
                    <QRCodeSVG value={deepLink} size={isMobile ? 200 : 280} level="L" />
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-white font-medium">
                    {transactionId ? 'Enter code or scan QR' : 'Scan with Axiome Wallet'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {transactionId
                      ? 'Open Axiome Wallet → Axiome Connect → Enter the code above or scan QR'
                      : 'Open Axiome Wallet app and scan this QR code'}
                  </p>
                </div>

                {/* Auto-detection indicator */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    apiStatus === 'broadcast' ? 'bg-yellow-500' : 'bg-purple-500'
                  }`} />
                  {getStatusLabel()}
                </div>

                {/* Mobile: try deep link + install wallet links */}
                {isMobile && (
                  <div className="space-y-2">
                    <a
                      href={deepLink}
                      className="block w-full py-2.5 text-center bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors text-sm"
                    >
                      Open Axiome Wallet
                    </a>
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
                  </div>
                )}

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
                    "Check manually"
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
