import { NextRequest, NextResponse } from 'next/server'
import { runIndexer, checkSocialLinks } from '@/lib/axiome/indexer'
import { processExpiredLocks, verifyActiveLocks } from '@/lib/lock'
import { recalculateAllTrustScores } from '@/lib/trust/calculator'
import { processExpiredPayments } from '@/lib/payments'
import { dispatchAlerts } from '@/lib/alerts/dispatcher'
import { processExpiredProposals } from '@/lib/governance/voting-power'

// This endpoint can be called by a cron job (Vercel Cron, GitHub Actions, etc.)
// to update token metrics periodically

export async function GET(request: NextRequest) {
  // Verify cron secret if provided (for security)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Run indexer
    const result = await runIndexer()

    // Check social links
    await checkSocialLinks()

    // Process lock expirations and verify on-chain balances
    const expiredCount = await processExpiredLocks()
    const lockVerification = await verifyActiveLocks()

    // Recalculate trust scores for all active projects
    const trustScores = await recalculateAllTrustScores()

    // Process expired payments and lapsed subscriptions
    const expiredPayments = await processExpiredPayments()

    // Dispatch alert notifications to subscribers
    const alertResults = await dispatchAlerts()

    // Process expired governance proposals
    const proposalResults = await processExpiredProposals()

    return NextResponse.json({
      success: true,
      ...result,
      locks: {
        expired: expiredCount,
        verified: lockVerification.verified,
        violated: lockVerification.violated,
      },
      trustScores: {
        updated: trustScores.updated,
        errors: trustScores.errors,
      },
      payments: {
        expired: expiredPayments,
      },
      alerts: {
        sent: alertResults.sent,
        errors: alertResults.errors,
      },
      governance: {
        passed: proposalResults.passed,
        rejected: proposalResults.rejected,
        expired: proposalResults.expired,
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cron index error:', error)
    return NextResponse.json(
      { error: 'Indexer failed', details: String(error) },
      { status: 500 }
    )
  }
}

// Also support POST for webhook-style triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
