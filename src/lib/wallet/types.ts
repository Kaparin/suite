export interface ChainInfo {
  chainId: string
  chainName: string
  rpc: string
  rest: string
  bip44: {
    coinType: number
  }
  bech32Config: {
    bech32PrefixAccAddr: string
    bech32PrefixAccPub: string
    bech32PrefixValAddr: string
    bech32PrefixValPub: string
    bech32PrefixConsAddr: string
    bech32PrefixConsPub: string
  }
  currencies: {
    coinDenom: string
    coinMinimalDenom: string
    coinDecimals: number
  }[]
  feeCurrencies: {
    coinDenom: string
    coinMinimalDenom: string
    coinDecimals: number
    gasPriceStep?: {
      low: number
      average: number
      high: number
    }
  }[]
  stakeCurrency: {
    coinDenom: string
    coinMinimalDenom: string
    coinDecimals: number
  }
}

export interface WalletState {
  isConnected: boolean
  isConnecting: boolean
  address: string | null
  name: string | null
  error: string | null
}

export interface WalletContextType extends WalletState {
  connect: () => Promise<void>
  disconnect: () => void
}
