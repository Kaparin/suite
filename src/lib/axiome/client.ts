// Axiome blockchain client using public REST API
// Configure AXIOME_REST_URL environment variable with your node's REST endpoint

const REST_URL = process.env.AXIOME_REST_URL

if (!REST_URL) {
  console.warn('AXIOME_REST_URL not configured - blockchain features will be unavailable')
}

export interface TokenInfo {
  address: string
  name: string
  symbol: string
  decimals: number
  totalSupply: string
}

export interface AccountBalance {
  denom: string
  amount: string
}

export interface Transaction {
  hash: string
  height: number
  timestamp: string
  from: string
  to: string
  amount: string
}

class AxiomeClient {
  private baseUrl: string | undefined

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || REST_URL
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    if (!this.baseUrl) {
      throw new Error('AXIOME_REST_URL not configured')
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Get account balances
  async getBalances(address: string): Promise<AccountBalance[]> {
    try {
      const data = await this.fetch<{ balances: AccountBalance[] }>(
        `/cosmos/bank/v1beta1/balances/${address}`
      )
      return data.balances || []
    } catch (error) {
      console.error('Error fetching balances:', error)
      return []
    }
  }

  // Get latest block
  async getLatestBlock(): Promise<{ height: number; time: string }> {
    try {
      const data = await this.fetch<{
        block: { header: { height: string; time: string } }
      }>('/cosmos/base/tendermint/v1beta1/blocks/latest')

      return {
        height: parseInt(data.block.header.height),
        time: data.block.header.time
      }
    } catch (error) {
      console.error('Error fetching latest block:', error)
      return { height: 0, time: '' }
    }
  }

  // Get transactions for address
  async getTransactions(address: string, limit: number = 50): Promise<Transaction[]> {
    try {
      // Query transactions where address is sender or recipient
      const [sentData, receivedData] = await Promise.all([
        this.fetch<{ tx_responses?: Array<{ txhash: string; height: string; timestamp: string }> }>(
          `/cosmos/tx/v1beta1/txs?events=message.sender='${address}'&pagination.limit=${limit}`
        ),
        this.fetch<{ tx_responses?: Array<{ txhash: string; height: string; timestamp: string }> }>(
          `/cosmos/tx/v1beta1/txs?events=transfer.recipient='${address}'&pagination.limit=${limit}`
        )
      ])

      const sent = sentData.tx_responses || []
      const received = receivedData.tx_responses || []

      // Combine and deduplicate
      const allTxs = [...sent, ...received]
      const uniqueTxs = allTxs.filter((tx, index, self) =>
        index === self.findIndex(t => t.txhash === tx.txhash)
      )

      return uniqueTxs.map(tx => ({
        hash: tx.txhash,
        height: parseInt(tx.height),
        timestamp: tx.timestamp,
        from: '',
        to: '',
        amount: ''
      }))
    } catch (error) {
      console.error('Error fetching transactions:', error)
      return []
    }
  }

  // Get CW20 token info
  async getCW20TokenInfo(contractAddress: string): Promise<TokenInfo | null> {
    try {
      // Query smart contract for token info
      const query = Buffer.from(JSON.stringify({ token_info: {} })).toString('base64')
      const data = await this.fetch<{ data: string }>(
        `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`
      )

      if (data.data) {
        const tokenInfo = JSON.parse(Buffer.from(data.data, 'base64').toString())
        return {
          address: contractAddress,
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          decimals: tokenInfo.decimals,
          totalSupply: tokenInfo.total_supply
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching CW20 token info:', error)
      return null
    }
  }

  // Get CW20 token balance for address
  async getCW20Balance(contractAddress: string, walletAddress: string): Promise<string> {
    try {
      const query = Buffer.from(JSON.stringify({ balance: { address: walletAddress } })).toString('base64')
      const data = await this.fetch<{ data: string }>(
        `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`
      )

      if (data.data) {
        const result = JSON.parse(Buffer.from(data.data, 'base64').toString())
        return result.balance || '0'
      }
      return '0'
    } catch (error) {
      console.error('Error fetching CW20 balance:', error)
      return '0'
    }
  }

  // Get all holders of a CW20 token (simplified - real impl would need indexer)
  async getCW20HolderCount(contractAddress: string): Promise<number> {
    // This is a placeholder - real implementation would need an indexer
    // or iterate through all token transfers
    try {
      // Try to get from contract state if available
      const query = Buffer.from(JSON.stringify({ all_accounts: { limit: 1 } })).toString('base64')
      const data = await this.fetch<{ data: string }>(
        `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`
      )

      if (data.data) {
        const result = JSON.parse(Buffer.from(data.data, 'base64').toString())
        return result.accounts?.length || 0
      }
      return 0
    } catch {
      return 0
    }
  }

  // Check if API is healthy
  async healthCheck(): Promise<boolean> {
    try {
      await this.getLatestBlock()
      return true
    } catch {
      return false
    }
  }
}

export const axiomeClient = new AxiomeClient()
