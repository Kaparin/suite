'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth, AuthWallet } from '@/lib/auth/useAuth'
import { truncateAddress } from '@/lib/wallet'
import { WalletBindModal } from './WalletBindModal'

interface WalletManagerProps {
  onWalletAdded?: () => void
}

export function WalletManager({ onWalletAdded }: WalletManagerProps) {
  const { user, token, removeWallet, setPrimaryWallet, refreshSession } = useAuth()
  const [isAddingWallet, setIsAddingWallet] = useState(false)
  const [editingWallet, setEditingWallet] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [deletingWallet, setDeletingWallet] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const wallets = user?.wallets || []

  const handleSetPrimary = async (walletId: string) => {
    if (!token) return
    setIsLoading(walletId)
    setError(null)

    try {
      const res = await fetch(`/api/auth/wallets/${walletId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPrimary: true })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to set primary wallet')
      }

      setPrimaryWallet(walletId)
      await refreshSession()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update wallet')
    } finally {
      setIsLoading(null)
    }
  }

  const handleUpdateLabel = async (walletId: string) => {
    if (!token) return
    setIsLoading(walletId)
    setError(null)

    try {
      const res = await fetch(`/api/auth/wallets/${walletId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ label: editLabel.trim() || null })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update wallet label')
      }

      await refreshSession()
      setEditingWallet(null)
      setEditLabel('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update wallet')
    } finally {
      setIsLoading(null)
    }
  }

  const handleDelete = async (walletId: string) => {
    if (!token) return
    setIsLoading(walletId)
    setError(null)

    try {
      const res = await fetch(`/api/auth/wallets/${walletId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete wallet')
      }

      removeWallet(walletId)
      await refreshSession()
      setDeletingWallet(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete wallet')
    } finally {
      setIsLoading(null)
    }
  }

  const handleWalletVerified = async (_walletAddress: string) => {
    setIsAddingWallet(false)
    await refreshSession()
    onWalletAdded?.()
  }

  const startEditing = (wallet: AuthWallet) => {
    setEditingWallet(wallet.id)
    setEditLabel(wallet.label || '')
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">My Wallets</h3>
          <p className="text-sm text-gray-400">
            {wallets.length === 0
              ? 'No wallets connected'
              : `${wallets.length} wallet${wallets.length > 1 ? 's' : ''} connected`
            }
          </p>
        </div>
        <button
          onClick={() => setIsAddingWallet(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium rounded-xl transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Wallet
        </button>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wallet List */}
      {wallets.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h4 className="text-white font-medium mb-2">No Wallets Connected</h4>
          <p className="text-gray-400 text-sm mb-4">
            Connect your Axiome wallet to create and manage tokens
          </p>
          <button
            onClick={() => setIsAddingWallet(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {wallets.map((wallet) => (
            <motion.div
              key={wallet.id}
              layout
              className="bg-gray-800/50 border border-gray-700 hover:border-gray-600 rounded-xl p-4 transition-colors"
            >
              {/* Wallet Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Label/Address */}
                  {editingWallet === wallet.id ? (
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        placeholder="Enter label..."
                        className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:border-purple-500 outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdateLabel(wallet.id)}
                        disabled={isLoading === wallet.id}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isLoading === wallet.id ? '...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingWallet(null)
                          setEditLabel('')
                        }}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-1">
                      {wallet.label ? (
                        <>
                          <span className="text-white font-medium">{wallet.label}</span>
                          <span className="text-gray-500">-</span>
                        </>
                      ) : null}
                      <button
                        onClick={() => copyAddress(wallet.address)}
                        className="text-sm font-mono text-gray-400 hover:text-white transition-colors flex items-center gap-1 group"
                        title="Click to copy"
                      >
                        {truncateAddress(wallet.address)}
                        <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {wallet.isPrimary && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Primary
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                    <span className="text-xs text-gray-500">
                      Added {new Date(wallet.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {editingWallet !== wallet.id && (
                    <>
                      {/* Edit Label */}
                      <button
                        onClick={() => startEditing(wallet)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        title="Edit label"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Set Primary */}
                      {!wallet.isPrimary && (
                        <button
                          onClick={() => handleSetPrimary(wallet.id)}
                          disabled={isLoading === wallet.id}
                          className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Set as primary"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                      )}

                      {/* Delete */}
                      {deletingWallet === wallet.id ? (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => handleDelete(wallet.id)}
                            disabled={isLoading === wallet.id}
                            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                          >
                            {isLoading === wallet.id ? '...' : 'Delete'}
                          </button>
                          <button
                            onClick={() => setDeletingWallet(null)}
                            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingWallet(wallet.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remove wallet"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Wallet Modal */}
      <AnimatePresence>
        {isAddingWallet && (
          <WalletBindModal
            isOpen={isAddingWallet}
            onClose={() => setIsAddingWallet(false)}
            onSuccess={handleWalletVerified}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
