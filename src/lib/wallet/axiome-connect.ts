/**
 * Axiome Connect - Deep link transaction signing for Axiome Wallet
 *
 * Protocol: axiomesign://<base64-payload>
 *
 * Flow:
 * 1. Create JSON payload with Axiome Connect format
 * 2. Encode to Base64
 * 3. Create deep link with axiomesign:// prefix
 * 4. User opens in Axiome Wallet app
 * 5. User signs and submits transaction
 *
 * Payload format (from official docs):
 * {
 *   "type": "cosmwasm_execute" | "cosmwasm_instantiate" | "bank_send",
 *   "network": "axiome-1",
 *   "contract_addr": "...",  // for execute
 *   "to_address": "...",     // for bank_send
 *   "msg": {...},
 *   "funds": [...],
 *   "memo": "..."
 * }
 *
 * Note: This is for SIGNING transactions, not for wallet connection.
 * The wallet automatically adds the sender address from the connected account.
 */

import { AXIOME_CHAIN } from './chain'

// Re-export types from transaction-builder for backwards compatibility
export type {
  AxiomeConnectFunds,
  TransactionPayload,
  CosmWasmExecutePayload,
  CosmWasmInstantiatePayload,
  BankSendPayload,
} from './transaction-builder'

import type { TransactionPayload, AxiomeConnectFunds } from './transaction-builder'

/**
 * Create Axiome Connect deep link from payload
 */
export function createAxiomeConnectLink(payload: TransactionPayload): string {
  // Encode to Base64 with UTF-8 support
  const jsonString = JSON.stringify(payload)
  const encoder = new TextEncoder()
  const bytes = encoder.encode(jsonString)
  const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('')
  const base64 = btoa(binaryString)

  return `axiomesign://${base64}`
}

/**
 * Create deep link for token creation (CosmWasm instantiate)
 */
export function createTokenDeepLink(options: {
  codeId: number
  sender: string  // Used only for initial_balances
  name: string
  symbol: string
  decimals: number
  initialSupply: string
  memo?: string
}): string {
  const { codeId, sender, name, symbol, decimals, initialSupply, memo } = options

  const payload: TransactionPayload = {
    type: 'cosmwasm_instantiate',
    network: AXIOME_CHAIN.chainId,
    code_id: codeId.toString(),
    label: `${symbol} Token`,
    msg: {
      name,
      symbol,
      decimals,
      initial_balances: [{ address: sender, amount: initialSupply }],
      mint: { minter: sender }
    },
    funds: [],
    admin: sender,
    memo: memo || `Create ${symbol} token via Axiome Launch Suite`
  }

  return createAxiomeConnectLink(payload)
}

/**
 * Create deep link for sending native tokens (bank send)
 */
export function createSendTokensDeepLink(options: {
  fromAddress: string  // Not used - wallet adds it
  toAddress: string
  amount: string
  denom?: string
  memo?: string
}): string {
  const { toAddress, amount, denom = 'uaxm', memo } = options

  const payload: TransactionPayload = {
    type: 'bank_send',
    network: AXIOME_CHAIN.chainId,
    to_address: toAddress,
    amount: [{ denom, amount }],
    memo
  }

  return createAxiomeConnectLink(payload)
}

/**
 * Create deep link for CW20 token transfer
 */
export function createCW20TransferDeepLink(options: {
  contractAddress: string
  sender: string  // Not used - wallet adds it
  recipient: string
  amount: string
  memo?: string
}): string {
  const { contractAddress, recipient, amount, memo } = options

  const payload: TransactionPayload = {
    type: 'cosmwasm_execute',
    network: AXIOME_CHAIN.chainId,
    contract_addr: contractAddress,
    msg: {
      transfer: {
        recipient,
        amount
      }
    },
    funds: [],
    memo
  }

  return createAxiomeConnectLink(payload)
}

/**
 * Validate Axiome address format
 */
export function isValidAxiomeAddress(address: string): boolean {
  // Axiome addresses start with 'axm' and are ~43 characters
  return /^axm[a-z0-9]{39}$/.test(address)
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, startChars = 8, endChars = 4): string {
  if (address.length <= startChars + endChars) return address
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

/**
 * Open Axiome Connect deep link
 * On mobile: Opens the wallet app
 * On desktop: Shows instructions to scan QR or use mobile
 */
export function openAxiomeConnect(deepLink: string): void {
  if (isMobileDevice()) {
    // On mobile, try to open the wallet app
    window.location.href = deepLink
  } else {
    // On desktop, open in new window (will likely fail, but user can copy the link)
    window.open(deepLink, '_blank')
  }
}

/**
 * Generate QR code data URL for a deep link
 * Note: Requires a QR code library - returns the data to encode
 */
export function getQRCodeData(deepLink: string): string {
  return deepLink
}

// App store links (verified)
export const AXIOME_WALLET_IOS = 'https://apps.apple.com/app/axiome-wallet/id6502285079'
export const AXIOME_WALLET_ANDROID = 'https://play.google.com/store/apps/details?id=club.relounge.axiomewallet'
export const AXIOME_WALLET_TESTFLIGHT = 'https://testflight.apple.com/join/Bjz0XZ5v'
