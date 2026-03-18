'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useWallet, useTokenBalances, useTransaction, isValidAxiomeAddress } from '@/lib/wallet'
import { SignTransactionFlow } from '@/components/wallet'
import { Card, CardContent, Button, Input, Select } from '@/components/ui'
import type { SelectOption } from '@/components/ui'

type SendStep = 'input' | 'preview' | 'success'

interface SendFormData {
  tokenAddress: string
  recipient: string
  amount: string
}

interface FormErrors {
  token?: string
  recipient?: string
  amount?: string
}

export function SendTab() {
  const { address, refreshBalance } = useWallet()
  const { tokens, isLoading: tokensLoading, refresh: refreshTokens } = useTokenBalances(address)
  const { transactionState, closeTransaction, transferToken } = useTransaction()

  const handleCloseTransaction = useCallback(() => {
    closeTransaction()
    // Always refresh after closing — balances may have changed
    setTimeout(() => {
      refreshBalance()
      refreshTokens()
    }, 500)
  }, [closeTransaction, refreshBalance, refreshTokens])

  const [step, setStep] = useState<SendStep>('input')
  const [formData, setFormData] = useState<SendFormData>({
    tokenAddress: '',
    recipient: '',
    amount: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [txHash, setTxHash] = useState<string | null>(null)

  // Auto-select first token when loaded
  useEffect(() => {
    if (tokens.length > 0 && !formData.tokenAddress) {
      setFormData(prev => ({ ...prev, tokenAddress: tokens[0].contractAddress }))
    }
  }, [tokens, formData.tokenAddress])

  // Build token options for select (CW20 only)
  const tokenOptions: SelectOption[] = tokens.map((token) => ({
    value: token.contractAddress,
    label: `${token.symbol} (${token.displayBalance})`,
    description: token.name
  }))

  const selectedToken = tokens.find(t => t.contractAddress === formData.tokenAddress)

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.tokenAddress) {
      newErrors.token = 'Please select a token'
    }

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
    setFormData({ ...formData, tokenAddress: value, amount: '' })
  }

  const handlePreview = () => {
    if (validate()) {
      setStep('preview')
    }
  }

  const handleSend = () => {
    if (!selectedToken || !address) return

    // Convert to micro units
    const amount = parseFloat(formData.amount)
    const decimals = selectedToken.decimals || 6
    const amountInMicro = Math.floor(amount * Math.pow(10, decimals)).toString()

    // Snapshot current balance for on-chain verification
    const balanceBefore = parseFloat(selectedToken.displayBalance.replace(/,/g, ''))
    const contractAddr = formData.tokenAddress

    const onSuccess = (hash: string) => {
      setTxHash(hash)
      setStep('success')
      refreshBalance()
    }

    transferToken({
      contractAddress: contractAddr,
      recipient: formData.recipient,
      amount: amountInMicro,
      tokenSymbol: selectedToken.symbol,
      onSuccess,
      checkTransaction: async () => {
        try {
          const res = await fetch(`/api/wallet/tokens?address=${address}`)
          if (!res.ok) return { success: false, error: 'Failed to check balance' }
          const data = await res.json()
          const token = data.tokens?.find((t: { contractAddress: string }) => t.contractAddress === contractAddr)
          if (!token) return { success: true } // Token disappeared = balance went to 0
          const currentBalance = parseFloat(token.displayBalance?.replace(/,/g, '') ?? '0')
          if (currentBalance < balanceBefore) return { success: true }
          return { success: false, error: 'Transaction not confirmed yet. Please wait and try again.' }
        } catch {
          return { success: false, error: 'Failed to check balance' }
        }
      },
    })
  }

  const handleReset = () => {
    setStep('input')
    setFormData({
      tokenAddress: tokens[0]?.contractAddress || '',
      recipient: '',
      amount: ''
    })
    setErrors({})
    setTxHash(null)
  }

  // No tokens message
  if (!tokensLoading && tokens.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-surface-1 border-border">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto bg-surface-2 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4M12 4v16" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">No Tokens</h3>
            <p className="text-text-secondary mb-6">
              You don't have any tokens to send. Create or receive tokens first.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Success screen
  if (step === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="bg-surface-1 border-border">
          <CardContent className="py-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="w-20 h-20 mx-auto bg-[var(--success-bg)] rounded-full flex items-center justify-center mb-6"
            >
              <svg className="w-10 h-10 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>

            <h3 className="text-2xl font-bold text-text-primary mb-2">Transaction Sent!</h3>
            <p className="text-text-secondary mb-6">
              {formData.amount} {selectedToken?.symbol} sent successfully
            </p>

            {txHash && (
              <a
                href={`https://axiomechain.pro/transactions/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-accent hover:text-accent mb-6"
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
        <Card className="bg-surface-1 border-border">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-text-primary mb-6 text-center">Confirm Transaction</h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-text-secondary">Amount</span>
                <span className="text-text-primary font-mono">
                  {formData.amount} {selectedToken?.symbol}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-text-secondary">To</span>
                <span className="text-text-primary font-mono text-sm">
                  {formData.recipient.slice(0, 12)}...{formData.recipient.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-text-secondary">Network Fee</span>
                <span className="text-text-primary font-mono">~0.005 AXM</span>
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
                className="flex-1 bg-accent"
              >
                Sign & Send
              </Button>
            </div>
          </CardContent>
        </Card>

        <SignTransactionFlow
          isOpen={transactionState.isOpen}
          onClose={handleCloseTransaction}
          deepLink={transactionState.deepLink}
          signingCode={transactionState.signingCode}
          connectToken={transactionState.connectToken}
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
      <Card className="bg-surface-1 border-border">
        <CardContent className="p-6 space-y-6">
          {/* Token Select */}
          <div>
            <Select
              label="Token"
              options={tokenOptions}
              value={formData.tokenAddress}
              onChange={handleTokenChange}
              placeholder="Select token"
            />
            {errors.token && (
              <p className="mt-1 text-sm text-[var(--danger)]">{errors.token}</p>
            )}
          </div>

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
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
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
                className={`w-full px-4 py-2.5 pr-20 bg-surface-2 border rounded-[var(--radius-sm)] text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent/30 transition-colors ${
                  errors.amount
                    ? 'border-[var(--danger)] focus:ring-[var(--danger)]'
                    : 'border-border focus:border-accent'
                }`}
              />
              <button
                type="button"
                onClick={handleMaxAmount}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium text-accent hover:text-accent bg-accent/10 hover:bg-accent/20 rounded transition-colors"
              >
                MAX
              </button>
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-[var(--danger)]">{errors.amount}</p>
            )}
            {selectedToken && (
              <p className="mt-1 text-sm text-text-tertiary">
                Available: {selectedToken.displayBalance} {selectedToken.symbol}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handlePreview}
            className="w-full bg-accent"
            size="lg"
            disabled={tokensLoading}
          >
            {tokensLoading ? 'Loading...' : 'Continue'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
