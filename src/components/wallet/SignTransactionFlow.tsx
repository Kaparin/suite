'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { isMobileDevice, openAxiomeConnect } from '@/lib/wallet/axiome-connect'

type FlowStep = 'preview' | 'signing' | 'checking' | 'success' | 'error'

interface SignTransactionFlowProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (txHash: string) => void
  deepLink: string
  title: string
  description: string
  // Optional: function to check if transaction was successful
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

  const isMobile = isMobileDevice()

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('preview')
      setError(null)
      setTxHash(null)
    }
  }, [isOpen])

  const handleOpenWallet = () => {
    setStep('signing')
    if (isMobile) {
      openAxiomeConnect(deepLink)
    }
  }

  const handleCheckTransaction = useCallback(async () => {
    if (!checkTransaction) {
      // No check function provided, just assume success
      setStep('success')
      return
    }

    setIsChecking(true)
    setStep('checking')

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
  }, [checkTransaction, onSuccess])

  const handleRetry = () => {
    setStep('signing')
    setError(null)
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
          onClick={onClose}
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
              onClick={onClose}
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
                className="space-y-6"
              >
                {!isMobile && (
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-xl">
                      <QRCodeSVG value={deepLink} size={200} level="M" />
                    </div>
                  </div>
                )}

                <div className="text-center space-y-2">
                  <p className="text-white font-medium">
                    {isMobile ? 'Sign in Axiome Wallet' : 'Scan with Axiome Wallet'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {isMobile
                      ? 'The wallet app should open. Confirm the transaction there.'
                      : 'Open Axiome Wallet on your phone and scan this QR code.'}
                  </p>
                </div>

                {/* Steps */}
                <div className="p-4 bg-gray-800/50 rounded-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-300">
                      {isMobile ? 'Open wallet app' : 'Scan QR code'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white">2</span>
                    </div>
                    <span className="text-gray-400">Review transaction details</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white">3</span>
                    </div>
                    <span className="text-gray-400">Confirm in wallet</span>
                  </div>
                </div>

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
                    "I've signed the transaction"
                  )}
                </button>

                {isMobile && (
                  <button
                    onClick={handleOpenWallet}
                    className="w-full py-2 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                  >
                    Open wallet again
                  </button>
                )}
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
                  onClick={onClose}
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
                    onClick={onClose}
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
