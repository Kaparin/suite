'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { isMobileDevice, openAxiomeConnect } from '@/lib/wallet/axiome-connect'

interface TransactionQRModalProps {
  isOpen: boolean
  onClose: () => void
  deepLink: string
  connectToken?: string | null
  title?: string
  description?: string
}

export function TransactionQRModal({
  isOpen,
  onClose,
  deepLink,
  connectToken,
  title = 'Sign Transaction',
  description = 'Scan this QR code with Axiome Wallet to sign the transaction.',
}: TransactionQRModalProps) {
  const [copied, setCopied] = useState(false)
  const [qrMode, setQrMode] = useState<'camera' | 'wallet'>('wallet')
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

  // QR value depends on selected mode
  const qrValue = connectToken
    ? (qrMode === 'wallet'
        ? `axm:auth:token:${connectToken}`
        : `https://axiome.pro/app/connect?token=${connectToken}`)
    : deepLink

  const handleOpenWallet = () => {
    if (connectToken) {
      window.location.href = `https://axiome.pro/app/connect?token=${connectToken}`
    } else {
      openAxiomeConnect(deepLink)
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
          onClick={onClose}
          className="absolute inset-0 bg-black/60"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-sm bg-surface-1 border border-border rounded-[var(--radius-lg)] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-2 rounded-[var(--radius-sm)] transition-colors"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <p className="text-sm text-text-secondary text-center">{description}</p>

            {/* QR Code */}
            {!isMobile && (
              <div className="space-y-3">
                {connectToken && (
                  <div className="flex bg-surface-2 rounded-[var(--radius-md)] p-1">
                    <button
                      onClick={() => setQrMode('wallet')}
                      className={`flex-1 py-2 px-3 text-xs font-medium rounded-[var(--radius-sm)] transition-all ${
                        qrMode === 'wallet'
                          ? 'bg-purple-600 text-text-primary shadow-sm'
                          : 'text-text-secondary hover:text-text-secondary'
                      }`}
                    >
                      Axiome Wallet scanner
                    </button>
                    <button
                      onClick={() => setQrMode('camera')}
                      className={`flex-1 py-2 px-3 text-xs font-medium rounded-[var(--radius-sm)] transition-all ${
                        qrMode === 'camera'
                          ? 'bg-purple-600 text-text-primary shadow-sm'
                          : 'text-text-secondary hover:text-text-secondary'
                      }`}
                    >
                      Regular camera
                    </button>
                  </div>
                )}
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-[var(--radius-md)]">
                    <QRCodeSVG
                      value={qrValue}
                      size={200}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                </div>
                {connectToken && (
                  <p className="text-xs text-text-secondary text-center">
                    {qrMode === 'wallet'
                      ? 'Open Axiome Wallet → Scan QR inside the app'
                      : 'Scan with your phone camera — the wallet will open automatically'}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {isMobile ? (
                <button
                  onClick={handleOpenWallet}
                  className="w-full py-3 bg-accent hover:bg-accent-hover text-text-primary font-medium rounded-[var(--radius-md)] transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open in Axiome Wallet
                </button>
              ) : (
                <button
                  onClick={handleCopy}
                  className="w-full py-3 bg-surface-2 hover:bg-surface-3 text-text-primary font-medium rounded-[var(--radius-md)] transition-all flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <svg className="w-5 h-5 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                className="w-full py-3 border border-border hover:border-gray-600 text-text-secondary font-medium rounded-[var(--radius-md)] transition-all"
              >
                Cancel
              </button>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-surface-2 rounded-[var(--radius-sm)]">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-accent font-medium">1</span>
                </div>
                <p className="text-sm text-text-secondary">
                  {isMobile
                    ? 'Tap the button above to open Axiome Wallet'
                    : 'Open Axiome Wallet on your phone'}
                </p>
              </div>
              <div className="flex gap-3 mt-3">
                <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-accent font-medium">2</span>
                </div>
                <p className="text-sm text-text-secondary">
                  {isMobile
                    ? 'Review and confirm the transaction'
                    : 'Scan the QR code with the wallet'}
                </p>
              </div>
              <div className="flex gap-3 mt-3">
                <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-accent font-medium">3</span>
                </div>
                <p className="text-sm text-text-secondary">
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
