'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { truncateAddress } from '@/lib/wallet'

interface UserMenuProps {
  user: {
    id: string
    telegramId?: string | null
    telegramUsername?: string | null
    telegramPhotoUrl?: string | null
    telegramFirstName?: string | null
    walletAddress?: string | null
    isVerified?: boolean
    plan?: string
  }
  onLogout: () => void
  onVerifyWallet: () => void
}

// Avatar component with error handling
function UserAvatar({ src, name, size = 32 }: { src?: string | null, name: string, size?: number }) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return (
      <div
        className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-white font-medium" style={{ fontSize: size * 0.4 }}>
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      className="rounded-full"
      style={{ width: size, height: size }}
      onError={() => setHasError(true)}
    />
  )
}

export function UserMenu({ user, onLogout, onVerifyWallet }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const displayName = user.telegramUsername
    ? `@${user.telegramUsername}`
    : user.telegramFirstName || 'User'

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700/50 rounded-xl transition-all duration-300"
      >
        {/* Avatar */}
        <div className="relative">
          <UserAvatar
            src={user.telegramPhotoUrl}
            name={user.telegramFirstName || 'U'}
            size={32}
          />
          {user.isVerified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Name */}
        <span className="text-sm font-medium text-white hidden sm:block">
          {displayName}
        </span>

        {/* Dropdown arrow */}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-xl overflow-hidden z-50"
          >
            {/* User info */}
            <div className="p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={user.telegramPhotoUrl}
                  name={user.telegramFirstName || 'U'}
                  size={48}
                />
                <div>
                  <p className="font-medium text-white">{user.telegramFirstName || 'User'}</p>
                  {user.telegramUsername && (
                    <p className="text-sm text-gray-400">@{user.telegramUsername}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Wallet status */}
            <div className="p-4 border-b border-gray-800">
              {user.walletAddress ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 uppercase">Wallet</span>
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  </div>
                  <p className="text-sm font-mono text-white">{truncateAddress(user.walletAddress)}</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-400 mb-3">
                    Verify your wallet to create tokens
                  </p>
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      onVerifyWallet()
                    }}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Verify Wallet
                  </button>
                </div>
              )}
            </div>

            {/* Plan badge */}
            <div className="px-4 py-3 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 uppercase">Plan</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  user.plan === 'PRO'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {user.plan || 'FREE'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Dashboard
              </Link>
              <Link
                href="/create"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Token
              </Link>
              <div className="my-2 border-t border-gray-800" />
              <button
                onClick={() => {
                  setIsOpen(false)
                  onLogout()
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Log Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
