// Axiome Token Registry
// Known CW20 tokens on Axiome blockchain

export interface RegisteredToken {
  contractAddress: string
  symbol: string
  name: string
  decimals: number
  logoUrl?: string
  verified?: boolean
}

// Official/verified tokens
export const KNOWN_TOKENS: RegisteredToken[] = [
  {
    contractAddress: 'axm1etxtq3v4chzn7xrah3w6ukkxy7vlc889n5ervgxz425msar6ajzskdmm0v',
    symbol: 'AXP',
    name: 'Axiome Points',
    decimals: 6,
    verified: true
  },
  {
    contractAddress: 'axm1t3f4zxve6725sf4glrnlar8uku78j0nyfl0ppzgfju9ft9phvqwqfhrfg5',
    symbol: 'CHAPA',
    name: 'Chapa Token',
    decimals: 6,
    verified: true
  },
  {
    contractAddress: 'axm14rse3e7rkc3qt7drmlulwlkrlzqvh7hv277zv05kyfuwl74udx5sdlw02u',
    symbol: 'SIMBA',
    name: 'Simba Token',
    decimals: 6,
    verified: true
  },
  {
    contractAddress: 'axm18a0pvw326fydfdat5tzyf4t8lhz0v6fyfaujpeg07fwqkygcxejs0gqae4',
    symbol: 'ATT',
    name: 'ATT Token',
    decimals: 6,
    verified: true
  }
]

// Get token info from registry
export function getRegisteredToken(contractAddress: string): RegisteredToken | undefined {
  return KNOWN_TOKENS.find(t => t.contractAddress === contractAddress)
}

// Check if token is in registry
export function isRegisteredToken(contractAddress: string): boolean {
  return KNOWN_TOKENS.some(t => t.contractAddress === contractAddress)
}
