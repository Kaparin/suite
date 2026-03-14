'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { useWallet } from '@/lib/wallet'
import {
  AXIOME_WALLET_IOS,
  AXIOME_WALLET_ANDROID,
  isMobileDevice
} from '@/lib/wallet/axiome-connect'

export function ConnectWalletModal() {
  const {
    showConnectionModal,
    setShowConnectionModal,
    connectWithAddress,
    isConnecting,
    error,
  } = useWallet()

  const [address, setAddress] = useState('')
  const [showQR, setShowQR] = useState(false)

  if (!showConnectionModal) return null

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (address.trim()) {
      connectWithAddress(address.trim())
    }
  }

  const handleClose = () => {
    setShowConnectionModal(false)
    setAddress('')
    setShowQR(false)
  }

  const isMobile = isMobileDevice()

  // Deep link to open Axiome Wallet (for getting address)
  const walletDeepLink = 'axiomewallet://open'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-surface-1 border border-border rounded-[var(--radius-lg)] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-text-primary">Connect Wallet</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-surface-2 rounded-[var(--radius-sm)] transition-colors"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Axiome Wallet Logo */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-[var(--radius-lg)] flex items-center justify-center shadow-sm">
                <svg className="w-12 h-12 text-text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-medium text-text-primary mb-2">Axiome Wallet</h3>
              <p className="text-sm text-text-secondary">
                Enter your wallet address to connect. Transactions will be signed via Axiome Connect.
              </p>
            </div>

            {/* Address Input Form */}
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="axm1..."
                  className="w-full px-4 py-3 bg-surface-2 border border-border rounded-[var(--radius-md)] text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-transparent font-mono text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isConnecting || !address.trim()}
                className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-text-primary font-medium rounded-[var(--radius-md)] transition-all flex items-center justify-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect'
                )}
              </button>
            </form>

            {/* How to get address */}
            <div className="space-y-3">
              <button
                onClick={() => setShowQR(!showQR)}
                className="w-full text-sm text-text-secondary hover:text-text-secondary transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How do I find my address?
              </button>

              <AnimatePresence>
                {showQR && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-surface-2 rounded-[var(--radius-md)] space-y-4">
                      <p className="text-sm text-text-secondary">
                        Open the Axiome Wallet app and copy your address from the main screen.
                      </p>

                      {isMobile ? (
                        <a
                          href={walletDeepLink}
                          className="block w-full py-3 bg-surface-3 hover:bg-surface-3 text-text-primary text-center font-medium rounded-[var(--radius-md)] transition-colors"
                        >
                          Open Axiome Wallet
                        </a>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <p className="text-xs text-text-secondary">Scan to download Axiome Wallet:</p>
                          <div className="bg-white p-3 rounded-[var(--radius-md)]">
                            <QRCodeSVG
                              value={AXIOME_WALLET_IOS}
                              size={120}
                              level="M"
                            />
                          </div>
                        </div>
                      )}

                      {/* App Store Links */}
                      <div className="grid grid-cols-2 gap-3">
                        <a
                          href={AXIOME_WALLET_IOS}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 p-3 bg-surface-2 hover:bg-surface-3 border border-gray-600 rounded-[var(--radius-sm)] transition-colors"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                          </svg>
                          <span className="text-sm text-text-secondary">iOS</span>
                        </a>
                        <a
                          href={AXIOME_WALLET_ANDROID}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 p-3 bg-surface-2 hover:bg-surface-3 border border-gray-600 rounded-[var(--radius-sm)] transition-colors"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z" />
                          </svg>
                          <span className="text-sm text-text-secondary">Android</span>
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Info box */}
            <div className="p-4 bg-accent/10 border border-accent/20 rounded-[var(--radius-sm)]">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-purple-200 font-medium">Axiome Connect</p>
                  <p className="text-xs text-purple-200/70 mt-1">
                    When you need to sign a transaction, you&apos;ll see a QR code to scan with the Axiome Wallet app.
                  </p>
                </div>
              </div>
            </div>

            {/* Error display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-[var(--danger-bg)] border border-red-500/30 rounded-[var(--radius-sm)]"
              >
                <p className="text-sm text-[var(--danger)]">{error}</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
