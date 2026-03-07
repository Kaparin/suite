'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { isMobileDevice, openAxiomeConnect, AXIOME_WALLET_IOS, AXIOME_WALLET_ANDROID } from '@/lib/wallet/axiome-connect'

type FlowStep = 'preview' | 'signing' | 'checking' | 'success' | 'error'

interface SignTransactionFlowProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (txHash: string) => void
  deepLink: string
  title: string
  description: string
  checkTransaction?: () => Promise<{ success: boolean; txHash?: string; error?: string }>
}


export function SignTransactionFlow({
  isOpen,
  onClose,
  onSuccess,
  deepLink,
  title,
  description,
  checkTransaction,
}: SignTransactionFlowProps) {
  const [step, setStep] = useState<FlowStep>('preview')
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollCountRef = useRef(0)

  const isMobile = isMobileDevice()

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    pollCountRef.current = 0
  }, [])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('preview')
      setError(null)
      setTxHash(null)
      stopPolling()
    }
    return () => stopPolling()
  }, [isOpen, stopPolling])

  // Auto-poll when in signing step and checkTransaction is provided
  useEffect(() => {
    if (step !== 'signing' || !checkTransaction) {
      stopPolling()
      return
    }

    // Start polling after 5s delay (give user time to scan and sign)
    const startDelay = setTimeout(() => {
      pollCountRef.current = 0
      pollRef.current = setInterval(async () => {
        pollCountRef.current++
        // Stop after 60 attempts (~3 minutes)
        if (pollCountRef.current > 60) {
          stopPolling()
          return
        }
        try {
          const result = await checkTransaction()
          if (result.success) {
            stopPolling()
            setTxHash(result.txHash || null)
            setStep('success')
            if (result.txHash && onSuccess) {
              onSuccess(result.txHash)
            }
          }
        } catch {
          // Silently ignore poll errors
        }
      }, 3000)
    }, 5000)

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
    if (!checkTransaction) {
      setStep('success')
      return
    }

    setIsChecking(true)
    setStep('checking')
    stopPolling()

    try {
      const result = await checkTransaction()

      if (result.success) {
        setTxHash(result.txHash || null)
        setStep('success')
        if (result.txHash && onSuccess) {
          onSuccess(result.txHash)
        }
      } else {
        setError(result.error || 'Transaction not found. Please try again.')
        setStep('error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check transaction')
      setStep('error')
    } finally {
      setIsChecking(false)
    }
  }, [checkTransaction, onSuccess, stopPolling])

  const handleRetry = () => {
    setStep('signing')
    setError(null)
  }

  const handleClose = () => {
    stopPolling()
    onClose()
  }

  if (!isOpen) return null

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
                {/* QR code — shown on ALL devices */}
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-xl">
                    <QRCodeSVG value={deepLink} size={isMobile ? 200 : 280} level="L" />
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-white font-medium">
                    {isMobile ? 'Scan QR or copy code' : 'Scan with Axiome Wallet'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {isMobile
                      ? 'Open wallet → Scan QR from screenshot, or copy the code below'
                      : 'Open Axiome Wallet app and scan this QR code'}
                  </p>
                </div>

                {/* Auto-detection indicator */}
                {checkTransaction && (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    Waiting for confirmation...
                  </div>
                )}

                {/* Copy code section — mobile only */}
                {isMobile && <CopyCodeBlock deepLink={deepLink} />}

                {/* Mobile: try deep link + install wallet links */}
                {isMobile && (
                  <div className="space-y-2">
                    <a
                      href={deepLink}
                      className="block w-full py-2.5 text-center bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors text-sm"
                    >
                      Try Open Axiome Wallet
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
                  ) : checkTransaction ? (
                    "Check manually"
                  ) : (
                    "I've signed the transaction"
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
                  <p className="text-sm text-gray-400 font-mono break-all">
                    TX: {txHash.slice(0, 16)}...{txHash.slice(-8)}
                  </p>
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

/** Copyable transaction code block for mobile */
function CopyCodeBlock({ deepLink }: { deepLink: string }) {
  const [copied, setCopied] = useState(false)

  // Extract just the base64 payload (after axiomesign://)
  const code = deepLink.startsWith('axiomesign://') ? deepLink.slice(13) : deepLink

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
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
        <span className="text-xs text-gray-400 font-medium">Transaction code</span>
        <button
          onClick={handleCopy}
          className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
        >
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <div
        onClick={handleCopy}
        className="p-3 bg-gray-800/80 rounded-xl border border-gray-700 cursor-pointer hover:border-gray-600 transition-colors"
      >
        <p className="text-xs text-gray-300 font-mono break-all line-clamp-3">
          {code}
        </p>
      </div>
      <p className="text-[11px] text-gray-500 text-center">
        Open Axiome Wallet → Scan/Paste → Confirm
      </p>
    </div>
  )
}
