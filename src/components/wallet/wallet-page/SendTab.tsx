'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useWallet, useTokenBalances, useTransaction, isValidAxiomeAddress } from '@/lib/wallet'
import { SignTransactionFlow } from '@/components/wallet'
import { Card, CardContent, Button, Input, Select } from '@/components/ui'
import type { SelectOption } from '@/components/ui'

type SendStep = 'input' | 'preview' | 'success'

interface SendFormData {
  tokenType: 'native' | 'cw20'
  tokenAddress: string
  recipient: string
  amount: string
}

interface FormErrors {
  recipient?: string
  amount?: string
}

export function SendTab() {
  const { address, balance, refreshBalance } = useWallet()
  const { tokens } = useTokenBalances(address)
  const { transactionState, closeTransaction, sendAxm, transferToken } = useTransaction()

  const [step, setStep] = useState<SendStep>('input')
  const [formData, setFormData] = useState<SendFormData>({
    tokenType: 'native',
    tokenAddress: '',
    recipient: '',
    amount: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [txHash, setTxHash] = useState<string | null>(null)

  // Build token options for select
  const tokenOptions: SelectOption[] = [
    {
      value: 'native',
      label: `AXM (${balance.axm})`,
      description: 'Native token'
    },
    ...tokens.map((token) => ({
      value: token.contractAddress,
      label: `${token.symbol} (${token.displayBalance})`,
      description: token.name
    }))
  ]

  const selectedToken = formData.tokenType === 'native'
    ? { symbol: 'AXM', displayBalance: balance.axm, decimals: 6 }
    : tokens.find(t => t.contractAddress === formData.tokenAddress)

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.recipient) {
      newErrors.recipient = 'Recipient address is required'
    } else if (!isValidAxiomeAddress(formData.recipient)) {
      newErrors.recipient = 'Invalid Axiome address'
    } else if (formData.recipient === address) {
      newErrors.recipient = 'Cannot send to yourself'
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required'
    } else {
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Amount must be greater than 0'
      } else if (selectedToken) {
        const available = parseFloat(selectedToken.displayBalance.replace(/,/g, ''))
        if (amount > available) {
          newErrors.amount = 'Insufficient balance'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleMaxAmount = () => {
    if (selectedToken) {
      const maxAmount = selectedToken.displayBalance.replace(/,/g, '')
      setFormData({ ...formData, amount: maxAmount })
    }
  }

  const handleTokenChange = (value: string) => {
    if (value === 'native') {
      setFormData({ ...formData, tokenType: 'native', tokenAddress: '' })
    } else {
      setFormData({ ...formData, tokenType: 'cw20', tokenAddress: value })
    }
  }

  const handlePreview = () => {
    if (validate()) {
      setStep('preview')
    }
  }

  const handleSend = () => {
    // Convert to micro units
    const amount = parseFloat(formData.amount)
    const decimals = selectedToken?.decimals || 6
    const amountInMicro = Math.floor(amount * Math.pow(10, decimals)).toString()

    const onSuccess = (hash: string) => {
      setTxHash(hash)
      setStep('success')
      refreshBalance()
    }

    if (formData.tokenType === 'native') {
      sendAxm({
        recipient: formData.recipient,
        amount: amountInMicro,
        onSuccess
      })
    } else {
      transferToken({
        contractAddress: formData.tokenAddress,
        recipient: formData.recipient,
        amount: amountInMicro,
        tokenSymbol: selectedToken?.symbol || 'CW20',
        onSuccess
      })
    }
  }

  const handleReset = () => {
    setStep('input')
    setFormData({
      tokenType: 'native',
      tokenAddress: '',
      recipient: '',
      amount: ''
    })
    setErrors({})
    setTxHash(null)
  }

  // Success screen
  if (step === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="py-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6"
            >
              <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>

            <h3 className="text-2xl font-bold text-white mb-2">Transaction Sent!</h3>
            <p className="text-gray-400 mb-6">
              {formData.amount} {selectedToken?.symbol} sent successfully
            </p>

            {txHash && (
              <a
                href={`https://axiomechain.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-6"
              >
                <span className="font-mono text-sm">
                  {txHash.slice(0, 16)}...{txHash.slice(-8)}
                </span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}

            <Button onClick={handleReset} className="w-full max-w-xs">
              Send Another
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Preview screen
  if (step === 'preview') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-6 text-center">Confirm Transaction</h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between py-3 border-b border-gray-800">
                <span className="text-gray-400">Amount</span>
                <span className="text-white font-mono">
                  {formData.amount} {selectedToken?.symbol}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-800">
                <span className="text-gray-400">To</span>
                <span className="text-white font-mono text-sm">
                  {formData.recipient.slice(0, 12)}...{formData.recipient.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-800">
                <span className="text-gray-400">Network Fee</span>
                <span className="text-white font-mono">~0.005 AXM</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('input')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSend}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
              >
                Sign & Send
              </Button>
            </div>
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

  // Input form
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-6 space-y-6">
          {/* Token Select */}
          <Select
            label="Token"
            options={tokenOptions}
            value={formData.tokenType === 'native' ? 'native' : formData.tokenAddress}
            onChange={handleTokenChange}
            placeholder="Select token"
          />

          {/* Recipient */}
          <Input
            label="Recipient Address"
            placeholder="axm1..."
            value={formData.recipient}
            onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
            error={errors.recipient}
          />

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className={`w-full px-4 py-2.5 pr-20 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
                  errors.amount
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-700 focus:ring-purple-500 focus:border-purple-500'
                }`}
              />
              <button
                type="button"
                onClick={handleMaxAmount}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 rounded transition-colors"
              >
                MAX
              </button>
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
            )}
            {selectedToken && (
              <p className="mt-1 text-sm text-gray-500">
                Available: {selectedToken.displayBalance} {selectedToken.symbol}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handlePreview}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
            size="lg"
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
