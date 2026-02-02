'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui'
import { useWalletAuth } from '@/lib/auth'
import { isMobileDevice } from '@/lib/wallet'

interface VerificationModalProps {
  isOpen: boolean
  walletAddress: string
  onClose: () => void
  onVerified: () => void
}

export function VerificationModal({
  isOpen,
  walletAddress,
  onClose,
  onVerified
}: VerificationModalProps) {
  const {
    isVerified,
    verificationChallenge,
    isRequestingChallenge,
    isPolling,
    error,
    requestVerification,
    startPolling,
    stopPolling
  } = useWalletAuth()

  const [timeLeft, setTimeLeft] = useState(0)
  const [hasOpenedWallet, setHasOpenedWallet] = useState(false)

  // Request challenge on open
  useEffect(() => {
    if (isOpen && !verificationChallenge && !isRequestingChallenge) {
      requestVerification(walletAddress)
      setHasOpenedWallet(false)
    }
  }, [isOpen, walletAddress, verificationChallenge, isRequestingChallenge, requestVerification])

  // Watch for verification success
  useEffect(() => {
    if (isVerified && isOpen) {
      onVerified()
      onClose()
    }
  }, [isVerified, isOpen, onVerified, onClose])

  // Countdown timer
  useEffect(() => {
    if (verificationChallenge) {
      const updateTimer = () => {
        const remaining = Math.max(0, verificationChallenge.expiresAt - Date.now())
        setTimeLeft(Math.floor(remaining / 1000))

        if (remaining <= 0) {
          stopPolling()
        }
      }

      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    }
  }, [verificationChallenge, stopPolling])

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      stopPolling()
      setHasOpenedWallet(false)
    }
  }, [isOpen, stopPolling])

  // Handle opening wallet
  const handleOpenWallet = () => {
    if (!verificationChallenge) return

    setHasOpenedWallet(true)

    // Start polling for verification
    startPolling(walletAddress)

    // Open deep link
    if (isMobileDevice()) {
      window.location.href = verificationChallenge.deepLink
    } else {
      window.open(verificationChallenge.deepLink, '_blank')
    }
  }

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Верификация кошелька</h3>
                <p className="text-sm text-gray-400">Подтвердите владение</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Loading */}
          {isRequestingChallenge && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Генерация кода верификации...</p>
            </div>
          )}

          {/* Verification content */}
          {verificationChallenge && !isRequestingChallenge && (
            <div className="space-y-6">
              {/* Polling status */}
              {isPolling && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <div>
                      <p className="text-blue-300 font-medium">Ожидание транзакции...</p>
                      <p className="text-sm text-gray-400">
                        Подтвердите транзакцию в Axiome Wallet
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions */}
              {!hasOpenedWallet && (
                <div className="text-center">
                  <p className="text-gray-300 mb-2">
                    Для верификации отправьте <span className="text-purple-400 font-semibold">0.001 AXM</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Транзакция будет обнаружена автоматически
                  </p>
                </div>
              )}

              {/* QR Code */}
              {!hasOpenedWallet && (
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-xl">
                    <QRCodeSVG
                      value={verificationChallenge.deepLink}
                      size={180}
                      level="M"
                    />
                  </div>
                </div>
              )}

              {/* Verification code display */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">КОД ВЕРИФИКАЦИИ</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(verificationChallenge.code)}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Копировать
                  </button>
                </div>
                <p className="text-sm font-mono text-white break-all select-all">
                  {verificationChallenge.code}
                </p>
              </div>

              {/* Timer */}
              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Код действителен:{' '}
                  <span className={`font-mono ${timeLeft < 60 ? 'text-red-400' : 'text-white'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </p>
              </div>

              {/* Action button */}
              {!hasOpenedWallet ? (
                <Button
                  onClick={handleOpenWallet}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
                  size="lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Открыть Axiome Wallet
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button
                    onClick={handleOpenWallet}
                    variant="outline"
                    className="w-full"
                  >
                    Открыть кошелёк снова
                  </Button>
                  <p className="text-center text-xs text-gray-500">
                    Если транзакция отправлена, подождите несколько секунд
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-gray-400">
                <p className="text-blue-300 font-medium mb-1">Как это работает?</p>
                <p>
                  Отправка транзакции с уникальным кодом доказывает, что вы владеете кошельком.
                  После подтверждения в блокчейне вы автоматически получите доступ к редактированию.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
