import { NextRequest, NextResponse } from 'next/server'

const REST_URL = process.env.AXIOME_REST_URL

type TransactionType = 'send' | 'receive' | 'contract' | 'instantiate' | 'delegate' | 'undelegate'

interface Transaction {
  hash: string
  height: number
  timestamp: string
  type: TransactionType
  status: 'success' | 'failed'
  from: string
  to: string
  amount: {
    value: string
    denom: string
    displayValue: string
    displayDenom: string
  }
  fee: {
    value: string
    displayValue: string
  }
  memo?: string
  contractAddress?: string
  contractAction?: string
  tokenSymbol?: string
}

// Cache for token info to avoid repeated queries
const tokenInfoCache = new Map<string, { name: string; symbol: string; decimals: number } | null>()

async function getTokenInfo(contractAddress: string): Promise<{ name: string; symbol: string; decimals: number } | null> {
  if (tokenInfoCache.has(contractAddress)) {
    return tokenInfoCache.get(contractAddress) || null
  }

  try {
    const query = Buffer.from(JSON.stringify({ token_info: {} })).toString('base64')
    const response = await fetch(
      `${REST_URL}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    )

    if (response.ok) {
      const data = await response.json()
      if (data.data) {
        // data.data can be either a base64 string OR already parsed object
        let tokenInfo: { name?: string; symbol?: string; decimals?: number }
        if (typeof data.data === 'string') {
          tokenInfo = JSON.parse(Buffer.from(data.data, 'base64').toString())
        } else {
          tokenInfo = data.data
        }
        const result = {
          name: tokenInfo.name || 'Unknown',
          symbol: tokenInfo.symbol || 'TOKEN',
          decimals: tokenInfo.decimals || 6
        }
        tokenInfoCache.set(contractAddress, result)
        return result
      }
    }
  } catch {
    // Ignore errors
  }

  tokenInfoCache.set(contractAddress, null)
  return null
}

function formatAmount(amount: string, decimals: number = 6): string {
  const value = parseInt(amount || '0')
  const divisor = Math.pow(10, decimals)
  return (value / divisor).toFixed(Math.min(decimals, 6))
}

interface TxResponse {
  txhash: string
  height: string
  timestamp: string
  code?: number
  tx?: {
    body?: {
      messages?: Array<{
        '@type': string
        from_address?: string
        to_address?: string
        amount?: Array<{ denom: string; amount: string }> | { denom: string; amount: string }
        sender?: string
        contract?: string
        msg?: unknown
        delegator_address?: string
        validator_address?: string
        code_id?: string
        label?: string
        admin?: string
      }>
      memo?: string
    }
    auth_info?: {
      fee?: {
        amount?: Array<{ amount: string }>
      }
    }
  }
  logs?: Array<{
    events?: Array<{
      type: string
      attributes?: Array<{ key: string; value: string }>
    }>
  }>
}

async function parseTransaction(rawTx: TxResponse, userAddress: string): Promise<Transaction | null> {
  try {
    const messages = rawTx.tx?.body?.messages || []
    const firstMsg = messages[0]

    if (!firstMsg) return null

    const msgType = firstMsg['@type']
    let type: TransactionType = 'contract'
    let from = ''
    let to = ''
    let amount = { value: '0', denom: 'uaxm', displayValue: '0', displayDenom: 'AXM' }
    let contractAction: string | undefined
    let tokenSymbol: string | undefined
    let contractAddress: string | undefined

    // Bank Send
    if (msgType === '/cosmos.bank.v1beta1.MsgSend') {
      from = firstMsg.from_address || ''
      to = firstMsg.to_address || ''
      const amountField = firstMsg.amount
      const amountData = Array.isArray(amountField) ? amountField[0] : amountField

      if (amountData) {
        amount = {
          value: amountData.amount,
          denom: amountData.denom,
          displayValue: formatAmount(amountData.amount, 6),
          displayDenom: amountData.denom === 'uaxm' ? 'AXM' : amountData.denom
        }
      }

      type = from.toLowerCase() === userAddress.toLowerCase() ? 'send' : 'receive'
    }
    // CosmWasm Execute
    else if (msgType === '/cosmwasm.wasm.v1.MsgExecuteContract') {
      from = firstMsg.sender || ''
      contractAddress = firstMsg.contract || ''
      to = contractAddress
      type = 'contract'

      const msg = firstMsg.msg as Record<string, unknown> | undefined

      if (msg) {
        // Detect the action type
        const actionKeys = Object.keys(msg)
        contractAction = actionKeys[0] || 'execute'

        // Handle CW20 transfer actions
        if ('transfer' in msg) {
          const transfer = msg.transfer as { recipient?: string; amount?: string }
          contractAction = 'transfer'
          to = transfer.recipient || contractAddress

          // Get token info
          const tokenInfo = await getTokenInfo(contractAddress)
          if (tokenInfo && transfer.amount) {
            tokenSymbol = tokenInfo.symbol
            amount = {
              value: transfer.amount,
              denom: contractAddress,
              displayValue: formatAmount(transfer.amount, tokenInfo.decimals),
              displayDenom: tokenInfo.symbol
            }
          }
        }
        // Handle CW20 send (transfer with callback)
        else if ('send' in msg) {
          const send = msg.send as { contract?: string; amount?: string }
          contractAction = 'send'
          to = send.contract || contractAddress

          const tokenInfo = await getTokenInfo(contractAddress)
          if (tokenInfo && send.amount) {
            tokenSymbol = tokenInfo.symbol
            amount = {
              value: send.amount,
              denom: contractAddress,
              displayValue: formatAmount(send.amount, tokenInfo.decimals),
              displayDenom: tokenInfo.symbol
            }
          }
        }
        // Handle mint
        else if ('mint' in msg) {
          const mint = msg.mint as { recipient?: string; amount?: string }
          contractAction = 'mint'
          to = mint.recipient || from

          const tokenInfo = await getTokenInfo(contractAddress)
          if (tokenInfo && mint.amount) {
            tokenSymbol = tokenInfo.symbol
            amount = {
              value: mint.amount,
              denom: contractAddress,
              displayValue: formatAmount(mint.amount, tokenInfo.decimals),
              displayDenom: tokenInfo.symbol
            }
          }
        }
        // Handle burn
        else if ('burn' in msg) {
          const burn = msg.burn as { amount?: string }
          contractAction = 'burn'

          const tokenInfo = await getTokenInfo(contractAddress)
          if (tokenInfo && burn.amount) {
            tokenSymbol = tokenInfo.symbol
            amount = {
              value: burn.amount,
              denom: contractAddress,
              displayValue: formatAmount(burn.amount, tokenInfo.decimals),
              displayDenom: tokenInfo.symbol
            }
          }
        }
        // Other contract actions - try to get token info anyway
        else {
          const tokenInfo = await getTokenInfo(contractAddress)
          if (tokenInfo) {
            tokenSymbol = tokenInfo.symbol
          }
        }
      }
    }
    // CosmWasm Instantiate
    else if (msgType === '/cosmwasm.wasm.v1.MsgInstantiateContract') {
      from = firstMsg.sender || ''
      type = 'instantiate'
      contractAction = 'create'

      // Get contract address from logs
      const events = rawTx.logs?.[0]?.events || []
      const instantiateEvent = events.find(e => e.type === 'instantiate')
      const contractAttr = instantiateEvent?.attributes?.find(a => a.key === '_contract_address')
      contractAddress = contractAttr?.value || ''
      to = contractAddress

      // Try to get token info from instantiate msg
      const instantiateMsg = firstMsg.msg as { name?: string; symbol?: string } | undefined
      if (instantiateMsg?.symbol) {
        tokenSymbol = instantiateMsg.symbol
        amount = {
          value: '0',
          denom: contractAddress,
          displayValue: instantiateMsg.symbol,
          displayDenom: 'Token Created'
        }
      }
    }
    // Delegate (Staking)
    else if (msgType.includes('MsgDelegate') && !msgType.includes('Undelegate')) {
      from = firstMsg.delegator_address || ''
      to = firstMsg.validator_address || ''
      type = 'delegate'

      const amountData = firstMsg.amount as { denom: string; amount: string } | undefined
      if (amountData) {
        amount = {
          value: amountData.amount,
          denom: amountData.denom,
          displayValue: formatAmount(amountData.amount, 6),
          displayDenom: amountData.denom === 'uaxm' ? 'AXM' : amountData.denom
        }
      }
    }
    // Undelegate (Unstaking)
    else if (msgType.includes('MsgUndelegate')) {
      from = firstMsg.delegator_address || ''
      to = firstMsg.validator_address || ''
      type = 'undelegate'

      const amountData = firstMsg.amount as { denom: string; amount: string } | undefined
      if (amountData) {
        amount = {
          value: amountData.amount,
          denom: amountData.denom,
          displayValue: formatAmount(amountData.amount, 6),
          displayDenom: amountData.denom === 'uaxm' ? 'AXM' : amountData.denom
        }
      }
    }

    const feeAmount = rawTx.tx?.auth_info?.fee?.amount?.[0]?.amount || '0'

    return {
      hash: rawTx.txhash,
      height: parseInt(rawTx.height),
      timestamp: rawTx.timestamp,
      type,
      status: rawTx.code === 0 || rawTx.code === undefined ? 'success' : 'failed',
      from,
      to,
      amount,
      fee: {
        value: feeAmount,
        displayValue: formatAmount(feeAmount, 6)
      },
      memo: rawTx.tx?.body?.memo,
      contractAddress,
      contractAction,
      tokenSymbol
    }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const typeFilter = searchParams.get('type') || 'all'

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 })
  }

  if (!REST_URL) {
    return NextResponse.json({
      transactions: [],
      pagination: {
        page,
        limit,
        total: 0,
        hasMore: false
      }
    })
  }

  try {
    // Fetch transactions where address is sender
    const senderQuery = encodeURIComponent(`message.sender='${address}'`)
    const sentResponse = await fetch(
      `${REST_URL}/cosmos/tx/v1beta1/txs?query=${senderQuery}&pagination.limit=50&order_by=ORDER_BY_DESC`,
      { next: { revalidate: 30 } }
    )

    // Fetch transactions where address is recipient (bank transfers)
    const recipientQuery = encodeURIComponent(`transfer.recipient='${address}'`)
    const receivedResponse = await fetch(
      `${REST_URL}/cosmos/tx/v1beta1/txs?query=${recipientQuery}&pagination.limit=50&order_by=ORDER_BY_DESC`,
      { next: { revalidate: 30 } }
    )

    // Also fetch wasm execute transactions involving this address
    const wasmQuery = encodeURIComponent(`wasm._contract_address EXISTS AND message.sender='${address}'`)
    const wasmResponse = await fetch(
      `${REST_URL}/cosmos/tx/v1beta1/txs?query=${wasmQuery}&pagination.limit=50&order_by=ORDER_BY_DESC`,
      { next: { revalidate: 30 } }
    ).catch(() => null)

    const sentData = sentResponse.ok ? await sentResponse.json() : { tx_responses: [] }
    const receivedData = receivedResponse.ok ? await receivedResponse.json() : { tx_responses: [] }
    const wasmData = wasmResponse?.ok ? await wasmResponse.json() : { tx_responses: [] }

    const allRawTxs: TxResponse[] = [
      ...(sentData.tx_responses || []),
      ...(receivedData.tx_responses || []),
      ...(wasmData.tx_responses || [])
    ]

    // Deduplicate by hash
    const uniqueTxs = allRawTxs.filter((tx, index, self) =>
      index === self.findIndex(t => t.txhash === tx.txhash)
    )

    // Parse transactions (with async token info fetching)
    const parsed = await Promise.all(
      uniqueTxs.map(tx => parseTransaction(tx, address))
    )

    const validTxs = parsed.filter((tx): tx is Transaction => tx !== null)

    // Sort by height descending
    validTxs.sort((a, b) => b.height - a.height)

    // Filter by type if specified
    const filtered = typeFilter === 'all'
      ? validTxs
      : validTxs.filter(tx => tx.type === typeFilter)

    // Paginate
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedTxs = filtered.slice(startIndex, endIndex)

    return NextResponse.json({
      transactions: paginatedTxs,
      pagination: {
        page,
        limit,
        total: filtered.length,
        hasMore: endIndex < filtered.length
      }
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)

    return NextResponse.json({
      transactions: [],
      pagination: {
        page,
        limit,
        total: 0,
        hasMore: false
      }
    })
  }
}
