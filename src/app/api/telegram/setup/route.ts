import { NextRequest, NextResponse } from 'next/server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

export async function GET(request: NextRequest) {
  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 })
  }

  // Get the webhook URL from the request or use default
  const { searchParams } = new URL(request.url)
  const customUrl = searchParams.get('url')

  // Determine the base URL
  const baseUrl = customUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://suite-1.vercel.app'
  const webhookUrl = `${baseUrl}/api/telegram/webhook`

  try {
    // Set webhook
    const setResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'callback_query'],
          drop_pending_updates: true,
        }),
      }
    )

    const setResult = await setResponse.json()

    // Get webhook info
    const infoResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    )
    const infoResult = await infoResponse.json()

    return NextResponse.json({
      success: setResult.ok,
      message: setResult.ok ? 'Webhook set successfully' : setResult.description,
      webhookUrl,
      webhookInfo: infoResult.result,
    })
  } catch (error) {
    console.error('Failed to setup webhook:', error)
    return NextResponse.json(
      { error: 'Failed to setup webhook', details: String(error) },
      { status: 500 }
    )
  }
}

// Delete webhook (for debugging)
export async function DELETE() {
  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 })
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`,
      { method: 'POST' }
    )
    const result = await response.json()

    return NextResponse.json({
      success: result.ok,
      message: result.ok ? 'Webhook deleted' : result.description,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete webhook', details: String(error) },
      { status: 500 }
    )
  }
}
