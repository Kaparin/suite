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

interface TransactionState {
  isOpen: boolean
  deepLink: string
  title: string
  description: string
  onSuccess?: (txHash: string) => void
  checkTransaction?: () => Promise<{ success: boolean; txHash?: string; error?: string }>
}

export function useTransaction() {
  const { address } = useWallet()
  const [state, setState] = useState<TransactionState>({
    isOpen: false,
    deepLink: '',
    title: '',
    description: ''
  })

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }))
  }, [])

  // Generic transaction opener
  const openTransaction = useCallback((params: {
    payload: TransactionPayload
    title: string
    description: string
    onSuccess?: (txHash: string) => void
    checkTransaction?: () => Promise<{ success: boolean; txHash?: string; error?: string }>
  }) => {
    const deepLink = buildAxiomeSignLink(params.payload)
    setState({
      isOpen: true,
      deepLink,
      title: params.title,
      description: params.description,
      onSuccess: params.onSuccess,
      checkTransaction: params.checkTransaction
    })
  }, [])

  // Create CW20 token
  const createToken = useCallback((params: {
    codeId?: number  // Uses AXIOME_CHAIN.contracts.cw20 by default
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

    const payload = buildCW20InstantiatePayload({
      codeId: params.codeId ?? AXIOME_CHAIN.contracts.cw20,
      sender: address,
      name: params.name,
      symbol: params.symbol,
      initialSupply: params.initialSupply,
      decimals: params.decimals,
      enableMint: params.enableMint,
      logoUrl: params.logoUrl,
      projectUrl: params.projectUrl,
      description: params.description,
      label: `${params.symbol} Token`
    })

    openTransaction({
      payload,
      title: 'Create Token',
      description: `You are about to create ${params.name} (${params.symbol}) token with initial supply of ${params.initialSupply}`,
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
      onSuccess: params.onSuccess
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
