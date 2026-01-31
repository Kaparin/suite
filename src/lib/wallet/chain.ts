import type { ChainInfo } from './types'

export const AXIOME_CHAIN: ChainInfo = {
  chainId: 'axiome-1',
  chainName: 'Axiome',
  rpc: process.env.NEXT_PUBLIC_AXIOME_RPC || 'https://rpc.axiome.pro',
  rest: process.env.NEXT_PUBLIC_AXIOME_REST || 'https://rest.axiome.pro',
  bip44: {
    coinType: 118,
  },
  bech32Config: {
    bech32PrefixAccAddr: 'axm',
    bech32PrefixAccPub: 'axmpub',
    bech32PrefixValAddr: 'axmvaloper',
    bech32PrefixValPub: 'axmvaloperpub',
    bech32PrefixConsAddr: 'axmvalcons',
    bech32PrefixConsPub: 'axmvalconspub',
  },
  currencies: [
    {
      coinDenom: 'AXM',
      coinMinimalDenom: 'uaxm',
      coinDecimals: 6,
    },
  ],
  feeCurrencies: [
    {
      coinDenom: 'AXM',
      coinMinimalDenom: 'uaxm',
      coinDecimals: 6,
      gasPriceStep: {
        low: 0.01,
        average: 0.025,
        high: 0.04,
      },
    },
  ],
  stakeCurrency: {
    coinDenom: 'AXM',
    coinMinimalDenom: 'uaxm',
    coinDecimals: 6,
  },
}
