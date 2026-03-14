'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslations } from 'next-intl'
import { defaultLocale, type Locale } from '@/i18n/config'
import { useWallet, truncateAddress } from '@/lib/wallet'

export function Header() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const tCommon = useTranslations('common')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [copied, setCopied] = useState(false)
  const walletRef = useRef<HTMLDivElement>(null)

  const { isConnected, isConnecting, address, connect, disconnect, balance, refreshBalance, error } = useWallet()

  const currentLocale = (typeof document !== 'undefined'
    ? document.cookie.split('; ').find(row => row.startsWith('locale='))?.split('=')[1]
    : defaultLocale) as Locale || defaultLocale

  const navigation = [
    { name: t('home'), href: '/' },
    { name: t('explorer'), href: '/explorer' },
    { name: t('docs'), href: '/docs' },
  ]

  const handleConnect = () => connect()
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

  // Close wallet menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (walletRef.current && !walletRef.current.contains(e.target as Node)) {
        setIsWalletMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMobileMenuOpen])

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="container-page">
          <div className="flex items-center gap-4 h-[72px]">

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/axiome-launch-suite-logo.png"
                alt="Axiome Launch Suite"
                width={200}
                height={56}
                className="h-12 sm:h-14 w-auto object-contain"
                priority
              />
            </Link>

            {/* Search — desktop */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4">
              <div className={`relative w-full transition-all duration-200 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search tokens, collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-1 border border-border rounded-[var(--radius-md)] text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3.5 py-2 rounded-[var(--radius-sm)] text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'text-text-primary bg-surface-2'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2 ml-auto">
              <LanguageSwitcher currentLocale={currentLocale} />

              {/* Wallet — desktop */}
              <div ref={walletRef} className="relative hidden sm:block">
                {isConnected && address ? (
                  <>
                    <button
                      onClick={() => setIsWalletMenuOpen(!isWalletMenuOpen)}
                      className="flex items-center gap-2.5 px-3.5 py-2 bg-surface-1 hover:bg-surface-2 border border-border hover:border-border-hover rounded-[var(--radius-md)] transition-all duration-200"
                    >
                      <div className="w-2 h-2 bg-[var(--success)] rounded-full" />
                      <span className="text-sm font-medium text-text-primary font-mono">{truncateAddress(address)}</span>
                      <div className="h-4 w-px bg-border" />
                      <span className="text-sm font-semibold text-accent">
                        {balance.isLoading ? (
                          <span className="inline-block w-12 h-3.5 skeleton rounded" />
                        ) : (
                          `${balance.axm} AXM`
                        )}
                      </span>
                      <svg className={`w-3.5 h-3.5 text-text-tertiary transition-transform duration-200 ${isWalletMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Wallet Dropdown */}
                    <AnimatePresence>
                      {isWalletMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute right-0 mt-2 w-72 dropdown-menu"
                        >
                          {/* Balance */}
                          <div className="p-4 border-b border-border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Balance</span>
                              <button
                                onClick={() => refreshBalance()}
                                disabled={balance.isLoading}
                                className="p-1 rounded hover:bg-surface-2 transition-colors disabled:opacity-50"
                              >
                                <svg className={`w-3.5 h-3.5 text-text-tertiary ${balance.isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            </div>
                            <p className="text-xl font-bold text-text-primary">
                              {balance.isLoading ? '...' : balance.axm} <span className="text-accent text-base">AXM</span>
                            </p>
                            {balance.error && (
                              <p className="text-xs text-[var(--danger)] mt-1">{balance.error}</p>
                            )}
                          </div>

                          {/* Address */}
                          <div className="p-4 border-b border-border">
                            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1.5">Address</p>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-mono text-text-primary truncate flex-1">{address}</p>
                              <button
                                onClick={handleCopyAddress}
                                className="p-1.5 rounded hover:bg-surface-2 transition-colors flex-shrink-0"
                              >
                                {copied ? (
                                  <svg className="w-4 h-4 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Menu Items */}
                          <div className="py-1">
                            <Link
                              href="/wallet"
                              onClick={() => setIsWalletMenuOpen(false)}
                              className="dropdown-item"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                              {t('wallet')}
                            </Link>
                            <Link
                              href="/wallet?tab=staking"
                              onClick={() => setIsWalletMenuOpen(false)}
                              className="dropdown-item"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Staking
                            </Link>
                            <a
                              href={`https://axiomechain.org/address/${address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="dropdown-item"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              View on Explorer
                            </a>
                          </div>

                          <div className="divider" />

                          <div className="py-1">
                            <button
                              onClick={handleDisconnect}
                              className="dropdown-item w-full text-[var(--danger)] hover:!text-[var(--danger)]"
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
                  </>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-[var(--radius-md)] transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.97]"
                  >
                    {isConnecting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        {tCommon('connectWallet')}
                      </>
                    )}
                  </button>
                )}

                {/* Error tooltip */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 px-3 py-2 bg-[var(--danger-bg)] border border-[var(--danger)]/20 rounded-[var(--radius-sm)] text-[var(--danger)] text-xs max-w-[200px]"
                  >
                    {error}
                  </motion.div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-[var(--radius-sm)] hover:bg-surface-2 transition-colors"
                aria-label="Menu"
              >
                <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu — Full screen drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[min(320px,85vw)] bg-background border-l border-border z-50 overflow-y-auto lg:hidden"
            >
              <div className="p-5">
                {/* Close button */}
                <div className="flex justify-end mb-6">
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-[var(--radius-sm)] hover:bg-surface-2 transition-colors"
                  >
                    <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Mobile Search */}
                <div className="relative mb-6">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-3 bg-surface-1 border border-border rounded-[var(--radius-md)] text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent"
                  />
                </div>

                {/* Mobile Nav Links */}
                <nav className="space-y-1 mb-6">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-4 py-3 rounded-[var(--radius-sm)] text-base font-semibold transition-colors ${
                          isActive
                            ? 'bg-accent/10 text-accent'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                        }`}
                      >
                        {item.name}
                      </Link>
                    )
                  })}
                </nav>

                <div className="divider mb-6" />

                {/* Mobile Wallet */}
                {isConnected && address ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-surface-1 border border-border rounded-[var(--radius-md)]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-[var(--success)] rounded-full" />
                          <span className="text-xs text-text-tertiary uppercase tracking-wider font-medium">Connected</span>
                        </div>
                        <span className="text-sm font-bold text-accent">
                          {balance.isLoading ? '...' : `${balance.axm} AXM`}
                        </span>
                      </div>
                      <p className="text-sm font-mono text-text-primary">{truncateAddress(address)}</p>
                    </div>

                    <Link
                      href="/wallet"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full px-4 py-3 text-center text-text-primary text-sm font-semibold rounded-[var(--radius-md)] bg-surface-1 border border-border hover:bg-surface-2 transition-colors"
                    >
                      {t('wallet')}
                    </Link>

                    <button
                      onClick={handleDisconnect}
                      className="w-full px-4 py-3 text-[var(--danger)] text-sm font-semibold rounded-[var(--radius-md)] border border-[var(--danger)]/20 hover:bg-[var(--danger-bg)] transition-colors"
                    >
                      Disconnect Wallet
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { handleConnect(); setIsMobileMenuOpen(false) }}
                    disabled={isConnecting}
                    className="w-full px-4 py-3 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-[var(--radius-md)] disabled:opacity-50 transition-colors"
                  >
                    {isConnecting ? 'Connecting...' : tCommon('connectWallet')}
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
