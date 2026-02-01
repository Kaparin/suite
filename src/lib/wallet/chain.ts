// Axiome chain configuration
export const AXIOME_CHAIN = {
  chainId: 'axiome-1',
  chainName: 'Axiome',
  rpc: process.env.NEXT_PUBLIC_AXIOME_RPC || 'https://rpc.axiome.pro',
  rest: process.env.NEXT_PUBLIC_AXIOME_REST || 'https://rest.axiome.pro',
  denom: 'uaxm',
  displayDenom: 'AXM',
  decimals: 6,
  addressPrefix: 'axm',
}
