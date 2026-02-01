import { NextRequest, NextResponse } from 'next/server'

const REST_URL = process.env.AXIOME_REST_URL

type TransactionType = 'send' | 'receive' | 'contract' | 'instantiate'

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
}

function formatAmount(amount: string, denom: string): { displayValue: string; displayDenom: string } {
  const value = parseInt(amount || '0')

  if (denom === 'uaxm') {
    return {
      displayValue: (value / 1_000_000).toFixed(6),
      displayDenom: 'AXM'
    }
  }

  return {
    displayValue: amount,
    displayDenom: denom
  }
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
        amount?: Array<{ denom: string; amount: string }>
        sender?: string
        contract?: string
        msg?: unknown
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

function parseTransaction(rawTx: TxResponse, userAddress: string): Transaction | null {
  try {
    const messages = rawTx.tx?.body?.messages || []
    const firstMsg = messages[0]

    if (!firstMsg) return null

    const msgType = firstMsg['@type']
    let type: TransactionType = 'contract'
    let from = ''
    let to = ''
    let amount = { value: '0', denom: 'uaxm', displayValue: '0', displayDenom: 'AXM' }

    // Bank Send
    if (msgType === '/cosmos.bank.v1beta1.MsgSend') {
      from = firstMsg.from_address || ''
      to = firstMsg.to_address || ''
      const amountData = firstMsg.amount?.[0]

      if (amountData) {
        const formatted = formatAmount(amountData.amount, amountData.denom)
        amount = {
          value: amountData.amount,
          denom: amountData.denom,
          ...formatted
        }
      }

      type = from.toLowerCase() === userAddress.toLowerCase() ? 'send' : 'receive'
    }
    // CosmWasm Execute
    else if (msgType === '/cosmwasm.wasm.v1.MsgExecuteContract') {
      from = firstMsg.sender || ''
      to = firstMsg.contract || ''
      type = 'contract'

      // Try to parse CW20 transfer
      const msg = firstMsg.msg as Record<string, unknown> | undefined
      if (msg && 'transfer' in msg) {
        const transfer = msg.transfer as { recipient?: string; amount?: string }
        to = transfer.recipient || to
        if (transfer.amount) {
          amount = {
            value: transfer.amount,
            denom: 'cw20',
            displayValue: (parseInt(transfer.amount) / 1_000_000).toFixed(6),
            displayDenom: 'CW20'
          }
        }
      }
    }
    // CosmWasm Instantiate
    else if (msgType === '/cosmwasm.wasm.v1.MsgInstantiateContract') {
      from = firstMsg.sender || ''
      type = 'instantiate'

      // Get contract address from logs
      const events = rawTx.logs?.[0]?.events || []
      const instantiateEvent = events.find(e => e.type === 'instantiate')
      const contractAttr = instantiateEvent?.attributes?.find(a => a.key === '_contract_address')
      to = contractAttr?.value || ''
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
        displayValue: (parseInt(feeAmount) / 1_000_000).toFixed(6)
      },
      memo: rawTx.tx?.body?.memo,
      contractAddress: type === 'contract' || type === 'instantiate' ? to : undefined
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
    const sentResponse = await fetch(
      `${REST_URL}/cosmos/tx/v1beta1/txs?events=message.sender='${address}'&pagination.limit=50&order_by=ORDER_BY_DESC`,
      { next: { revalidate: 30 } }
    )

    // Fetch transactions where address is recipient (bank transfers)
    const receivedResponse = await fetch(
      `${REST_URL}/cosmos/tx/v1beta1/txs?events=transfer.recipient='${address}'&pagination.limit=50&order_by=ORDER_BY_DESC`,
      { next: { revalidate: 30 } }
    )

    const sentData = sentResponse.ok ? await sentResponse.json() : { tx_responses: [] }
    const receivedData = receivedResponse.ok ? await receivedResponse.json() : { tx_responses: [] }

    const allRawTxs: TxResponse[] = [
      ...(sentData.tx_responses || []),
      ...(receivedData.tx_responses || [])
    ]

    // Deduplicate by hash
    const uniqueTxs = allRawTxs.filter((tx, index, self) =>
      index === self.findIndex(t => t.txhash === tx.txhash)
    )

    // Parse transactions
    const parsed = uniqueTxs
      .map(tx => parseTransaction(tx, address))
      .filter((tx): tx is Transaction => tx !== null)

    // Sort by height descending
    parsed.sort((a, b) => b.height - a.height)

    // Filter by type if specified
    const filtered = typeFilter === 'all'
      ? parsed
      : parsed.filter(tx => tx.type === typeFilter)

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
