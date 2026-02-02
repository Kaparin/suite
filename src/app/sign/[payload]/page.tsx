'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui'
import { AXIOME_WALLET_IOS, AXIOME_WALLET_ANDROID } from '@/lib/wallet'

interface ParsedPayload {
  type: string
  network: string
  // For instantiate
  code_id?: string
  label?: string
  msg?: {
    name?: string
    symbol?: string
    decimals?: number
    initial_balances?: Array<{ address: string; amount: string }>
  }
  // For execute
  contract_addr?: string
  // For bank_send
  to_address?: string
  amount?: Array<{ denom: string; amount: string }>
  memo?: string
}

export default function SignPage() {
  const params = useParams()
  const payload = params.payload as string

  const [deepLink, setDeepLink] = useState('')
  const [parsedPayload, setParsedPayload] = useState<ParsedPayload | null>(null)
  const [copied, setCopied] = useState(false)
  const [attemptedOpen, setAttemptedOpen] = useState(false)

  useEffect(() => {
    if (payload) {
      // The payload is already base64 encoded
      const link = `axiomesign://${payload}`
      setDeepLink(link)

      // Try to parse the payload for display
      try {
        const decoded = atob(payload)
        const parsed = JSON.parse(decoded)
        setParsedPayload(parsed)
      } catch {
        // If parsing fails, still show the link
      }
    }
  }, [payload])

  const handleOpenWallet = () => {
    setAttemptedOpen(true)

    // Try to open the deep link
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = deepLink
    document.body.appendChild(iframe)

    // Also try window.location for better compatibility
    setTimeout(() => {
      window.location.href = deepLink
    }, 100)

    // Clean up iframe
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 2000)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(deepLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = deepLink
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
  const isMobile = isIOS || isAndroid

  // Get transaction type label
  const getTypeLabel = () => {
    if (!parsedPayload) return 'Transaction'
    switch (parsedPayload.type) {
      case 'cosmwasm_instantiate':
        return 'Create Token'
      case 'cosmwasm_execute':
        return 'Execute Contract'
      case 'bank_send':
        return 'Send Tokens'
      default:
        return 'Transaction'
    }
  }

  // Get transaction details
  const getDetails = () => {
    if (!parsedPayload) return null

    if (parsedPayload.type === 'cosmwasm_instantiate' && parsedPayload.msg) {
      return {
        'Token Name': parsedPayload.msg.name,
        'Symbol': parsedPayload.msg.symbol,
        'Decimals': parsedPayload.msg.decimals,
        'Initial Supply': parsedPayload.msg.initial_balances?.[0]?.amount
      }
    }

    if (parsedPayload.type === 'bank_send') {
      return {
        'To': parsedPayload.to_address,
        'Amount': parsedPayload.amount?.[0]?.amount,
        'Denom': parsedPayload.amount?.[0]?.denom
      }
    }

    if (parsedPayload.type === 'cosmwasm_execute') {
      return {
        'Contract': parsedPayload.contract_addr
      }
    }

    return null
  }

  const details = getDetails()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{getTypeLabel()}</h1>
                <p className="text-sm text-gray-400">Sign with Axiome Wallet</p>
              </div>
            </div>
          </div>

          {/* Details */}
          {details && (
            <div className="p-6 border-b border-gray-800">
              <div className="space-y-3">
                {Object.entries(details).map(([key, value]) => value && (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-400">{key}</span>
                    <span className="text-white font-mono text-sm truncate ml-4 max-w-[200px]">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-6 space-y-4">
            {/* Open Wallet Button */}
            <Button
              onClick={handleOpenWallet}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Axiome Wallet
            </Button>

            {/* QR Code for desktop */}
            {!isMobile && (
              <div className="flex justify-center py-4">
                <div className="bg-white p-3 rounded-xl">
                  <QRCodeSVG value={deepLink} size={180} level="L" />
                </div>
              </div>
            )}

            {/* Copy Link */}
            <button
              onClick={handleCopy}
              className="w-full py-3 px-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-xl text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy deep link</span>
                </>
              )}
            </button>

            {/* App not installed message */}
            {attemptedOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl"
              >
                <p className="text-sm text-yellow-300 mb-3">
                  Wallet didn't open? Make sure Axiome Wallet is installed:
                </p>
                <div className="flex gap-2">
                  <a
                    href={AXIOME_WALLET_IOS}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-center text-sm text-white transition-colors"
                  >
                    App Store
                  </a>
                  <a
                    href={AXIOME_WALLET_ANDROID}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-center text-sm text-white transition-colors"
                  >
                    Google Play
                  </a>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-800 bg-gray-900/50">
            <p className="text-xs text-gray-500 text-center">
              This transaction request was generated by Axiome Launch Suite
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
