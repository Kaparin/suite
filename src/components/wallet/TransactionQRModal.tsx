'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { isMobileDevice, openAxiomeConnect } from '@/lib/wallet/axiome-connect'

interface TransactionQRModalProps {
  isOpen: boolean
  onClose: () => void
  deepLink: string
  title?: string
  description?: string
}

export function TransactionQRModal({
  isOpen,
  onClose,
  deepLink,
  title = 'Sign Transaction',
  description = 'Scan this QR code with Axiome Wallet to sign the transaction.',
}: TransactionQRModalProps) {
  const [copied, setCopied] = useState(false)
  const isMobile = isMobileDevice()

  if (!isOpen) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(deepLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleOpenWallet = () => {
    openAxiomeConnect(deepLink)
  }

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
          className="relative w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden"
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
          <div className="p-6 space-y-6">
            <p className="text-sm text-gray-400 text-center">{description}</p>

            {/* QR Code */}
            {!isMobile && (
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-xl">
                  <QRCodeSVG
                    value={deepLink}
                    size={200}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {isMobile ? (
                <button
                  onClick={handleOpenWallet}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open in Axiome Wallet
                </button>
              ) : (
                <button
                  onClick={handleCopy}
                  className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Deep Link
                    </>
                  )}
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full py-3 border border-gray-700 hover:border-gray-600 text-gray-300 font-medium rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-purple-400 font-medium">1</span>
                </div>
                <p className="text-sm text-gray-400">
                  {isMobile
                    ? 'Tap the button above to open Axiome Wallet'
                    : 'Open Axiome Wallet on your phone'}
                </p>
              </div>
              <div className="flex gap-3 mt-3">
                <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-purple-400 font-medium">2</span>
                </div>
                <p className="text-sm text-gray-400">
                  {isMobile
                    ? 'Review and confirm the transaction'
                    : 'Scan the QR code with the wallet'}
                </p>
              </div>
              <div className="flex gap-3 mt-3">
                <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-purple-400 font-medium">3</span>
                </div>
                <p className="text-sm text-gray-400">
                  {isMobile
                    ? 'Return here after signing'
                    : 'Confirm the transaction in the app'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
