'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useWallet, useTokenBalances, useTransaction } from '@/lib/wallet'
import { SignTransactionFlow } from '@/components/wallet'
import { Card, CardContent, Button, Input } from '@/components/ui'
import { KNOWN_TOKENS } from '@/lib/axiome/token-registry'

interface SwapFormData {
  fromAmount: string
  toTokenAddress: string
}

interface FormErrors {
  fromAmount?: string
  toToken?: string
}

// Placeholder prices for demo - will be replaced with DEX prices
// 1 AXM = X tokens (placeholder rates)
const TOKEN_PRICES: Record<string, number> = {
  'axm1etxtq3v4chzn7xrah3w6ukkxy7vlc889n5ervgxz425msar6ajzskdmm0v': 1000, // AXP
  'axm1t3f4zxve6725sf4glrnlar8uku78j0nyfl0ppzgfju9ft9phvqwqfhrfg5': 100,  // CHAPA
  'axm14rse3e7rkc3qt7drmlulwlkrlzqvh7hv277zv05kyfuwl74udx5sdlw02u': 500,  // SIMBA
  'axm18a0pvw326fydfdat5tzyf4t8lhz0v6fyfaujpeg07fwqkygcxejs0gqae4': 250,  // ATT
}

// DEX Contract - placeholder (needs to be deployed)
const DEX_CONTRACT = process.env.NEXT_PUBLIC_DEX_CONTRACT || ''

export function SwapTab() {
  const { address, balance, refreshBalance } = useWallet()
  const { tokens } = useTokenBalances(address)
  const { transactionState, closeTransaction, executeContract } = useTransaction()

  const [formData, setFormData] = useState<SwapFormData>({
    fromAmount: '',
    toTokenAddress: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSwapping, setIsSwapping] = useState(false)

  // Get available tokens for swap (from registry)
  const availableTokens = useMemo(() => {
    return KNOWN_TOKENS.filter(token => TOKEN_PRICES[token.contractAddress])
  }, [])

  // Auto-select first token
  useEffect(() => {
    if (availableTokens.length > 0 && !formData.toTokenAddress) {
      setFormData(prev => ({ ...prev, toTokenAddress: availableTokens[0].contractAddress }))
    }
  }, [availableTokens, formData.toTokenAddress])

  const selectedToken = availableTokens.find(t => t.contractAddress === formData.toTokenAddress)
  const tokenPrice = selectedToken ? TOKEN_PRICES[selectedToken.contractAddress] || 0 : 0

  // Calculate estimated output
  const estimatedOutput = useMemo(() => {
    if (!formData.fromAmount || !tokenPrice) return '0'
    const axmAmount = parseFloat(formData.fromAmount)
    if (isNaN(axmAmount) || axmAmount <= 0) return '0'
    return (axmAmount * tokenPrice).toLocaleString('en-US', { maximumFractionDigits: 2 })
  }, [formData.fromAmount, tokenPrice])

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.fromAmount) {
      newErrors.fromAmount = 'Amount is required'
    } else {
      const amount = parseFloat(formData.fromAmount)
      if (isNaN(amount) || amount <= 0) {
        newErrors.fromAmount = 'Amount must be greater than 0'
      } else {
        const available = parseFloat(balance.axm.replace(/,/g, ''))
        if (amount > available) {
          newErrors.fromAmount = 'Insufficient AXM balance'
        }
      }
    }

    if (!formData.toTokenAddress) {
      newErrors.toToken = 'Please select a token'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSwap = async () => {
    if (!validate()) return
    if (!DEX_CONTRACT) {
      // No DEX contract - show coming soon message
      return
    }

    setIsSwapping(true)

    try {
      // Convert AXM to uaxm (micro units)
      const axmAmount = parseFloat(formData.fromAmount)
      const microAmount = Math.floor(axmAmount * 1_000_000).toString()

      // Execute swap on DEX contract
      executeContract({
        contractAddress: DEX_CONTRACT,
        msg: {
          swap: {
            offer_asset: {
              native: { denom: 'uaxm' }
            },
            ask_asset: {
              token: { contract_addr: formData.toTokenAddress }
            },
            min_output: '1' // Minimum output (slippage protection)
          }
        },
        funds: [{ denom: 'uaxm', amount: microAmount }],
        title: 'Swap Tokens',
        description: `Swap ${formData.fromAmount} AXM for ${selectedToken?.symbol || 'tokens'}`,
        onSuccess: () => {
          setFormData({ fromAmount: '', toTokenAddress: availableTokens[0]?.contractAddress || '' })
          refreshBalance()
          setIsSwapping(false)
        }
      })
    } catch {
      setIsSwapping(false)
    }
  }

  const handleMaxAmount = () => {
    // Leave some for gas
    const maxAmount = Math.max(0, parseFloat(balance.axm.replace(/,/g, '')) - 0.01)
    setFormData({ ...formData, fromAmount: maxAmount.toString() })
  }

  // No DEX contract - show coming soon
  if (!DEX_CONTRACT) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="py-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="w-20 h-20 mx-auto bg-purple-500/20 rounded-full flex items-center justify-center mb-6"
            >
              <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </motion.div>

            <h3 className="text-2xl font-bold text-white mb-2">Swap Coming Soon</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              Token swapping will be available soon. You'll be able to exchange AXM for any token directly in your wallet.
            </p>

            <div className="bg-gray-800/50 rounded-xl p-6 max-w-md mx-auto">
              <h4 className="text-sm font-medium text-gray-300 mb-4">Available tokens for swap:</h4>
              <div className="space-y-3">
                {availableTokens.map(token => (
                  <div
                    key={token.contractAddress}
                    className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {token.logoUrl ? (
                        <img src={token.logoUrl} alt={token.symbol} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{token.symbol[0]}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">{token.symbol}</p>
                        <p className="text-xs text-gray-500">{token.name}</p>
                      </div>
                    </div>
                    {token.verified && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                        Verified
                      </span>
                    )}
                  </div>
                ))}
                {availableTokens.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No tokens available yet
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Full swap UI (when DEX is available)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-6 space-y-6">
          {/* From (AXM) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              You Pay
            </label>
            <div className="relative">
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Image
                    src="/axm-logo.png"
                    alt="AXM"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span className="font-medium text-white">AXM</span>
                </div>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={formData.fromAmount}
                  onChange={(e) => setFormData({ ...formData, fromAmount: e.target.value })}
                  className={`flex-1 bg-transparent text-right text-white text-lg placeholder-gray-500 focus:outline-none ${
                    errors.fromAmount ? 'text-red-400' : ''
                  }`}
                />
              </div>
              <div className="flex items-center justify-between mt-2 px-1">
                <p className="text-xs text-gray-500">
                  Balance: {balance.axm} AXM
                </p>
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  MAX
                </button>
              </div>
            </div>
            {errors.fromAmount && (
              <p className="mt-1 text-sm text-red-500">{errors.fromAmount}</p>
            )}
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>

          {/* To (Token) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              You Receive
            </label>
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg">
              <select
                value={formData.toTokenAddress}
                onChange={(e) => setFormData({ ...formData, toTokenAddress: e.target.value })}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                {availableTokens.map(token => (
                  <option key={token.contractAddress} value={token.contractAddress}>
                    {token.symbol}
                  </option>
                ))}
              </select>
              <div className="flex-1 text-right">
                <p className="text-lg font-medium text-white">~{estimatedOutput}</p>
                <p className="text-xs text-gray-500">
                  Rate: 1 AXM = {tokenPrice.toLocaleString()} {selectedToken?.symbol}
                </p>
              </div>
            </div>
          </div>

          {/* Swap Info */}
          <div className="p-4 bg-gray-800/50 rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Rate</span>
              <span className="text-white">
                1 AXM = {tokenPrice.toLocaleString()} {selectedToken?.symbol}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Slippage Tolerance</span>
              <span className="text-white">1%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Network Fee</span>
              <span className="text-white">~0.005 AXM</span>
            </div>
          </div>

          {/* Swap Button */}
          <Button
            onClick={handleSwap}
            disabled={isSwapping || !formData.fromAmount}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
            size="lg"
          >
            {isSwapping ? 'Swapping...' : 'Swap'}
          </Button>
        </CardContent>
      </Card>

      <SignTransactionFlow
        isOpen={transactionState.isOpen}
        onClose={closeTransaction}
        deepLink={transactionState.deepLink}
        title={transactionState.title}
        description={transactionState.description}
        onSuccess={transactionState.onSuccess}
        checkTransaction={transactionState.checkTransaction}
      />
    </motion.div>
  )
}
