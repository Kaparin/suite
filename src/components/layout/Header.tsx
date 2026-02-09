'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslations } from 'next-intl'
import { defaultLocale, type Locale } from '@/i18n/config'
import { useWallet, truncateAddress } from '@/lib/wallet'
import { useAuth } from '@/lib/auth/useAuth'
import { UserMenu, WalletBindModal } from '@/components/auth'
import { TierBadge } from '@/components/lock/TierBadge'

export function Header() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const tCommon = useTranslations('common')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showWalletBindModal, setShowWalletBindModal] = useState(false)

  const { isConnected, isConnecting, address, connect, disconnect, balance, refreshBalance, error } = useWallet()
  const { user, isAuthenticated, logout, updateUser } = useAuth()

  // Get current locale from cookie (client-side)
  const currentLocale = (typeof document !== 'undefined'
    ? document.cookie.split('; ').find(row => row.startsWith('locale='))?.split('=')[1]
    : defaultLocale) as Locale || defaultLocale

  const navigation = [
    { name: t('home'), href: '/' },
    { name: t('explorer'), href: '/explorer' },
    { name: t('studio'), href: '/studio' },
    { name: t('docs'), href: '/docs' },
  ]

  const handleConnect = () => {
    connect()
  }

  const handleDisconnect = () => {
    disconnect()
    setIsWalletMenuOpen(false)
  }

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRefresh = async () => {
    await refreshBalance()
  }

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Image
                src="/axiome-launch-suite-logo.png"
                alt="Axiome Launch Suite"
                width={280}
                height={80}
                className="h-14 w-auto object-contain"
                priority
              />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item, index) => {
              const isActive = pathname === item.href
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  <Link
                    href={item.href}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="navbar-active"
                        className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-500/30"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10">{item.name}</span>
                  </Link>
                </motion.div>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher currentLocale={currentLocale} />

            {/* User Menu (if authenticated) */}
            {isAuthenticated && user && (
              <div className="hidden sm:flex items-center gap-2">
                <TierBadge tier={user.tier} />
                <UserMenu
                  user={user}
                  onLogout={logout}
                  onVerifyWallet={() => setShowWalletBindModal(true)}
                />
              </div>
            )}

            {/* Login Button (if not authenticated) */}
            {!isAuthenticated && (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-xl transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                Log in
              </Link>
            )}

            {/* Wallet Button - Only show when authenticated via Telegram */}
            {isAuthenticated && (
            <div className="relative hidden sm:block">
              {isConnected && address ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsWalletMenuOpen(!isWalletMenuOpen)}
                    className="flex items-center gap-3 px-4 py-2.5 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700/50 text-white text-sm font-medium rounded-xl transition-all duration-300"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="font-mono">{truncateAddress(address)}</span>
                    </div>
                    <div className="h-4 w-px bg-gray-600" />
                    <span className="text-purple-400 font-medium">
                      {balance.isLoading ? (
                        <span className="inline-block w-12 h-4 bg-gray-700 rounded animate-pulse" />
                      ) : (
                        `${balance.axm} AXM`
                      )}
                    </span>
                    <svg className={`w-4 h-4 transition-transform ${isWalletMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.button>

                  {/* Dropdown menu */}
                  <AnimatePresence>
                    {isWalletMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-72 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-xl overflow-hidden"
                      >
                        {/* Balance section */}
                        <div className="p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-b border-gray-800">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-gray-400">Balance</p>
                            <button
                              onClick={handleRefresh}
                              disabled={balance.isLoading}
                              className="p-1 hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
                            >
                              <svg className={`w-4 h-4 text-gray-400 ${balance.isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-2xl font-bold text-white">
                            {balance.isLoading ? '...' : balance.axm} <span className="text-purple-400 text-lg">AXM</span>
                          </p>
                          {balance.error && (
                            <p className="text-xs text-red-400 mt-1">{balance.error}</p>
                          )}
                        </div>

                        {/* Address section */}
                        <div className="p-4 border-b border-gray-800">
                          <p className="text-xs text-gray-400 mb-2">Wallet Address</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-mono text-white truncate flex-1">{address}</p>
                            <button
                              onClick={handleCopyAddress}
                              className="p-1.5 hover:bg-gray-800 rounded transition-colors"
                            >
                              {copied ? (
                                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="p-2">
                          <Link
                            href="/wallet"
                            onClick={() => setIsWalletMenuOpen(false)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            {t('wallet')}
                          </Link>
                          <Link
                            href="/dashboard"
                            onClick={() => setIsWalletMenuOpen(false)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            {t('dashboard')}
                          </Link>
                          <a
                            href={`https://axiomechain.org/address/${address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View on Explorer
                          </a>
                          <div className="my-2 border-t border-gray-800" />
                          <button
                            onClick={handleDisconnect}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Disconnect
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                >
                  {isConnecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    tCommon('connectWallet')
                  )}
                </motion.button>
              )}

              {/* Error tooltip */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs max-w-[200px]"
                >
                  {error}
                </motion.div>
              )}
            </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 border-t border-gray-800/50"
            >
              <nav className="flex flex-col gap-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600/20 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      }`}
                    >
                      {item.name}
                    </Link>
                  )
                })}

                {/* Mobile: User menu and wallet (only when authenticated) */}
                {isAuthenticated && user && (
                  <div className="mt-2 pt-2 border-t border-gray-800">
                    <div className="px-4 py-2 mb-2">
                      <div className="flex items-center gap-3">
                        {user.telegramPhotoUrl ? (
                          <img src={user.telegramPhotoUrl} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {user.telegramFirstName?.[0] || user.telegramUsername?.[0] || '?'}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">{user.telegramFirstName || user.telegramUsername}</p>
                          {user.telegramUsername && (
                            <p className="text-xs text-gray-400">@{user.telegramUsername}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mobile wallet section - only when authenticated */}
                    {isConnected && address ? (
                      <div className="space-y-2">
                        <div className="px-4 py-3 bg-gray-800/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full" />
                              <span className="text-sm text-gray-400">Connected</span>
                            </div>
                            <span className="text-sm font-medium text-purple-400">
                              {balance.isLoading ? '...' : `${balance.axm} AXM`}
                            </span>
                          </div>
                          <p className="text-sm font-mono text-white">{truncateAddress(address)}</p>
                        </div>
                        <Link
                          href="/dashboard"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block w-full px-4 py-3 text-center text-white text-sm font-medium rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                        >
                          My Dashboard
                        </Link>
                        <button
                          onClick={handleDisconnect}
                          className="w-full px-4 py-3 text-red-400 text-sm font-medium rounded-lg border border-red-500/30 hover:bg-red-500/10 transition-colors"
                        >
                          Disconnect Wallet
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                      >
                        {isConnecting ? 'Connecting...' : tCommon('connectWallet')}
                      </button>
                    )}

                    <button
                      onClick={logout}
                      className="w-full mt-2 px-4 py-3 text-gray-400 text-sm rounded-lg hover:bg-gray-800/50 transition-colors"
                    >
                      Log out
                    </button>
                  </div>
                )}

                {/* Mobile: Login button when not authenticated */}
                {!isAuthenticated && (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="mt-2 flex items-center justify-center gap-2 px-4 py-3 text-white text-sm font-medium rounded-lg bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                    Log in with Telegram
                  </Link>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click outside to close wallet menu */}
      {isWalletMenuOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setIsWalletMenuOpen(false)}
        />
      )}

      {/* Wallet Bind Modal */}
      <WalletBindModal
        isOpen={showWalletBindModal}
        onClose={() => setShowWalletBindModal(false)}
        onSuccess={() => {
          setShowWalletBindModal(false)
        }}
      />
    </motion.header>
  )
}
