'use client'

import { useState, useCallback } from 'react'
import { useWallet } from './WalletProvider'
import { AXIOME_CHAIN } from './chain'
import {
  buildAxiomeSignLink,
  buildCW20InstantiatePayload,
  buildCW20TransferPayload,
  buildSendPayload,
  buildExecutePayload,
  TransactionPayload,
  AxiomeConnectFunds
} from './transaction-builder'
import { useAxiomeConnect } from './useAxiomeConnect'

export interface TransactionState {
  isOpen: boolean
  deepLink: string
  signingCode: string | null
  connectToken: string | null
  title: string
  description: string
  onSuccess?: (txHash: string) => void
  checkTransaction?: () => Promise<{ success: boolean; txHash?: string; error?: string }>
}

export function useTransaction() {
  const { address } = useWallet()
  const axiomeConnect = useAxiomeConnect()
  const [state, setState] = useState<TransactionState>({
    isOpen: false,
    deepLink: '',
    signingCode: null,
    connectToken: null,
    title: '',
    description: ''
  })

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }))
  }, [])

  // Generic transaction opener
  const openTransaction = useCallback(async (params: {
    payload: TransactionPayload
    title: string
    description: string
    onSuccess?: (txHash: string) => void
    checkTransaction?: () => Promise<{ success: boolean; txHash?: string; error?: string }>
  }) => {
    const deepLink = buildAxiomeSignLink(params.payload)

    // Open modal immediately with QR/deep link
    setState({
      isOpen: true,
      deepLink,
      signingCode: null,
      connectToken: null,
      title: params.title,
      description: params.description,
      onSuccess: params.onSuccess,
      checkTransaction: params.checkTransaction
    })

    // Try to get auth token and submit signing request in background
    try {
      const token = await axiomeConnect.startConnect()
      if (token) {
        setState(prev => prev.isOpen ? { ...prev, connectToken: token } : prev)

        // Try to submit signing request
        const signingId = await axiomeConnect.submitSigningRequest(deepLink, token)
        if (signingId) {
          setState(prev => prev.isOpen ? { ...prev, signingCode: signingId } : prev)
        }
      }
    } catch (err) {
      console.error('Failed to get Axiome Connect auth:', err)
      // Continue with deep link only — QR code still works
    }
  }, [axiomeConnect])

  // Create CW20 token
  const createToken = useCallback((params: {
    codeId?: number
    name: string
    symbol: string
    initialSupply: string
    decimals?: number
    enableMint?: boolean
    logoUrl?: string
    projectUrl?: string
    description?: string
    onSuccess?: (txHash: string) => void
  }) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    const codeId = params.codeId ?? AXIOME_CHAIN.contracts.cw20

    const payload = buildCW20InstantiatePayload({
      codeId,
      sender: address,
      name: params.name,
      symbol: params.symbol,
      initialSupply: params.initialSupply,
      decimals: params.decimals,
      enableMint: params.enableMint,
      label: params.symbol
    })

    openTransaction({
      payload,
      title: 'Create Token',
      description: `Create ${params.name} (${params.symbol})`,
      onSuccess: params.onSuccess
    })
  }, [address, openTransaction])

  // Transfer CW20 tokens
  const transferToken = useCallback((params: {
    contractAddress: string
    recipient: string
    amount: string
    tokenSymbol: string
    onSuccess?: (txHash: string) => void
  }) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    const payload = buildCW20TransferPayload({
      contractAddress: params.contractAddress,
      sender: address,
      recipient: params.recipient,
      amount: params.amount
    })

    openTransaction({
      payload,
      title: 'Transfer Tokens',
      description: `Send ${params.amount} ${params.tokenSymbol} to ${params.recipient.slice(0, 12)}...`,
      onSuccess: params.onSuccess
    })
  }, [address, openTransaction])

  // Send native AXM
  const sendAxm = useCallback((params: {
    recipient: string
    amount: string
    onSuccess?: (txHash: string) => void
  }) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    const payload = buildSendPayload({
      sender: address,
      recipient: params.recipient,
      amount: params.amount
    })

    openTransaction({
      payload,
      title: 'Send AXM',
      description: `Send ${Number(params.amount) / 1_000_000} AXM to ${params.recipient.slice(0, 12)}...`,
      onSuccess: params.onSuccess
    })
  }, [address, openTransaction])

  // Execute arbitrary contract call
  const executeContract = useCallback((params: {
    contractAddress: string
    msg: Record<string, unknown>
    funds?: AxiomeConnectFunds[]
    title: string
    description: string
    onSuccess?: (txHash: string) => void
    checkTransaction?: () => Promise<{ success: boolean; txHash?: string; error?: string }>
  }) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    const payload = buildExecutePayload({
      contractAddress: params.contractAddress,
      sender: address,
      msg: params.msg,
      funds: params.funds
    })

    openTransaction({
      payload,
      title: params.title,
      description: params.description,
      onSuccess: params.onSuccess,
      checkTransaction: params.checkTransaction
    })
  }, [address, openTransaction])

  return {
    // State for SignTransactionFlow
    transactionState: state,
    closeTransaction: close,

    // Transaction methods
    createToken,
    transferToken,
    sendAxm,
    executeContract,
    openTransaction
  }
}
