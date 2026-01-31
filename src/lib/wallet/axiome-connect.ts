/**
 * Axiome Connect - Deep link transaction signing for Axiome Wallet
 *
 * Protocol: axiomesign://<base64-payload>
 *
 * Flow:
 * 1. Create JSON payload describing the transaction
 * 2. Encode to Base64
 * 3. Create deep link with axiomesign:// prefix
 * 4. User opens in Axiome Wallet app
 * 5. User signs and submits transaction
 *
 * Note: This is for SIGNING transactions, not for wallet connection.
 * For connection, we use Keplr on desktop or manual address entry on mobile.
 */

import { AXIOME_CHAIN } from './chain'

// Transaction types
export type AxiomeConnectPayload =
  | CosmWasmExecutePayload
  | BankSendPayload
  | CustomPayload

export interface CosmWasmExecutePayload {
  type: 'cosmwasm_execute'
  network: string
  contract_addr: string
  msg: object
  funds?: { denom: string; amount: string }[]
  memo?: string
}

export interface BankSendPayload {
  type: 'bank_send'
  network: string
  to_address: string
  amount: { denom: string; amount: string }[]
  memo?: string
}

export interface CustomPayload {
  type: string
  network: string
  [key: string]: unknown
}

/**
 * Create Axiome Connect deep link from payload
 */
export function createAxiomeConnectLink(payload: AxiomeConnectPayload): string {
  // Ensure network is set
  const fullPayload = {
    ...payload,
    network: payload.network || AXIOME_CHAIN.chainId,
  }

  // Encode to Base64
  const jsonString = JSON.stringify(fullPayload)
  const base64 = btoa(jsonString)

  return `axiomesign://${base64}`
}

/**
 * Create deep link for token creation (CosmWasm instantiate)
 */
export function createTokenDeepLink(options: {
  codeId: number
  name: string
  symbol: string
  decimals: number
  initialSupply: string
  admin?: string
  memo?: string
}): string {
  const { codeId, name, symbol, decimals, initialSupply, admin, memo } = options

  const payload: CustomPayload = {
    type: 'cosmwasm_instantiate',
    network: AXIOME_CHAIN.chainId,
    code_id: codeId,
    label: `${symbol} Token`,
    msg: {
      name,
      symbol,
      decimals,
      initial_balances: admin ? [{ address: admin, amount: initialSupply }] : [],
      mint: admin ? { minter: admin } : undefined,
    },
    funds: [],
    memo: memo || `Create ${symbol} token via Axiome Launch Suite`,
  }

  return createAxiomeConnectLink(payload as AxiomeConnectPayload)
}

/**
 * Create deep link for sending tokens
 */
export function createSendTokensDeepLink(options: {
  toAddress: string
  amount: string
  denom?: string
  memo?: string
}): string {
  const { toAddress, amount, denom = 'uaxm', memo } = options

  const payload: BankSendPayload = {
    type: 'bank_send',
    network: AXIOME_CHAIN.chainId,
    to_address: toAddress,
    amount: [{ denom, amount }],
    memo,
  }

  return createAxiomeConnectLink(payload)
}

/**
 * Create deep link for CW20 token transfer
 */
export function createCW20TransferDeepLink(options: {
  contractAddress: string
  recipient: string
  amount: string
  memo?: string
}): string {
  const { contractAddress, recipient, amount, memo } = options

  const payload: CosmWasmExecutePayload = {
    type: 'cosmwasm_execute',
    network: AXIOME_CHAIN.chainId,
    contract_addr: contractAddress,
    msg: {
      transfer: {
        recipient,
        amount,
      },
    },
    memo,
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

// App store links
export const AXIOME_WALLET_IOS = 'https://apps.apple.com/app/axiome-wallet/id6449446721'
export const AXIOME_WALLET_ANDROID = 'https://play.google.com/store/apps/details?id=club.relounge.axiomewallet'
export const AXIOME_WALLET_TESTFLIGHT = 'https://testflight.apple.com/join/AxiomeWallet'
