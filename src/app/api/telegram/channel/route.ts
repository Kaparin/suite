import { NextRequest, NextResponse } from 'next/server'
import { sendChannelPost, type ChannelPostOptions } from '@/lib/alerts/telegram-sender'

const ADMIN_SECRET = process.env.ADMIN_SECRET || ''
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || ''

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  return authHeader.substring(7) === ADMIN_SECRET
}

/**
 * POST /api/telegram/channel
 * Publish a post to the Telegram channel.
 *
 * Headers: Authorization: Bearer <ADMIN_SECRET>
 *
 * Body: {
 *   text: string               // HTML-formatted message text (or photo caption)
 *   photoUrl?: string           // Optional photo URL (sends as sendPhoto)
 *   buttons?: { text: string, url: string }[][]  // Inline keyboard (2D array = rows)
 *   disablePreview?: boolean    // Disable link preview (default false)
 * }
 */
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!CHANNEL_ID) {
    return NextResponse.json(
      { error: 'TELEGRAM_CHANNEL_ID is not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { text, photoUrl, buttons, disablePreview } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    // Validate buttons structure if provided
    if (buttons) {
      if (!Array.isArray(buttons)) {
        return NextResponse.json({ error: 'buttons must be a 2D array' }, { status: 400 })
      }
      for (const row of buttons) {
        if (!Array.isArray(row)) {
          return NextResponse.json({ error: 'Each button row must be an array' }, { status: 400 })
        }
        for (const btn of row) {
          if (!btn.text || !btn.url) {
            return NextResponse.json(
              { error: 'Each button must have text and url' },
              { status: 400 }
            )
          }
        }
      }
    }

    const options: ChannelPostOptions = {
      chatId: CHANNEL_ID,
      text,
      parseMode: 'HTML',
      buttons,
      photoUrl,
      disablePreview,
    }

    const result = await sendChannelPost(options)

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || 'Failed to send post' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error) {
    console.error('[channel-post] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/telegram/channel
 * Preview: returns the channel ID and bot status.
 */
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    channelId: CHANNEL_ID || null,
    configured: !!CHANNEL_ID && !!process.env.TELEGRAM_BOT_TOKEN,
  })
}
