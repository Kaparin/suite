'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { useWallet } from '@/lib/wallet'
import { Card, CardContent } from '@/components/ui'

export function ReceiveTab() {
  const { address } = useWallet()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!address) return

    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = address
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!address) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="py-8 text-center">
          <p className="text-gray-400 mb-6">
            Share this address or scan the QR code to receive tokens
          </p>

          {/* QR Code */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-block bg-white p-4 rounded-xl mb-6 shadow-lg"
          >
            <QRCodeSVG value={address} size={200} level="M" />
          </motion.div>

          {/* Address with copy */}
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-2 bg-gray-800/50 border border-gray-700 p-4 rounded-xl">
              <p className="flex-1 font-mono text-sm text-gray-300 break-all text-left">
                {address}
              </p>
              <motion.button
                onClick={handleCopy}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              >
                {copied ? (
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </motion.button>
            </div>
            {copied && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-green-400 text-sm mt-2"
              >
                Address copied!
              </motion.p>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl max-w-md mx-auto">
            <div className="flex items-start gap-3 text-left">
              <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="text-purple-300 font-medium mb-1">Only send AXM and CW20 tokens</p>
                <p className="text-gray-400">
                  This address only supports Axiome network tokens. Sending other assets may result in permanent loss.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
