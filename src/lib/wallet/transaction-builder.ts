// Transaction builder for Axiome blockchain
// Creates transaction payloads for signing via Axiome Connect
// Based on official Axiome Connect documentation

// Axiome Connect payload types
export type AxiomeConnectType = 'cosmwasm_execute' | 'cosmwasm_instantiate' | 'bank_send'

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

// Base payload for Axiome Connect
export interface AxiomeConnectPayload {
  type: AxiomeConnectType
  network: string
  memo?: string
}

// CosmWasm Execute payload
export interface CosmWasmExecutePayload extends AxiomeConnectPayload {
  type: 'cosmwasm_execute'
  contract_addr: string
  funds?: AxiomeConnectFunds[]
  msg: Record<string, unknown>
}

// CosmWasm Instantiate payload
export interface CosmWasmInstantiatePayload extends AxiomeConnectPayload {
  type: 'cosmwasm_instantiate'
  code_id: number
  label: string
  funds?: AxiomeConnectFunds[]
  msg: CW20InstantiateMsg | Record<string, unknown>
  admin?: string
}

// Bank Send payload
export interface BankSendPayload extends AxiomeConnectPayload {
  type: 'bank_send'
  to_address: string
  amount: AxiomeConnectFunds[]
}

export type TransactionPayload = CosmWasmExecutePayload | CosmWasmInstantiatePayload | BankSendPayload

// Build deep link for Axiome Connect
// Format: axiomesign://<base64-encoded-json>
export function buildAxiomeSignLink(payload: TransactionPayload): string {
  const jsonPayload = JSON.stringify(payload)
  const base64Payload = Buffer.from(jsonPayload).toString('base64')
  return `axiomesign://${base64Payload}`
}

// Get network identifier
function getNetwork(): string {
  return process.env.NEXT_PUBLIC_AXIOME_NETWORK || 'axiome-1'
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
    label,
    logoUrl,
    projectUrl,
    description
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

  // Add marketing info if provided
  if (logoUrl || projectUrl || description) {
    instantiateMsg.marketing = {}
    if (projectUrl) instantiateMsg.marketing.project = projectUrl
    if (description) instantiateMsg.marketing.description = description
    if (sender) instantiateMsg.marketing.marketing = sender
    if (logoUrl) instantiateMsg.marketing.logo = { url: logoUrl }
  }

  return {
    type: 'cosmwasm_instantiate',
    network: getNetwork(),
    code_id: codeId,
    label: label || `${symbol} Token`,
    msg: instantiateMsg,
    admin: sender,
    memo: `Create ${symbol} token via Axiome Launch Suite`
  }
}

// Build CW20 transfer transaction
export function buildCW20TransferPayload(params: {
  contractAddress: string
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
    memo
  }
}

// Build native token send transaction
export function buildSendPayload(params: {
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
    }
  }
}

// Build generic CosmWasm execute transaction
export function buildExecutePayload(params: {
  contractAddress: string
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
    funds,
    memo
  }
}
