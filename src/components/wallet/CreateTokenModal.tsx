'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet, useTransaction } from '@/lib/wallet'
import { SignTransactionFlow } from './SignTransactionFlow'
import { Button, Input, Textarea } from '@/components/ui'

interface CreateTokenModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (txHash: string) => void
  initialData?: {
    name?: string
    symbol?: string
    supply?: string
    description?: string
  }
}

interface FormData {
  name: string
  symbol: string
  supply: string
  decimals: string
  enableMint: boolean
  logoUrl: string
  description: string
}

interface FormErrors {
  name?: string
  symbol?: string
  supply?: string
  decimals?: string
  logoUrl?: string
}

export function CreateTokenModal({
  isOpen,
  onClose,
  onSuccess,
  initialData
}: CreateTokenModalProps) {
  const { address, isConnected, connect } = useWallet()
  const { transactionState, closeTransaction, createToken } = useTransaction()

  const [formData, setFormData] = useState<FormData>({
    name: '',
    symbol: '',
    supply: '1000000000',
    decimals: '6',
    enableMint: false,
    logoUrl: '',
    description: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [txHash, setTxHash] = useState<string | null>(null)

  // Prefill from initial data
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData((prev) => ({
        ...prev,
        name: initialData.name || prev.name,
        symbol: initialData.symbol || extractSymbol(initialData.name) || prev.symbol,
        supply: initialData.supply?.replace(/[^0-9]/g, '') || prev.supply,
        description: initialData.description || prev.description
      }))
    }
  }, [isOpen, initialData])

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep('form')
      setErrors({})
      setTxHash(null)
    }
  }, [isOpen])

  const extractSymbol = (name?: string): string => {
    if (!name) return ''
    // Take first letters of words, max 5 chars
    const words = name.trim().split(/\s+/)
    if (words.length === 1) {
      return name.slice(0, 5).toUpperCase()
    }
    return words
      .map((w) => w[0])
      .join('')
      .slice(0, 5)
      .toUpperCase()
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Token name is required'
    } else if (formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters'
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name must be less than 50 characters'
    }

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Symbol is required'
    } else if (!/^[A-Z0-9]{2,10}$/.test(formData.symbol)) {
      newErrors.symbol = 'Symbol must be 2-10 uppercase letters/numbers'
    }

    if (!formData.supply.trim()) {
      newErrors.supply = 'Supply is required'
    } else {
      const supply = parseInt(formData.supply)
      if (isNaN(supply) || supply <= 0) {
        newErrors.supply = 'Supply must be a positive number'
      }
    }

    const decimals = parseInt(formData.decimals)
    if (isNaN(decimals) || decimals < 0 || decimals > 18) {
      newErrors.decimals = 'Decimals must be 0-18'
    }

    if (formData.logoUrl && !/^https?:\/\/.+/.test(formData.logoUrl)) {
      newErrors.logoUrl = 'Invalid URL format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    if (!isConnected) {
      connect()
      return
    }

    // Calculate initial supply with decimals
    const decimals = parseInt(formData.decimals)
    const supply = parseInt(formData.supply)
    const initialSupply = (supply * Math.pow(10, decimals)).toString()

    createToken({
      name: formData.name.trim(),
      symbol: formData.symbol.toUpperCase(),
      initialSupply,
      decimals,
      enableMint: formData.enableMint,
      logoUrl: formData.logoUrl || undefined,
      description: formData.description || undefined,
      onSuccess: (hash) => {
        setTxHash(hash)
        setStep('success')
        onSuccess?.(hash)
      }
    })
  }

  const handleClose = () => {
    closeTransaction()
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900">
            <h2 className="text-xl font-semibold text-white">Create Token</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Token Created!</h3>
                <p className="text-gray-400 mb-4">
                  {formData.name} ({formData.symbol}) has been created successfully.
                </p>
                {txHash && (
                  <a
                    href={`https://axiomechain.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-6"
                  >
                    <span className="font-mono text-sm">View Transaction</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                <Button onClick={handleClose} className="w-full max-w-xs">
                  Done
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-5">
                {/* Name */}
                <Input
                  label="Token Name"
                  placeholder="My Awesome Token"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                />

                {/* Symbol */}
                <Input
                  label="Symbol"
                  placeholder="MAT"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  error={errors.symbol}
                  maxLength={10}
                />

                {/* Supply and Decimals */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Initial Supply"
                    type="number"
                    placeholder="1000000000"
                    value={formData.supply}
                    onChange={(e) => setFormData({ ...formData, supply: e.target.value })}
                    error={errors.supply}
                  />
                  <Input
                    label="Decimals"
                    type="number"
                    placeholder="6"
                    value={formData.decimals}
                    onChange={(e) => setFormData({ ...formData, decimals: e.target.value })}
                    error={errors.decimals}
                    min={0}
                    max={18}
                  />
                </div>

                {/* Enable Mint */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.enableMint}
                      onChange={(e) => setFormData({ ...formData, enableMint: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-10 h-6 rounded-full transition-colors ${formData.enableMint ? 'bg-purple-600' : 'bg-gray-700'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${formData.enableMint ? 'translate-x-5' : 'translate-x-1'}`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-medium group-hover:text-purple-300 transition-colors">Enable Minting</p>
                    <p className="text-xs text-gray-500">Allow creating more tokens in the future</p>
                  </div>
                </label>

                {/* Logo URL */}
                <Input
                  label="Logo URL (optional)"
                  placeholder="https://example.com/logo.png"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  error={errors.logoUrl}
                />

                {/* Description */}
                <Textarea
                  label="Description (optional)"
                  placeholder="A brief description of your token..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />

                {/* Warning */}
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-sm">
                      <p className="text-yellow-400 font-medium">Network Fee Required</p>
                      <p className="text-gray-400">
                        Creating a token requires a small network fee (~0.01 AXM). Make sure you have enough balance.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  onClick={handleSubmit}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                  size="lg"
                >
                  {isConnected ? 'Create Token' : 'Connect Wallet'}
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Transaction Flow */}
        <SignTransactionFlow
          isOpen={transactionState.isOpen}
          onClose={closeTransaction}
          deepLink={transactionState.deepLink}
          title={transactionState.title}
          description={transactionState.description}
          onSuccess={transactionState.onSuccess}
          checkTransaction={transactionState.checkTransaction}
        />
      </div>
    </AnimatePresence>
  )
}
