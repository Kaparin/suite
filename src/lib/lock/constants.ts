import type { LockTier } from '@prisma/client'

// LAUNCH token contract on Axiome
export const LAUNCH_CONTRACT = 'axm1zvjnc08uy0zz43m0nlh9f5aetpa3amn6a034yqvmsgvzshk9clds375xx9'

// LAUNCH has 6 decimals
export const LAUNCH_DECIMALS = 6

// Tier requirements: amount in human-readable LAUNCH, duration in days
export const TIER_REQUIREMENTS: Record<LockTier, { amount: number; durationDays: number }> = {
  EXPLORER:  { amount: 100,     durationDays: 7 },
  BUILDER:   { amount: 1_000,   durationDays: 30 },
  FOUNDER:   { amount: 10_000,  durationDays: 90 },
  GOVERNOR:  { amount: 100_000, durationDays: 180 },
}

// Tier hierarchy (higher index = higher tier)
export const TIER_ORDER: LockTier[] = ['EXPLORER', 'BUILDER', 'FOUNDER', 'GOVERNOR']

// Convert human-readable LAUNCH amount to micro units (on-chain format)
export function toMicroAmount(amount: number): string {
  return String(Math.floor(amount * 10 ** LAUNCH_DECIMALS))
}

// Convert micro units back to human-readable LAUNCH
export function fromMicroAmount(microAmount: string): number {
  return Number(microAmount) / 10 ** LAUNCH_DECIMALS
}

// Compare tiers: returns true if `userTier` >= `requiredTier`
export function isTierSufficient(userTier: LockTier, requiredTier: LockTier): boolean {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(requiredTier)
}
