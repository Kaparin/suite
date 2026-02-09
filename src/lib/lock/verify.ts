import { axiomeClient } from '@/lib/axiome/client'
import { LAUNCH_CONTRACT, fromMicroAmount } from './constants'

/**
 * Verify that a wallet still holds at least `requiredAmount` of LAUNCH on-chain.
 * Returns the actual balance in human-readable LAUNCH.
 */
export async function verifyOnChainBalance(walletAddress: string): Promise<number> {
  const balanceMicro = await axiomeClient.getCW20Balance(LAUNCH_CONTRACT, walletAddress)
  return fromMicroAmount(balanceMicro)
}

/**
 * Check if wallet holds enough LAUNCH for the specified micro amount.
 */
export async function hasEnoughBalance(walletAddress: string, requiredMicroAmount: string): Promise<boolean> {
  const balanceMicro = await axiomeClient.getCW20Balance(LAUNCH_CONTRACT, walletAddress)
  return BigInt(balanceMicro) >= BigInt(requiredMicroAmount)
}
