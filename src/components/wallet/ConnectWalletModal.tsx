'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '@/lib/wallet'
import { AXIOME_WALLET_IOS, AXIOME_WALLET_ANDROID } from '@/lib/wallet/axiome-connect'

export function ConnectWalletModal() {
  const {
    showConnectionModal,
    setShowConnectionModal,
    connectWithKeplr,
    connectWithAddress,
    hasKeplr,
    isConnecting,
    error,
  } = useWallet()

  const [address, setAddress] = useState('')
  const [activeTab, setActiveTab] = useState<'keplr' | 'address'>('keplr')

  if (!showConnectionModal) return null

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    connectWithAddress(address)
  }

  const handleClose = () => {
    setShowConnectionModal(false)
    setAddress('')
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
            <h2 className="text-xl font-semibold text-white">Connect Wallet</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActiveTab('keplr')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'keplr'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Browser Extension
            </button>
            <button
              onClick={() => setActiveTab('address')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'address'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Enter Address
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'keplr' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* Keplr Button */}
                <button
                  onClick={connectWithKeplr}
                  disabled={isConnecting}
                  className="w-full flex items-center gap-4 p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl transition-all disabled:opacity-50"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-white">Keplr Wallet</p>
                    <p className="text-sm text-gray-400">
                      {hasKeplr ? 'Connect with browser extension' : 'Install extension to connect'}
                    </p>
                  </div>
                  {isConnecting && (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                </button>

                {!hasKeplr && (
                  <p className="text-sm text-gray-400 text-center">
                    Don&apos;t have Keplr?{' '}
                    <a
                      href="https://www.keplr.app/download"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Install it here
                    </a>
                  </p>
                )}

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-2 bg-gray-900 text-sm text-gray-500">or use mobile app</span>
                  </div>
                </div>

                {/* Mobile App Links */}
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={AXIOME_WALLET_IOS}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    <span className="text-sm text-gray-300">iOS</span>
                  </a>
                  <a
                    href={AXIOME_WALLET_ANDROID}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z" />
                    </svg>
                    <span className="text-sm text-gray-300">Android</span>
                  </a>
                </div>
              </motion.div>
            )}

            {activeTab === 'address' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Axiome Wallet Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="axm1..."
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Enter your Axiome wallet address to connect. You can find it in the Axiome Wallet app.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all"
                  >
                    Connect
                  </button>
                </form>

                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm text-yellow-200 font-medium">Read-only mode</p>
                      <p className="text-xs text-yellow-200/70 mt-1">
                        With manual address entry, you can view your data but transactions will require signing via Axiome Connect deep links.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
