/**
 * Axiome Connect - Deep link transaction signing for Axiome Wallet
 *
 * Protocol: axiomesign://<base64-payload>
 *
 * Flow:
 * 1. Create JSON payload with Cosmos SDK proto format (typeUrl + value)
 * 2. Encode to Base64
 * 3. Create deep link with axiomesign:// prefix
 * 4. User opens in Axiome Wallet app
 * 5. User signs and submits transaction
 *
 * Note: This is for SIGNING transactions, not for wallet connection.
 * For connection, we use Keplr on desktop or manual address entry on mobile.
 */

import { AXIOME_CHAIN } from './chain'

// Cosmos SDK proto message format
export interface CosmosMsg {
  typeUrl: string
  value: Record<string, unknown>
}

// Full transaction payload for Axiome Connect
export interface TransactionPayload {
  chainId: string
  msgs: CosmosMsg[]
  memo?: string
  fee?: {
    amount: { denom: string; amount: string }[]
    gas: string
  }
}

// Default fee for transactions
const DEFAULT_FEE = {
  amount: [{ denom: 'uaxm', amount: '5000' }],
  gas: '200000'
}

/**
 * Create Axiome Connect deep link from payload
 */
export function createAxiomeConnectLink(payload: TransactionPayload): string {
  // Ensure chainId is set
  const fullPayload = {
    ...payload,
    chainId: payload.chainId || AXIOME_CHAIN.chainId,
    fee: payload.fee || DEFAULT_FEE
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
  sender: string
  name: string
  symbol: string
  decimals: number
  initialSupply: string
  memo?: string
}): string {
  const { codeId, sender, name, symbol, decimals, initialSupply, memo } = options

  const payload: TransactionPayload = {
    chainId: AXIOME_CHAIN.chainId,
    msgs: [
      {
        typeUrl: '/cosmwasm.wasm.v1.MsgInstantiateContract',
        value: {
          sender,
          codeId: codeId.toString(),
          label: `${symbol} Token`,
          msg: {
            name,
            symbol,
            decimals,
            initial_balances: [{ address: sender, amount: initialSupply }],
            mint: { minter: sender }
          },
          funds: [],
          admin: sender
        }
      }
    ],
    memo: memo || `Create ${symbol} token via Axiome Launch Suite`,
    fee: DEFAULT_FEE
  }

  return createAxiomeConnectLink(payload)
}

/**
 * Create deep link for sending tokens
 */
export function createSendTokensDeepLink(options: {
  fromAddress: string
  toAddress: string
  amount: string
  denom?: string
  memo?: string
}): string {
  const { fromAddress, toAddress, amount, denom = 'uaxm', memo } = options

  const payload: TransactionPayload = {
    chainId: AXIOME_CHAIN.chainId,
    msgs: [
      {
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: {
          fromAddress,
          toAddress,
          amount: [{ denom, amount }]
        }
      }
    ],
    memo,
    fee: DEFAULT_FEE
  }

  return createAxiomeConnectLink(payload)
}

/**
 * Create deep link for CW20 token transfer
 */
export function createCW20TransferDeepLink(options: {
  contractAddress: string
  sender: string
  recipient: string
  amount: string
  memo?: string
}): string {
  const { contractAddress, sender, recipient, amount, memo } = options

  const payload: TransactionPayload = {
    chainId: AXIOME_CHAIN.chainId,
    msgs: [
      {
        typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
        value: {
          sender,
          contract: contractAddress,
          msg: {
            transfer: {
              recipient,
              amount
            }
          },
          funds: []
        }
      }
    ],
    memo,
    fee: DEFAULT_FEE
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
