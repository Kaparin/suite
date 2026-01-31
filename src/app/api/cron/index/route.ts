import { NextRequest, NextResponse } from 'next/server'
import { runIndexer, checkSocialLinks } from '@/lib/axiome/indexer'

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

    return NextResponse.json({
      success: true,
      ...result,
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
