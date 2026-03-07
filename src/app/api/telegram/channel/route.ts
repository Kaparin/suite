import { NextRequest, NextResponse } from 'next/server'
import {
  sendChannelPost,
  pinChannelMessage,
  editChannelMessage,
  editChannelCaption,
  deleteChannelMessage,
  type ChannelPostOptions,
} from '@/lib/alerts/telegram-sender'

const ADMIN_SECRET = process.env.ADMIN_SECRET || ''
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || ''

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  return authHeader.substring(7) === ADMIN_SECRET
}

function requireChannel() {
  if (!CHANNEL_ID) {
    return NextResponse.json({ error: 'TELEGRAM_CHANNEL_ID is not configured' }, { status: 500 })
  }
  return null
}

/**
 * POST /api/telegram/channel
 *
 * Actions:
 *   send   — Publish a new post (default)
 *   pin    — Pin a message by messageId
 *   edit   — Edit a sent message text/caption
 *   delete — Delete a message by messageId
 */
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const channelErr = requireChannel()
  if (channelErr) return channelErr

  try {
    const body = await request.json()
    const action = body.action || 'send'

    // ── PIN ──────────────────────────────────────────────────────────
    if (action === 'pin') {
      const { messageId } = body
      if (!messageId) {
        return NextResponse.json({ error: 'messageId is required' }, { status: 400 })
      }
      const result = await pinChannelMessage(CHANNEL_ID, messageId)
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 502 })
      }
      return NextResponse.json({ success: true })
    }

    // ── DELETE ────────────────────────────────────────────────────────
    if (action === 'delete') {
      const { messageId } = body
      if (!messageId) {
        return NextResponse.json({ error: 'messageId is required' }, { status: 400 })
      }
      const result = await deleteChannelMessage(CHANNEL_ID, messageId)
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 502 })
      }
      return NextResponse.json({ success: true })
    }

    // ── EDIT ─────────────────────────────────────────────────────────
    if (action === 'edit') {
      const { messageId, text, buttons, isPhoto } = body
      if (!messageId || !text) {
        return NextResponse.json({ error: 'messageId and text are required' }, { status: 400 })
      }
      const opts = { parseMode: 'HTML' as const, buttons }
      const result = isPhoto
        ? await editChannelCaption(CHANNEL_ID, messageId, text, opts)
        : await editChannelMessage(CHANNEL_ID, messageId, text, opts)
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 502 })
      }
      return NextResponse.json({ success: true })
    }

    // ── SEND (default) ───────────────────────────────────────────────
    const { text, photoUrl, buttons, disablePreview, disableNotification, pin } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    // Validate buttons
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
            return NextResponse.json({ error: 'Each button must have text and url' }, { status: 400 })
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
      disableNotification,
    }

    const result = await sendChannelPost(options)

    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'Failed to send' }, { status: 502 })
    }

    // Auto-pin if requested
    if (pin && result.messageId) {
      await pinChannelMessage(CHANNEL_ID, result.messageId)
    }

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error) {
    console.error('[channel-post] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** GET /api/telegram/channel — status check */
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({
    channelId: CHANNEL_ID || null,
    configured: !!CHANNEL_ID && !!process.env.TELEGRAM_BOT_TOKEN,
  })
}
