'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslations } from 'next-intl'
import {
  isMobileDevice,
  pollSigningStatus,
  cancelSigningRequest,
  extractTxHash,
  type SigningStatus,
} from '@/lib/wallet/axiome-connect'

type FlowStep = 'preview' | 'signing' | 'checking' | 'success' | 'error'
type QrMode = 'camera' | 'wallet'

interface SignTransactionFlowProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (txHash: string) => void
  deepLink: string
  signingCode?: string | null
  connectToken?: string | null
  title: string
  description: string
  checkTransaction?: () => Promise<{ success: boolean; txHash?: string; error?: string }>
}

/** Handle success: extract hash, cancel request, call onSuccess ALWAYS */
function handleSuccessResult(
  code: string,
  payload: string | undefined,
  stopPolling: () => void,
  setTxHash: (h: string | null) => void,
  setStep: (s: FlowStep) => void,
  onSuccessRef: React.RefObject<((txHash: string) => void) | undefined>,
) {
  stopPolling()
  cancelSigningRequest(code).catch(() => {})
  const hash = extractTxHash(payload)
  setTxHash(hash)
  setStep('success')
  // Always call onSuccess — even with empty hash, so balances refresh
  if (onSuccessRef.current) onSuccessRef.current(hash || '')
}

export function SignTransactionFlow({
  isOpen,
  onClose,
  onSuccess,
  deepLink,
  signingCode,
  connectToken,
  title,
  description,
  checkTransaction,
}: SignTransactionFlowProps) {
  const t = useTranslations('wallet.signTransaction')
  const [step, setStep] = useState<FlowStep>('preview')
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<SigningStatus | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [qrMode, setQrMode] = useState<QrMode>('wallet')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Use refs for callbacks to avoid polling effect re-runs
  const signingCodeRef = useRef<string | null>(null)
  const onSuccessRef = useRef(onSuccess)
  const checkTransactionRef = useRef(checkTransaction)

  const isMobile = isMobileDevice()

  // Keep refs in sync with props
  useEffect(() => { signingCodeRef.current = signingCode ?? null }, [signingCode])
  useEffect(() => { onSuccessRef.current = onSuccess }, [onSuccess])
  useEffect(() => { checkTransactionRef.current = checkTransaction }, [checkTransaction])

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
  }, [])

  // Reset state when opened, cleanup when closed
  useEffect(() => {
    if (isOpen) {
      setStep('preview')
      setError(null)
      setTxHash(null)
      setApiStatus(null)
      stopPolling()
    }
    return () => stopPolling()
  }, [isOpen, stopPolling])

  // Auto-advance to signing step when signing code arrives (no QR = direct signing)
  useEffect(() => {
    if (isOpen && signingCode && !connectToken && step === 'preview') {
      setStep('signing')
    }
  }, [isOpen, signingCode, connectToken, step])

  // Poll for transaction status when in signing step
  useEffect(() => {
    if (step !== 'signing') { stopPolling(); return }

    // Start fast: first poll after 2s, then every 5s
    const startDelay = setTimeout(() => {
      pollRef.current = setInterval(async () => {
        const code = signingCodeRef.current
        if (code) {
          try {
            const result = await pollSigningStatus(code)
            setApiStatus(result.status)
            if (result.status === 'result') {
              handleSuccessResult(code, result.payload, stopPolling, setTxHash, setStep, onSuccessRef)
              return
            }
            if (result.status === 'cancel') { stopPolling(); setError('Transaction cancelled'); setStep('error'); return }
            if (result.status === 'error') { stopPolling(); setError('Transaction failed'); setStep('error'); return }
          } catch { /* ignore */ }
        }
        if (checkTransactionRef.current) {
          try {
            const result = await checkTransactionRef.current()
            if (result.success) {
              stopPolling()
              if (code) cancelSigningRequest(code).catch(() => {})
              setTxHash(result.txHash || null)
              setStep('success')
              if (onSuccessRef.current) onSuccessRef.current(result.txHash || '')
            }
          } catch { /* ignore */ }
        }
      }, 5_000)

      timeoutRef.current = setTimeout(() => { stopPolling(); setApiStatus('pulling_timeout') }, 300_000)
    }, 2_000)

    return () => { clearTimeout(startDelay); stopPolling() }
  }, [step, stopPolling])

  // Resume check on visibility change — retry multiple times with short intervals
  useEffect(() => {
    if (step !== 'signing') return
    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return
      const code = signingCodeRef.current

      // 1. Try API polling first (works when wallet signs via API push notification)
      if (code) {
        for (let attempt = 0; attempt < 3; attempt++) {
          if (attempt > 0) await new Promise(r => setTimeout(r, 2000))
          try {
            const result = await pollSigningStatus(code)
            if (result.status === 'result') {
              handleSuccessResult(code, result.payload, stopPolling, setTxHash, setStep, onSuccessRef)
              return
            }
            if (result.status === 'broadcast') {
              setApiStatus('broadcast')
              continue
            }
          } catch { /* ignore, retry */ }
        }
      }

      // 2. Fallback: on-chain verification (works when wallet signs via deep link directly)
      if (checkTransactionRef.current) {
        for (let attempt = 0; attempt < 3; attempt++) {
          if (attempt > 0) await new Promise(r => setTimeout(r, 2000))
          try {
            const result = await checkTransactionRef.current()
            if (result.success) {
              stopPolling()
              if (code) cancelSigningRequest(code).catch(() => {})
              setTxHash(result.txHash || null)
              setStep('success')
              if (onSuccessRef.current) onSuccessRef.current(result.txHash || '')
              return
            }
          } catch { /* ignore, retry */ }
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [step, stopPolling])

  const openWalletApp = useCallback(() => {
    // Use universal link (https://axiome.pro/app/connect?token=...) to open wallet app.
    // Custom scheme (axiomesign://) is blocked by mobile browsers,
    // but universal links reliably open the app on both iOS and Android.

    if (connectToken) {
      // Fresh token flow — open with the fresh connect token
      window.location.href = `https://axiome.pro/app/connect?token=${connectToken}`
      return
    }

    // Already connected — open wallet using the existing connected token.
    // The wallet app opens, sees the associated token, and shows pending signing requests.
    const existingToken = typeof window !== 'undefined' ? localStorage.getItem('axiome_connect_token') : null
    if (existingToken) {
      window.location.href = `https://axiome.pro/app/connect?token=${existingToken}`
      return
    }

    // Last resort: try custom scheme deep link (may not work on all browsers)
    window.location.href = deepLink
  }, [connectToken, deepLink])

  const handleOpenWallet = () => { setStep('signing'); openWalletApp() }

  const handleCheckTransaction = useCallback(async () => {
    setIsChecking(true)
    const code = signingCodeRef.current

    // 1. Try API polling
    if (code) {
      try {
        const result = await pollSigningStatus(code)
        if (result.status === 'result') {
          handleSuccessResult(code, result.payload, stopPolling, setTxHash, setStep, onSuccessRef)
          setIsChecking(false); return
        }
      } catch { /* fall through */ }
    }

    // 2. Try on-chain verification (main method when wallet signs via deep link)
    if (checkTransactionRef.current) {
      try {
        const result = await checkTransactionRef.current()
        if (result.success) {
          stopPolling()
          if (code) cancelSigningRequest(code).catch(() => {})
          setTxHash(result.txHash || null); setStep('success')
          if (onSuccessRef.current) onSuccessRef.current(result.txHash || '')
          setIsChecking(false); return
        } else {
          setError(result.error || 'Transaction not confirmed yet. Please wait and try again.'); setStep('error')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check'); setStep('error')
      }
    } else {
      setError('Transaction not confirmed yet. Please wait a moment and try again.')
      setStep('error')
    }
    setIsChecking(false)
  }, [stopPolling])

  const handleRetry = () => { setStep('signing'); setError(null); setApiStatus(null) }

  // ALWAYS cancel signing request on close — even after success.
  const handleClose = useCallback(async () => {
    stopPolling()
    const code = signingCodeRef.current
    if (code) {
      try { await cancelSigningRequest(code) } catch { /* ignore */ }
    }
    onClose()
  }, [stopPolling, onClose])

  if (!isOpen) return null

  const getStatusLabel = () => {
    switch (apiStatus) {
      case 'new': return t('statusWaiting')
      case 'broadcast': return t('statusBroadcast')
      case 'pulling_timeout': return t('statusTimeout')
      default: return t('statusConfirming')
    }
  }

  // Shared content
  const renderContent = () => {
    if (step === 'success') {
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xl font-medium text-white">{t('success')}</p>
          {txHash && (
            <a href={`https://axiomechain.org/transactions/${txHash}`} target="_blank" rel="noopener noreferrer"
              className="text-sm text-purple-400 hover:text-purple-300 font-mono break-all transition-colors">
              TX: {txHash.slice(0, 16)}...{txHash.slice(-8)}
            </a>
          )}
          <button onClick={handleClose} className="mt-4 px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-colors">
            {t('done')}
          </button>
        </motion.div>
      )
    }

    if (step === 'error') {
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-xl font-medium text-white">{t('failed')}</p>
          <p className="text-sm text-red-400">{error}</p>
          <div className="flex gap-3 justify-center mt-4">
            <button onClick={handleRetry} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors">{t('tryAgain')}</button>
            <button onClick={handleClose} className="px-6 py-2 border border-gray-700 hover:border-gray-600 text-gray-300 font-medium rounded-xl transition-colors">{t('cancel')}</button>
          </div>
        </motion.div>
      )
    }

    if (step === 'checking') {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-white font-medium">{t('checkingTransaction')}</p>
          <p className="text-sm text-gray-400">{t('mayTakeMoments')}</p>
        </motion.div>
      )
    }

    // Preview & Signing
    const isSigning = step === 'signing'

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <p className="text-gray-400 text-center text-sm">{description}</p>

        {signingCode ? (
          <CopyCodeBlock code={signingCode} label={t('transactionCode')} copyText={t('copy')} />
        ) : (
          <div className="space-y-2">
            <span className="text-xs text-gray-400 font-medium">{t('transactionCode')}</span>
            <div className="p-3 bg-gray-800/80 rounded-xl border border-gray-700 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <span className="text-sm text-gray-400">{t('gettingCode')}</span>
              </div>
            </div>
          </div>
        )}

        {/* QR — desktop only, only when connecting (has connectToken) */}
        {!isMobile && connectToken && (
          <div className="space-y-3">
            {/* QR mode toggle */}
            <div className="flex bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setQrMode('wallet')}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
                  qrMode === 'wallet'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {t('qrModeWallet')}
              </button>
              <button
                onClick={() => setQrMode('camera')}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
                  qrMode === 'camera'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {t('qrModeCamera')}
              </button>
            </div>

            {/* QR code */}
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-xl">
                <QRCodeSVG
                  value={qrMode === 'wallet'
                    ? `axm:auth:token:${connectToken}`
                    : `https://axiome.pro/app/connect?token=${connectToken}`
                  }
                  size={220}
                  level="L"
                />
              </div>
            </div>

            {/* Hint for selected mode */}
            <p className="text-xs text-gray-400 text-center">
              {qrMode === 'wallet' ? t('qrHintWallet') : t('qrHintCamera')}
            </p>
          </div>
        )}

        <div className="text-center space-y-1">
          <p className="text-white font-medium text-sm">
            {connectToken
              ? (isMobile ? t('enterCodeMobile') : signingCode ? t('enterCodeOrScan') : t('scanQR'))
              : (signingCode ? t('enterCodeMobile') : t('gettingCode'))
            }
          </p>
          {!connectToken && signingCode && (
            <p className="text-xs text-gray-400">Open Axiome Wallet and enter the transaction code</p>
          )}
        </div>

        {isSigning && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <div className={`w-2 h-2 rounded-full animate-pulse ${apiStatus === 'broadcast' ? 'bg-yellow-500' : 'bg-purple-500'}`} />
            {getStatusLabel()}
          </div>
        )}

        <button onClick={isSigning ? openWalletApp : handleOpenWallet}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/20">
          {isSigning ? t('openWallet') : (isMobile ? t('signInWallet') : t('openWallet'))}
        </button>

        {isSigning && (
          <button onClick={handleCheckTransaction} disabled={isChecking}
            className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
            {isChecking ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('checking')}</>
            ) : t('checkTransaction')}
          </button>
        )}

        {isSigning && !isMobile && (
          <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 px-4 py-3">
            <p className="text-xs text-gray-400 leading-relaxed">
              {t('walletHint')}
            </p>
          </div>
        )}
      </motion.div>
    )
  }

  // Mobile: bottom sheet
  if (isMobile) {
    return (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={handleClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] bg-gray-900 border-t border-gray-700 rounded-t-2xl shadow-2xl overflow-y-auto"
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-700 rounded-full" />
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button onClick={handleClose}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-5 py-5">{renderContent()}</div>
        </motion.div>
      </>
    )
  }

  // Desktop: centered modal
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={handleClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <button onClick={handleClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6">{renderContent()}</div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

/** Copyable code block */
function CopyCodeBlock({ code, label, copyText }: { code: string; label: string; copyText: string }) {
  const [copied, setCopied] = useState(false)
  const t = useTranslations('wallet.axiomeConnect')

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(code) } catch {
      const ta = document.createElement('textarea')
      ta.value = code; ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <button onClick={handleCopy} className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors">
          {copied ? t('copied') : copyText}
        </button>
      </div>
      <div onClick={handleCopy} className="p-3 bg-gray-800/80 rounded-xl border border-gray-700 cursor-pointer hover:border-purple-500/40 transition-colors text-center">
        <p className="text-lg text-white font-mono tracking-wider select-all">{code}</p>
      </div>
    </div>
  )
}
