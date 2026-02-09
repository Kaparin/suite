/**
 * Telegram Bot API sender
 *
 * Direct HTTP calls to the Telegram Bot API without grammy dependency.
 * Used by the alert dispatcher to deliver notifications to subscribers.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

const TELEGRAM_API_BASE = 'https://api.telegram.org'

interface TelegramSendResult {
  ok: boolean
  description?: string
}

/**
 * Send a text message to a Telegram chat via the Bot API.
 *
 * @param chatId - Telegram chat ID (user's telegramId)
 * @param message - Message text (HTML or Markdown)
 * @param parseMode - Parse mode for formatting (default: HTML)
 * @returns true if the message was sent successfully, false otherwise
 */
export async function sendTelegramMessage(
  chatId: string,
  message: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<boolean> {
  if (!BOT_TOKEN) {
    console.error('[telegram-sender] TELEGRAM_BOT_TOKEN is not set')
    return false
  }

  try {
    const url = `${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/sendMessage`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: parseMode,
        disable_web_page_preview: false,
      }),
    })

    const result: TelegramSendResult = await response.json()

    if (!result.ok) {
      console.error(
        `[telegram-sender] Failed to send message to ${chatId}: ${result.description}`
      )
      return false
    }

    return true
  } catch (error) {
    console.error(`[telegram-sender] Error sending message to ${chatId}:`, error)
    return false
  }
}
