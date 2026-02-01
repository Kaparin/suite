// Axiome chain configuration
// Configure these via environment variables

export const AXIOME_CHAIN = {
  chainId: process.env.NEXT_PUBLIC_AXIOME_CHAIN_ID || 'axiome-1',
  chainName: 'Axiome',
  network: process.env.NEXT_PUBLIC_AXIOME_NETWORK || 'axiome-1',
  rpc: process.env.NEXT_PUBLIC_AXIOME_RPC,
  rest: process.env.NEXT_PUBLIC_AXIOME_REST,
  explorer: 'https://axiomechain.org',
  denom: 'uaxm',
  displayDenom: 'AXM',
  decimals: 6,
  addressPrefix: 'axm',

  // CosmWasm contract code IDs
  contracts: {
    cw20: 1,  // CW20 token contract (permission: Everybody)
  }
}
