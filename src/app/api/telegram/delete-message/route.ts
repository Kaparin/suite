import { NextRequest, NextResponse } from 'next/server'

const INTERNAL_SECRET = process.env.TELEGRAM_BOT_TOKEN!

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Internal endpoint: waits `delay` ms then deletes a Telegram message.
 * Called fire-and-forget from the bot webhook handler so the webhook
 * can respond to Telegram immediately (avoiding retries / duplicates).
 */
export async function POST(request: NextRequest) {
  try {
    const { chatId, messageId, delay, secret } = await request.json()

    if (secret !== INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!chatId || !messageId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }

    const waitMs = Math.min(Math.max(delay || 10_000, 1_000), 30_000)
    await sleep(waitMs)

    const res = await fetch(
      `https://api.telegram.org/bot${INTERNAL_SECRET}/deleteMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
      }
    )

    const data = await res.json()
    if (!data.ok) {
      console.error('Telegram deleteMessage failed:', data)
    }

    return NextResponse.json({ ok: data.ok })
  } catch (err) {
    console.error('delete-message route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
