// Transaction builder for Axiome blockchain
// Creates transaction payloads for signing via Axiome Connect

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
}

export interface TransactionPayload {
  chainId: string
  msgs: Array<{
    typeUrl: string
    value: unknown
  }>
  memo?: string
}

// Build deep link for Axiome Connect
export function buildAxiomeSignLink(payload: TransactionPayload): string {
  const jsonPayload = JSON.stringify(payload)
  const base64Payload = Buffer.from(jsonPayload).toString('base64')
  return `axiomesign://sign?payload=${encodeURIComponent(base64Payload)}`
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
}): TransactionPayload {
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

  return {
    chainId: process.env.NEXT_PUBLIC_AXIOME_CHAIN_ID || 'axiome-1',
    msgs: [
      {
        typeUrl: '/cosmwasm.wasm.v1.MsgInstantiateContract',
        value: {
          sender,
          codeId: codeId.toString(),
          label: label || `${symbol} Token`,
          msg: instantiateMsg,
          funds: []
        }
      }
    ],
    memo: `Create ${symbol} token via Axiome Launch Suite`
  }
}

// Build CW20 transfer transaction
export function buildCW20TransferPayload(params: {
  contractAddress: string
  sender: string
  recipient: string
  amount: string
}): TransactionPayload {
  const { contractAddress, sender, recipient, amount } = params

  return {
    chainId: process.env.NEXT_PUBLIC_AXIOME_CHAIN_ID || 'axiome-1',
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
    ]
  }
}

// Build native token send transaction
export function buildSendPayload(params: {
  sender: string
  recipient: string
  amount: string
  denom?: string
}): TransactionPayload {
  const { sender, recipient, amount, denom = 'uaxm' } = params

  return {
    chainId: process.env.NEXT_PUBLIC_AXIOME_CHAIN_ID || 'axiome-1',
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
    ]
  }
}
