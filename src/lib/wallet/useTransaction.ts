'use client'

import { useState, useCallback, useRef } from 'react'
import { useWallet } from './WalletProvider'
import {
  buildAxiomeSignLink,
  buildCW20InstantiatePayload,
  buildCW20TransferPayload,
  buildSendPayload,
  buildExecutePayload,
  TransactionPayload,
  AxiomeConnectFunds
} from './transaction-builder'
import { AXIOME_CHAIN } from './chain'
import { useAxiomeConnect } from './useAxiomeConnect'
import { cancelSigningRequest } from './axiome-connect'

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
  const { createFreshToken, waitForAssociation, submitSigningRequest } = useAxiomeConnect()
  const [state, setState] = useState<TransactionState>({
    isOpen: false,
    deepLink: '',
    signingCode: null,
    connectToken: null,
    title: '',
    description: ''
  })

  // Guard against double-open while async work is in progress
  const pendingRef = useRef(false)
  // Abort controller for cancelling waitForAssociation when modal closes
  const abortRef = useRef<AbortController | null>(null)
  // Track last signing ID to cancel it before creating a new one
  const lastSigningIdRef = useRef<string | null>(null)

  const close = useCallback(() => {
    pendingRef.current = false
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
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
    // Prevent double-open
    if (pendingRef.current) return
    pendingRef.current = true

    // Abort any previous waiting
    if (abortRef.current) abortRef.current.abort()
    const abortCtrl = new AbortController()
    abortRef.current = abortCtrl

    const deepLink = buildAxiomeSignLink(params.payload)

    // Cancel any previous signing request to prevent stale requests in wallet.
    // MUST await — if not awaited, old request may still be visible when new one arrives.
    if (lastSigningIdRef.current) {
      try { await cancelSigningRequest(lastSigningIdRef.current) } catch { /* ignore */ }
      lastSigningIdRef.current = null
    }

    // Open modal immediately
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

    try {
      // 1. Try existing connected token (no QR, no waiting)
      const existingToken = typeof window !== 'undefined' ? localStorage.getItem('axiome_connect_token') : null
      const existingWallet = typeof window !== 'undefined' ? localStorage.getItem('axiome_connect_wallet') : null

      if (existingToken && existingWallet) {
        const signingId = await submitSigningRequest(deepLink, existingToken)
        if (signingId && !abortCtrl.signal.aborted) {
          lastSigningIdRef.current = signingId
          setState(prev => {
            if (!prev.isOpen) return prev
            return { ...prev, signingCode: signingId }
          })
          pendingRef.current = false
          return
        }
        // signingId is null → token rejected, fall through to fresh token flow
      }

      // 2. Fallback: create fresh token, show QR, wait for association
      const freshToken = await createFreshToken()
      if (!freshToken || abortCtrl.signal.aborted) {
        pendingRef.current = false
        return
      }

      // Show QR with fresh token
      setState(prev => {
        if (!prev.isOpen) return prev
        return { ...prev, connectToken: freshToken }
      })

      // Wait for user to authenticate in wallet app
      const walletAddress = await waitForAssociation(freshToken, abortCtrl.signal)
      if (!walletAddress || abortCtrl.signal.aborted) {
        pendingRef.current = false
        return
      }

      // User authenticated — submit signing request
      const signingId = await submitSigningRequest(deepLink, freshToken)
      if (signingId && !abortCtrl.signal.aborted) {
        lastSigningIdRef.current = signingId
        setState(prev => {
          if (!prev.isOpen) return prev
          return { ...prev, signingCode: signingId }
        })
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        console.error('[useTransaction] Failed to set up signing session:', err)
      }
    }

    pendingRef.current = false
  }, [createFreshToken, waitForAssociation, submitSigningRequest])

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
    checkTransaction?: () => Promise<{ success: boolean; txHash?: string; error?: string }>
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
      onSuccess: params.onSuccess,
      checkTransaction: params.checkTransaction
    })
  }, [address, openTransaction])

  // Send native AXM
  const sendAxm = useCallback((params: {
    recipient: string
    amount: string
    onSuccess?: (txHash: string) => void
    checkTransaction?: () => Promise<{ success: boolean; txHash?: string; error?: string }>
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
      onSuccess: params.onSuccess,
      checkTransaction: params.checkTransaction
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
