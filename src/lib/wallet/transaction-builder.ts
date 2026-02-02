// Transaction builder for Axiome blockchain
// Creates transaction payloads for signing via Axiome Connect
// Uses Axiome Connect native format (not Cosmos SDK proto)

export interface AxiomeConnectFunds {
  denom: string
  amount: string
}

// CW20 token instantiation message format
export interface CW20InstantiateMsg {
  name: string
  symbol: string
  decimals: number
  initial_balances: Array<{
    address: string
    amount: string
  }>
  mint?: {
    minter: string
    cap?: string
  }
  marketing?: {
    project?: string
    description?: string
    marketing?: string
    logo?: {
      url: string
    }
  }
}

// Axiome Connect payload types
export type AxiomeConnectType =
  | 'cosmwasm_execute'
  | 'cosmwasm_instantiate'
  | 'bank_send'

// Base payload structure for Axiome Connect
export interface AxiomeConnectPayload {
  type: AxiomeConnectType
  network: string
  memo?: string
}

// CosmWasm Execute payload
export interface CosmWasmExecutePayload extends AxiomeConnectPayload {
  type: 'cosmwasm_execute'
  contract_addr: string
  msg: Record<string, unknown>
  funds?: AxiomeConnectFunds[]
}

// CosmWasm Instantiate payload
export interface CosmWasmInstantiatePayload extends AxiomeConnectPayload {
  type: 'cosmwasm_instantiate'
  code_id: string
  label: string
  msg: CW20InstantiateMsg | Record<string, unknown>
  funds?: AxiomeConnectFunds[]
  admin?: string
}

// Bank Send payload
export interface BankSendPayload extends AxiomeConnectPayload {
  type: 'bank_send'
  to_address: string
  amount: AxiomeConnectFunds[]
}

// Union type for all payloads
export type TransactionPayload = CosmWasmExecutePayload | CosmWasmInstantiatePayload | BankSendPayload

// Legacy types for compatibility
export interface CosmosMessage {
  typeUrl: string
  value: Record<string, unknown>
}

// Get network name
function getNetwork(): string {
  return process.env.NEXT_PUBLIC_AXIOME_NETWORK || 'axiome-1'
}

// Encode payload to base64
// For non-ASCII characters, uses encodeURIComponent trick
function encodePayloadToBase64(payload: TransactionPayload): string {
  const jsonPayload = JSON.stringify(payload)
  if (typeof window !== 'undefined') {
    // Check if string contains non-ASCII characters
    const hasNonAscii = /[^\x00-\x7F]/.test(jsonPayload)
    if (hasNonAscii) {
      // UTF-8 encode for non-ASCII
      return btoa(unescape(encodeURIComponent(jsonPayload)))
    }
    // Standard btoa for ASCII-only
    return btoa(jsonPayload)
  } else {
    return Buffer.from(jsonPayload, 'utf-8').toString('base64')
  }
}

// Build deep link for Axiome Connect
// Format: axiomesign://<base64-encoded-json>
export function buildAxiomeSignLink(payload: TransactionPayload): string {
  const base64Payload = encodePayloadToBase64(payload)
  return `axiomesign://${base64Payload}`
}

// Build web link that redirects to wallet
// Format: https://yourdomain.com/sign/<base64-encoded-json>
export function buildAxiomeSignWebLink(payload: TransactionPayload): string {
  const base64Payload = encodePayloadToBase64(payload)
  // Use current origin or fallback
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/sign/${base64Payload}`
}

// Build CW20 token instantiation transaction
export function buildCW20InstantiatePayload(params: {
  codeId: number
  sender: string
  name: string
  symbol: string
  decimals?: number
  initialSupply: string
  enableMint?: boolean
  label?: string
  logoUrl?: string
  projectUrl?: string
  description?: string
}): CosmWasmInstantiatePayload {
  const {
    codeId,
    sender,
    name,
    symbol,
    decimals = 6,
    initialSupply,
    enableMint = false,
    label
  } = params

  const instantiateMsg: CW20InstantiateMsg = {
    name,
    symbol,
    decimals,
    initial_balances: [
      {
        address: sender,
        amount: initialSupply
      }
    ]
  }

  if (enableMint) {
    instantiateMsg.mint = {
      minter: sender
    }
  }

  // Minimal payload for QR code
  const payload: CosmWasmInstantiatePayload = {
    type: 'cosmwasm_instantiate',
    network: getNetwork(),
    code_id: codeId.toString(),
    label: label || symbol,
    msg: instantiateMsg,
    admin: sender
  }

  return payload
}

// Alternative: Build using Cosmos SDK message format (if wallet requires it)
export function buildCW20InstantiateCosmosPayload(params: {
  codeId: number
  sender: string
  name: string
  symbol: string
  decimals?: number
  initialSupply: string
  enableMint?: boolean
  label?: string
}): Record<string, unknown> {
  const {
    codeId,
    sender,
    name,
    symbol,
    decimals = 6,
    initialSupply,
    enableMint = false,
    label
  } = params

  const instantiateMsg = {
    name,
    symbol,
    decimals,
    initial_balances: [{ address: sender, amount: initialSupply }],
    ...(enableMint ? { mint: { minter: sender } } : {})
  }

  // Cosmos SDK format with typeUrl
  return {
    messages: [
      {
        typeUrl: '/cosmwasm.wasm.v1.MsgInstantiateContract',
        value: {
          sender,
          codeId: codeId.toString(),
          label: label || symbol,
          msg: instantiateMsg,
          funds: [],
          admin: sender
        }
      }
    ],
    memo: ''
  }
}

// Build CW20 transfer transaction
export function buildCW20TransferPayload(params: {
  contractAddress: string
  sender: string  // Not used in payload
  recipient: string
  amount: string
  memo?: string
}): CosmWasmExecutePayload {
  const { contractAddress, recipient, amount, memo } = params

  return {
    type: 'cosmwasm_execute',
    network: getNetwork(),
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
}

// Build native token send transaction
export function buildSendPayload(params: {
  sender: string  // Not used in payload, wallet adds it
  recipient: string
  amount: string
  denom?: string
  memo?: string
}): BankSendPayload {
  const { recipient, amount, denom = 'uaxm', memo } = params

  return {
    type: 'bank_send',
    network: getNetwork(),
    to_address: recipient,
    amount: [
      {
        denom,
        amount
      }
    ],
    memo
  }
}

// Build CW20 update marketing info transaction
export function buildUpdateMarketingPayload(params: {
  contractAddress: string
  sender: string  // Not used in payload
  project?: string
  description?: string
  marketing?: string
}): CosmWasmExecutePayload {
  const { contractAddress, project, description, marketing } = params

  return {
    type: 'cosmwasm_execute',
    network: getNetwork(),
    contract_addr: contractAddress,
    msg: {
      update_marketing: {
        project,
        description,
        marketing
      }
    },
    funds: []
  }
}

// Build generic CosmWasm execute transaction
export function buildExecutePayload(params: {
  contractAddress: string
  sender: string  // Not used in payload
  msg: Record<string, unknown>
  funds?: AxiomeConnectFunds[]
  memo?: string
}): CosmWasmExecutePayload {
  const { contractAddress, msg, funds, memo } = params

  return {
    type: 'cosmwasm_execute',
    network: getNetwork(),
    contract_addr: contractAddress,
    msg,
    funds: funds || [],
    memo
  }
}
