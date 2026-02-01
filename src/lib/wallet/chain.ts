// Axiome chain configuration
// Configure these via environment variables

export const AXIOME_CHAIN = {
  chainId: process.env.NEXT_PUBLIC_AXIOME_CHAIN_ID || 'axiome-1',
  chainName: 'Axiome',
  rpc: process.env.NEXT_PUBLIC_AXIOME_RPC,
  rest: process.env.NEXT_PUBLIC_AXIOME_REST,
  explorer: 'https://axiomechain.org',
  denom: 'uaxm',
  displayDenom: 'AXM',
  decimals: 6,
  addressPrefix: 'axm',
}
