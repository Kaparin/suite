import 'server-only'

import type { AuthUser, LockTier } from './useAuth'

/**
 * Build a standard AuthUser response object from a Prisma user with wallets.
 * Optionally includes the user's highest active lock tier.
 */
export function buildAuthUserResponse(user: {
  id: string
  telegramId: string | null
  telegramUsername: string | null
  telegramPhotoUrl: string | null
  telegramFirstName: string | null
  plan: string
  wallets: Array<{
    id: string
    address: string
    label: string | null
    isPrimary: boolean
    verifiedAt: Date
    createdAt: Date
  }>
}, tier?: LockTier | null): AuthUser {
  const primaryWallet = user.wallets.find(w => w.isPrimary) || user.wallets[0] || null
  return {
    id: user.id,
    telegramId: user.telegramId,
    telegramUsername: user.telegramUsername,
    telegramPhotoUrl: user.telegramPhotoUrl,
    telegramFirstName: user.telegramFirstName,
    wallets: user.wallets.map(w => ({
      id: w.id,
      address: w.address,
      label: w.label,
      isPrimary: w.isPrimary,
      verifiedAt: w.verifiedAt.toISOString(),
      createdAt: w.createdAt.toISOString()
    })),
    primaryWallet: primaryWallet?.address || null,
    isVerified: user.wallets.length > 0,
    plan: user.plan,
    tier: tier ?? null
  }
}
