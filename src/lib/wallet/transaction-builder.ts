// Transaction builder for Axiome blockchain
// Creates transaction payloads for signing via Axiome Connect
// Uses Cosmos SDK proto format with typeUrl

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
    amount: AxiomeConnectFunds[]
    gas: string
  }
}

// Default fee for transactions
const DEFAULT_FEE = {
  amount: [{ denom: 'uaxm', amount: '5000' }],
  gas: '200000'
}

// Build deep link for Axiome Connect
// Format: axiomesign://<base64-encoded-json>
export function buildAxiomeSignLink(payload: TransactionPayload): string {
  const jsonPayload = JSON.stringify(payload)
  // Use btoa for browser compatibility, Buffer for Node
  const base64Payload = typeof window !== 'undefined'
    ? btoa(jsonPayload)
    : Buffer.from(jsonPayload).toString('base64')
  return `axiomesign://${base64Payload}`
}

// Get chain ID
function getChainId(): string {
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
}): TransactionPayload {
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
    chainId: getChainId(),
    msgs: [
      {
        typeUrl: '/cosmwasm.wasm.v1.MsgInstantiateContract',
        value: {
          sender,
          codeId: codeId.toString(),
          label: label || `${symbol} Token`,
          msg: instantiateMsg,
          funds: [],
          admin: sender
        }
      }
    ],
    memo: `Create ${symbol} token via Axiome Launch Suite`,
    fee: DEFAULT_FEE
  }
}

// Build CW20 transfer transaction
export function buildCW20TransferPayload(params: {
  contractAddress: string
  sender: string
  recipient: string
  amount: string
  memo?: string
}): TransactionPayload {
  const { contractAddress, sender, recipient, amount, memo } = params

  return {
    chainId: getChainId(),
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
}

// Build native token send transaction
export function buildSendPayload(params: {
  sender: string
  recipient: string
  amount: string
  denom?: string
  memo?: string
}): TransactionPayload {
  const { sender, recipient, amount, denom = 'uaxm', memo } = params

  return {
    chainId: getChainId(),
    msgs: [
      {
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: {
          fromAddress: sender,
          toAddress: recipient,
          amount: [
            {
              denom,
              amount
            }
          ]
        }
      }
    ],
    memo,
    fee: DEFAULT_FEE
  }
}

// Build CW20 update marketing info transaction
export function buildUpdateMarketingPayload(params: {
  contractAddress: string
  sender: string
  project?: string
  description?: string
  marketing?: string
}): TransactionPayload {
  const { contractAddress, sender, project, description, marketing } = params

  return {
    chainId: getChainId(),
    msgs: [
      {
        typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
        value: {
          sender,
          contract: contractAddress,
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
    ],
    fee: DEFAULT_FEE
  }
}

// Build generic CosmWasm execute transaction
export function buildExecutePayload(params: {
  contractAddress: string
  sender: string
  msg: Record<string, unknown>
  funds?: AxiomeConnectFunds[]
  memo?: string
}): TransactionPayload {
  const { contractAddress, sender, msg, funds, memo } = params

  return {
    chainId: getChainId(),
    msgs: [
      {
        typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
        value: {
          sender,
          contract: contractAddress,
          msg,
          funds: funds || []
        }
      }
    ],
    memo,
    fee: DEFAULT_FEE
  }
}
