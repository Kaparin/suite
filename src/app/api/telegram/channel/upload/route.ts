import { NextRequest, NextResponse } from 'next/server'

const ADMIN_SECRET = process.env.ADMIN_SECRET || ''
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || ''
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  return authHeader.substring(7) === ADMIN_SECRET
}

/**
 * POST /api/telegram/channel/upload
 *
 * Upload a photo file directly to Telegram channel (multipart/form-data).
 *
 * Form fields:
 *   photo    — File (image)
 *   caption  — Optional HTML caption
 *   buttons  — Optional JSON string of InlineButton[][]
 *   disableNotification — Optional "true"/"false"
 *   pin      — Optional "true"/"false"
 */
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!CHANNEL_ID || !BOT_TOKEN) {
    return NextResponse.json({ error: 'Channel or bot not configured' }, { status: 500 })
  }

  try {
    const formData = await request.formData()
    const photo = formData.get('photo') as File | null
    const caption = formData.get('caption') as string || ''
    const buttonsJson = formData.get('buttons') as string || ''
    const disableNotification = formData.get('disableNotification') === 'true'
    const pin = formData.get('pin') === 'true'

    if (!photo) {
      return NextResponse.json({ error: 'photo file is required' }, { status: 400 })
    }

    // Validate file type
    if (!photo.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // 10MB limit (Telegram's limit)
    if (photo.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 10MB' }, { status: 400 })
    }

    // Parse buttons if provided
    let replyMarkup: Record<string, unknown> | undefined
    if (buttonsJson) {
      try {
        const buttons = JSON.parse(buttonsJson)
        if (Array.isArray(buttons) && buttons.length > 0) {
          replyMarkup = {
            inline_keyboard: buttons.map((row: { text: string; url: string }[]) =>
              row.map(btn => ({ text: btn.text, url: btn.url }))
            ),
          }
        }
      } catch {
        return NextResponse.json({ error: 'Invalid buttons JSON' }, { status: 400 })
      }
    }

    // Build multipart form for Telegram API
    const tgForm = new FormData()
    tgForm.append('chat_id', CHANNEL_ID)
    tgForm.append('photo', photo, photo.name)
    if (caption) {
      tgForm.append('caption', caption)
      tgForm.append('parse_mode', 'HTML')
    }
    if (disableNotification) {
      tgForm.append('disable_notification', 'true')
    }
    if (replyMarkup) {
      tgForm.append('reply_markup', JSON.stringify(replyMarkup))
    }

    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
      { method: 'POST', body: tgForm }
    )

    const result = await response.json()

    if (!result.ok) {
      console.error('[channel-upload] Telegram error:', result.description)
      return NextResponse.json({ error: result.description }, { status: 502 })
    }

    const messageId = result.result?.message_id as number | undefined

    // Auto-pin if requested
    if (pin && messageId) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/pinChatMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHANNEL_ID,
          message_id: messageId,
          disable_notification: true,
        }),
      })
    }

    return NextResponse.json({ success: true, messageId })
  } catch (error) {
    console.error('[channel-upload] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
