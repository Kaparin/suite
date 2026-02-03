import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

// Store pending auth requests (in production use Redis)
const pendingAuth = new Map<string, {
  createdAt: number
  redirectUrl: string
}>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [code, data] of pendingAuth.entries()) {
    if (now - data.createdAt > 5 * 60 * 1000) {
      pendingAuth.delete(code)
    }
  }
}, 60 * 1000)

// POST /api/auth/telegram/start - Generate auth code and deep link
export async function POST(request: NextRequest) {
  try {
    const { redirectUrl } = await request.json()

    // Generate unique auth code
    const authCode = randomBytes(16).toString('hex')

    // Store pending auth
    pendingAuth.set(authCode, {
      createdAt: Date.now(),
      redirectUrl: redirectUrl || '/'
    })

    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'axiome_launch_suite_bot'

    // Generate deep link
    const deepLink = `https://t.me/${botUsername}?start=auth_${authCode}`

    return NextResponse.json({
      authCode,
      deepLink,
      expiresIn: 300 // 5 minutes
    })
  } catch (error) {
    console.error('Error starting auth:', error)
    return NextResponse.json(
      { error: 'Failed to start authentication' },
      { status: 500 }
    )
  }
}

// GET /api/auth/telegram/start?code=xxx - Check auth status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'Code required' }, { status: 400 })
  }

  const pending = pendingAuth.get(code)

  if (!pending) {
    return NextResponse.json({
      status: 'expired',
      error: 'Auth code expired or not found'
    })
  }

  // Check if completed (would be set by bot webhook)
  // For now just return pending
  return NextResponse.json({
    status: 'pending',
    createdAt: pending.createdAt
  })
}

// Export for use by webhook
export { pendingAuth }
