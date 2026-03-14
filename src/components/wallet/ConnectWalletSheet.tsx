'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslations } from 'next-intl'
import { useWallet } from '@/lib/wallet'
import { useAxiomeConnect } from '@/lib/wallet/useAxiomeConnect'
import { isMobileDevice } from '@/lib/wallet/axiome-connect'

const WALLET_DOCS_URL = 'https://docs.axiomeinfo.org/axiome-wallet-app'

export function ConnectWalletSheet() {
  const t = useTranslations('wallet.axiomeConnect')
  const {
    showConnectionModal,
    setShowConnectionModal,
    connectWithAddress,
  } = useWallet()

  const axiomeConnect = useAxiomeConnect()
  const [copied, setCopied] = useState(false)
  const [qrMode, setQrMode] = useState<'camera' | 'wallet'>('wallet')
  const isMobile = isMobileDevice()

  // Start connect flow when sheet opens
  useEffect(() => {
    if (showConnectionModal) {
      axiomeConnect.startConnect()
      setCopied(false)
    } else {
      axiomeConnect.stopPolling()
    }
  }, [showConnectionModal]) // eslint-disable-line react-hooks/exhaustive-deps

  // When wallet address is detected, auto-connect and close
  useEffect(() => {
    if (axiomeConnect.walletAddress && showConnectionModal) {
      connectWithAddress(axiomeConnect.walletAddress)
      setShowConnectionModal(false)
    }
  }, [axiomeConnect.walletAddress, showConnectionModal, connectWithAddress, setShowConnectionModal])

  // Resume check on visibility change (user returns from wallet app)
  useEffect(() => {
    if (!showConnectionModal) return

    const handleVisibility = async () => {
      if (document.visibilityState === 'visible') {
        const connected = await axiomeConnect.checkTokenStatus()
        if (connected && axiomeConnect.walletAddress) {
          connectWithAddress(axiomeConnect.walletAddress)
          setShowConnectionModal(false)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [showConnectionModal, axiomeConnect, connectWithAddress, setShowConnectionModal])

  const handleClose = useCallback(() => {
    setShowConnectionModal(false)
    axiomeConnect.stopPolling()
  }, [setShowConnectionModal, axiomeConnect])

  const handleCopyCode = async () => {
    if (!axiomeConnect.authToken) return
    try {
      await navigator.clipboard.writeText(axiomeConnect.authToken)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = axiomeConnect.authToken
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleMobileConnect = () => {
    if (axiomeConnect.authToken) {
      window.location.href = axiomeConnect.getConnectUrl(axiomeConnect.authToken)
    }
  }

  const qrValue = axiomeConnect.authToken
    ? (qrMode === 'wallet'
        ? axiomeConnect.getConnectQrValueNative(axiomeConnect.authToken)
        : axiomeConnect.getConnectQrValue(axiomeConnect.authToken))
    : ''

  const steps = [
    { num: 1, title: t('step1Title'), desc: t('step1Desc') },
    { num: 2, title: t('step2Title'), desc: t('step2Desc') },
    {
      num: 3,
      title: isMobile ? t('step3TitleMobile') : t('step3TitleDesktop'),
      desc: isMobile ? t('step3DescMobile') : t('step3DescDesktop'),
    },
  ]

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {showConnectionModal && (
          <motion.div
            key="connect-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60"
          />
        )}
      </AnimatePresence>

      {/* Sheet */}
      <AnimatePresence>
        {showConnectionModal && (
          isMobile ? (
            /* ─── Mobile: Bottom Sheet ─── */
            <motion.div
              key="connect-sheet-mobile"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] bg-surface-1 border-t border-border rounded-t-[var(--radius-lg)] shadow-2xl overflow-y-auto"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-surface-3 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-[var(--radius-sm)] flex items-center justify-center">
                    <svg className="w-4.5 h-4.5 text-text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-text-primary">{t('title')}</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-[var(--radius-sm)] transition-colors"
                >
                  {t('close')}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="px-5 py-5 space-y-5">
                <Stepper steps={steps} />

                <div className="space-y-2.5">
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {t('testflightHint')}
                  </p>
                  <AuthCodeBlock
                    code={axiomeConnect.authToken}
                    copied={copied}
                    onCopy={handleCopyCode}
                    generatingText={t('generatingCode')}
                    tapText={t('tapToCopy')}
                    copiedText={t('copied')}
                  />
                </div>

                <button
                  onClick={handleMobileConnect}
                  disabled={!axiomeConnect.authToken}
                  className="w-full py-3.5 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-text-primary font-semibold rounded-[var(--radius-md)] transition-all text-base shadow-sm"
                >
                  {t('connectButton')}
                </button>

                {axiomeConnect.isConnecting && (
                  <div className="flex items-center justify-center gap-2 text-sm text-text-secondary">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    {t('waiting')}
                  </div>
                )}

                <DownloadLink label={t('downloadWallet')} />
              </div>
            </motion.div>
          ) : (
            /* ─── Desktop: Right Side Sheet ─── */
            <motion.div
              key="connect-sheet-desktop"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px] bg-surface-1 border-l border-border shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-blue-500 rounded-[var(--radius-sm)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-text-primary">{t('title')}</h2>
                </div>
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
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* QR mode toggle */}
                <div className="flex bg-surface-2 rounded-[var(--radius-md)] p-1">
                  <button
                    onClick={() => setQrMode('wallet')}
                    className={`flex-1 py-2 px-3 text-xs font-medium rounded-[var(--radius-sm)] transition-all ${
                      qrMode === 'wallet'
                        ? 'bg-purple-600 text-text-primary shadow-sm'
                        : 'text-text-secondary hover:text-text-secondary'
                    }`}
                  >
                    {t('qrModeWallet')}
                  </button>
                  <button
                    onClick={() => setQrMode('camera')}
                    className={`flex-1 py-2 px-3 text-xs font-medium rounded-[var(--radius-sm)] transition-all ${
                      qrMode === 'camera'
                        ? 'bg-purple-600 text-text-primary shadow-sm'
                        : 'text-text-secondary hover:text-text-secondary'
                    }`}
                  >
                    {t('qrModeCamera')}
                  </button>
                </div>

                <div className="flex justify-center">
                  {qrValue ? (
                    <div className="bg-white p-4 rounded-[var(--radius-lg)] shadow-sm">
                      <QRCodeSVG value={qrValue} size={220} level="M" />
                    </div>
                  ) : (
                    <div className="w-[252px] h-[252px] bg-surface-2 rounded-[var(--radius-lg)] flex items-center justify-center">
                      <div className="w-8 h-8 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Hint for selected mode */}
                <p className="text-xs text-text-secondary text-center">
                  {qrMode === 'wallet' ? t('qrHintWallet') : t('qrHintCamera')}
                </p>

                <Stepper steps={steps} />

                {axiomeConnect.isConnecting && (
                  <div className="flex items-center justify-center gap-2 text-sm text-text-secondary py-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    {t('waiting')}
                  </div>
                )}

                <div className="border-t border-border" />

                <DownloadLink label={t('downloadWallet')} />
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </>
  )
}

/* ─── Stepper ─── */
function Stepper({ steps }: { steps: { num: number; title: string; desc: string }[] }) {
  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div key={step.num} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-text-primary text-xs font-bold flex-shrink-0">
              {step.num}
            </div>
            {i < steps.length - 1 && (
              <div className="w-px h-full min-h-[16px] bg-surface-3 mt-1" />
            )}
          </div>
          <div className="pb-2">
            <p className="text-text-primary font-medium text-sm leading-tight">{step.title}</p>
            <p className="text-text-secondary text-xs mt-0.5 leading-relaxed">{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Auth Code Block ─── */
function AuthCodeBlock({
  code,
  copied,
  onCopy,
  generatingText,
  tapText,
  copiedText,
}: {
  code: string | null
  copied: boolean
  onCopy: () => void
  generatingText: string
  tapText: string
  copiedText: string
}) {
  if (!code) {
    return (
      <div className="p-3.5 bg-surface-2 rounded-[var(--radius-md)] border border-border text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <span className="text-sm text-text-secondary">{generatingText}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onCopy}
      className="p-3.5 bg-surface-2 rounded-[var(--radius-md)] border border-border cursor-pointer hover:border-purple-500/40 active:scale-[0.98] transition-all text-center"
    >
      <p className="text-base text-text-primary font-mono tracking-wider select-all break-all">
        {code}
      </p>
      <p className="text-xs text-text-tertiary mt-1.5">
        {copied ? (
          <span className="text-[var(--success)]">{copiedText}</span>
        ) : (
          tapText
        )}
      </p>
    </div>
  )
}

/* ─── Download Link ─── */
function DownloadLink({ label }: { label: string }) {
  return (
    <a
      href={WALLET_DOCS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 py-2 text-sm text-accent hover:text-accent transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {label}
    </a>
  )
}
