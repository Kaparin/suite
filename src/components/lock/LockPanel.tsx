'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/auth/useAuth'
import { TierBadge, type LockTier } from './TierBadge'

/* ─── Types ─── */

interface LockEntry {
  id: string
  walletAddress: string
  amount: number
  tier: LockTier
  durationDays: number
  lockStartDate: string
  lockEndDate: string
  status: 'ACTIVE' | 'EXPIRED' | 'UNLOCKED' | 'VIOLATED'
  lastVerifiedAt: string | null
  createdAt: string
}

interface TierRequirement {
  amount: number
  durationDays: number
}

/* ─── Constants ─── */

const TIER_ORDER: LockTier[] = ['EXPLORER', 'BUILDER', 'FOUNDER', 'GOVERNOR']
const DURATION_PRESETS = [7, 30, 90, 180]

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'active' },
  EXPIRED: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', label: 'expired' },
  UNLOCKED: { bg: 'bg-zinc-700/30', text: 'text-zinc-400', label: 'unlocked' },
  VIOLATED: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'violated' },
}

/* ─── Helpers ─── */

function calculatePreviewTier(
  amount: number,
  durationDays: number,
  requirements: Record<string, TierRequirement>
): LockTier | null {
  let bestTier: LockTier | null = null
  for (const tier of TIER_ORDER) {
    const req = requirements[tier]
    if (req && amount >= req.amount && durationDays >= req.durationDays) {
      bestTier = tier
    }
  }
  return bestTier
}

function formatCountdown(endDateStr: string): string {
  const end = new Date(endDateStr).getTime()
  const now = Date.now()
  const diff = end - now

  if (diff <= 0) return 'Expired'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) return `${days}d ${hours}h`
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/* ─── Component ─── */

export function LockPanel() {
  const t = useTranslations('lock')
  const { user, token } = useAuth()

  // Data state
  const [currentTier, setCurrentTier] = useState<LockTier | null>(null)
  const [locks, setLocks] = useState<LockEntry[]>([])
  const [tierRequirements, setTierRequirements] = useState<Record<string, TierRequirement>>({})
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Form state
  const [selectedWallet, setSelectedWallet] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [durationDays, setDurationDays] = useState<number>(30)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  // Unlock state
  const [unlockingId, setUnlockingId] = useState<string | null>(null)

  /* ─── Fetch lock data ─── */

  const fetchLockData = useCallback(async () => {
    if (!token) return

    try {
      const res = await fetch('/api/lock', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return

      const data = await res.json()
      setCurrentTier(data.tier)
      setLocks(data.locks || [])
      setTierRequirements(data.tierRequirements || {})
    } catch (error) {
      console.error('Failed to fetch lock data:', error)
    } finally {
      setIsLoadingData(false)
    }
  }, [token])

  useEffect(() => {
    fetchLockData()
  }, [fetchLockData])

  // Default wallet selection
  useEffect(() => {
    if (!selectedWallet && user?.wallets?.length) {
      const primary = user.wallets.find(w => w.isPrimary)
      setSelectedWallet(primary?.address || user.wallets[0].address)
    }
  }, [user, selectedWallet])

  /* ─── Computed values ─── */

  const numAmount = parseFloat(amount) || 0
  const previewTier = Object.keys(tierRequirements).length > 0
    ? calculatePreviewTier(numAmount, durationDays, tierRequirements)
    : null

  /* ─── Handlers ─── */

  const handleLock = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    if (!selectedWallet) {
      setFormError(t('form.errorNoWallet'))
      return
    }
    if (numAmount <= 0) {
      setFormError(t('form.errorInvalidAmount'))
      return
    }
    if (durationDays < 7) {
      setFormError(t('form.errorMinDuration'))
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/lock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'lock',
          walletAddress: selectedWallet,
          amount: numAmount,
          durationDays,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setFormError(data.error || t('form.errorGeneric'))
        return
      }

      setFormSuccess(t('form.success'))
      setAmount('')
      setDurationDays(30)
      await fetchLockData()
    } catch {
      setFormError(t('form.errorGeneric'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnlock = async (lockId: string) => {
    setUnlockingId(lockId)

    try {
      const res = await fetch('/api/lock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'unlock',
          lockId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setFormError(data.error || t('form.errorGeneric'))
        return
      }

      await fetchLockData()
    } catch {
      setFormError(t('form.errorGeneric'))
    } finally {
      setUnlockingId(null)
    }
  }

  /* ─── Loading state ─── */

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ─── Current Tier ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 border border-gray-800 rounded-xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">{t('panel.currentTier')}</p>
            <div className="flex items-center gap-3">
              {currentTier ? (
                <TierBadge tier={currentTier} size="md" />
              ) : (
                <span className="text-gray-500 text-sm">{t('panel.noTier')}</span>
              )}
            </div>
          </div>
          <div className="w-12 h-12 bg-violet-500/15 rounded-xl flex items-center justify-center">
            <svg
              className="w-6 h-6 text-violet-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* ─── Lock Form ─── */}
      <motion.form
        onSubmit={handleLock}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5"
      >
        <h3 className="text-lg font-bold text-white">{t('form.title')}</h3>

        {/* Wallet Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            {t('form.wallet')}
          </label>
          <select
            value={selectedWallet}
            onChange={(e) => setSelectedWallet(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
          >
            {user?.wallets?.map((wallet) => (
              <option key={wallet.id} value={wallet.address}>
                {wallet.label || wallet.address.slice(0, 12) + '...' + wallet.address.slice(-6)}
                {wallet.isPrimary ? ` (${t('form.primary')})` : ''}
              </option>
            ))}
            {(!user?.wallets || user.wallets.length === 0) && (
              <option value="" disabled>
                {t('form.noWallets')}
              </option>
            )}
          </select>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            {t('form.amount')}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="1"
              step="any"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors pr-20"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
              LAUNCH
            </span>
          </div>
        </div>

        {/* Duration Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            {t('form.duration')}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {DURATION_PRESETS.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setDurationDays(days)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  durationDays === days
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600 hover:text-white'
                }`}
              >
                {days}{t('form.days')}
              </button>
            ))}
          </div>
        </div>

        {/* Live Tier Preview */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">{t('form.tierPreview')}</span>
            {previewTier ? (
              <TierBadge tier={previewTier} size="md" />
            ) : (
              <span className="text-xs text-gray-500">{t('form.noTierPreview')}</span>
            )}
          </div>
        </div>

        {/* Error / Success Messages */}
        <AnimatePresence mode="wait">
          {formError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400"
            >
              {formError}
            </motion.div>
          )}
          {formSuccess && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 text-sm text-emerald-400"
            >
              {formSuccess}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !selectedWallet || numAmount <= 0}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t('form.locking')}
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              {t('form.lockButton')}
            </>
          )}
        </button>
      </motion.form>

      {/* ─── Active Locks List ─── */}
      {locks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-bold text-white">{t('locks.title')}</h3>

          <div className="space-y-3">
            {locks.map((lock) => {
              const statusStyle = STATUS_STYLES[lock.status] || STATUS_STYLES.ACTIVE
              const isExpiredOrViolated = lock.status === 'EXPIRED' || lock.status === 'VIOLATED'
              const isActive = lock.status === 'ACTIVE'

              return (
                <motion.div
                  key={lock.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <TierBadge tier={lock.tier} size="sm" />
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${statusStyle.bg} ${statusStyle.text}`}
                      >
                        {t(`locks.status.${statusStyle.label}`)}
                      </span>
                    </div>
                    {isExpiredOrViolated && (
                      <button
                        onClick={() => handleUnlock(lock.id)}
                        disabled={unlockingId === lock.id}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {unlockingId === lock.id ? (
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          t('locks.unlock')
                        )}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">{t('locks.amount')}</p>
                      <p className="text-white font-medium">
                        {lock.amount.toLocaleString()} LAUNCH
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">{t('locks.duration')}</p>
                      <p className="text-white font-medium">
                        {lock.durationDays}{t('form.days')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">{t('locks.endDate')}</p>
                      <p className="text-white font-medium">{formatDate(lock.lockEndDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">
                        {isActive ? t('locks.timeLeft') : t('locks.wallet')}
                      </p>
                      <p className={`font-medium ${isActive ? 'text-purple-400' : 'text-gray-400'}`}>
                        {isActive
                          ? formatCountdown(lock.lockEndDate)
                          : lock.walletAddress.slice(0, 8) + '...' + lock.walletAddress.slice(-4)
                        }
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
