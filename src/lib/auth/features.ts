/**
 * Feature Access Matrix
 *
 * Defines which features require which tier and/or plan.
 * Used by TierGate component and API middleware.
 */

import type { LockTier } from '@/lib/auth/useAuth'

type Plan = 'FREE' | 'PRO'

interface FeatureRequirement {
  minTier?: LockTier | null  // null = no tier required
  minPlan?: Plan             // default FREE
  description: string
}

export const FEATURES: Record<string, FeatureRequirement> = {
  // Free features (no requirements)
  'explorer.view': { description: 'View token explorer' },
  'token.view': { description: 'View token pages' },

  // Explorer tier (100 LAUNCH)
  'comments.write': { minTier: 'EXPLORER', description: 'Write comments' },
  'comments.react': { minTier: 'EXPLORER', description: 'React to comments' },
  'governance.vote': { minTier: 'EXPLORER', description: 'Vote on proposals' },

  // Builder tier (1,000 LAUNCH)
  'project.publish': { minTier: 'BUILDER', description: 'Publish projects' },
  'project.prelaunch': { minTier: 'BUILDER', description: 'Create pre-launch cards' },
  'analytics.basic': { minTier: 'BUILDER', description: 'Basic analytics' },

  // Founder tier (10,000 LAUNCH)
  'project.extended': { minTier: 'FOUNDER', description: 'Extended project profile' },
  'explorer.priority': { minTier: 'FOUNDER', description: 'Priority in explorer' },

  // Governor tier (100,000 LAUNCH)
  'governance.propose': { minTier: 'GOVERNOR', description: 'Create proposals' },
  'governance.grants': { minTier: 'GOVERNOR', description: 'Grants participation' },

  // PRO plan features
  'ai.extended': { minPlan: 'PRO', description: 'Extended AI generations (50/day)' },
  'alerts.advanced': { minPlan: 'PRO', description: 'Advanced alert filters' },
}

// AI generation limits
export const AI_LIMITS = {
  FREE: { daily: 3, model: 'gpt-4o-mini' as const },
  PRO: { daily: 50, model: 'gpt-4o' as const },
}

const TIER_ORDER: (LockTier | null)[] = [null, 'EXPLORER', 'BUILDER', 'FOUNDER', 'GOVERNOR']

/**
 * Check if a user can access a feature.
 */
export function canAccessFeature(
  feature: string,
  userTier: LockTier | null,
  userPlan: Plan = 'FREE',
): boolean {
  const req = FEATURES[feature]
  if (!req) return true // Unknown feature = allowed

  // Check tier
  if (req.minTier) {
    const requiredIdx = TIER_ORDER.indexOf(req.minTier)
    const userIdx = TIER_ORDER.indexOf(userTier)
    if (userIdx < requiredIdx) return false
  }

  // Check plan
  if (req.minPlan === 'PRO' && userPlan !== 'PRO') return false

  return true
}
