/**
 * Telegram Bot API sender
 *
 * Direct HTTP calls to the Telegram Bot API without grammy dependency.
 * Used by the alert dispatcher and channel post publisher.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

const TELEGRAM_API = 'https://api.telegram.org'

interface TelegramResult {
  ok: boolean
  description?: string
  result?: Record<string, unknown>
}

interface InlineButton {
  text: string
  url: string
}

export interface ChannelPostOptions {
  chatId: string
  text: string
  parseMode?: 'HTML' | 'MarkdownV2'
  buttons?: InlineButton[][]
  photoUrl?: string
  disablePreview?: boolean
  disableNotification?: boolean
}

// ── Simple message sender (for alerts) ───────────────────────────────

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
    const response = await fetch(`${TELEGRAM_API}/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: parseMode,
        disable_web_page_preview: false,
      }),
    })

    const result: TelegramResult = await response.json()
    if (!result.ok) {
      console.error(`[telegram-sender] Failed to send to ${chatId}: ${result.description}`)
      return false
    }
    return true
  } catch (error) {
    console.error(`[telegram-sender] Error sending to ${chatId}:`, error)
    return false
  }
}

// ── Inline keyboard builder ──────────────────────────────────────────

function buildInlineKeyboard(buttons: InlineButton[][]) {
  return {
    inline_keyboard: buttons.map(row =>
      row.map(btn => ({ text: btn.text, url: btn.url }))
    ),
  }
}

// ── Channel post (send) ──────────────────────────────────────────────

export async function sendChannelPost(options: ChannelPostOptions): Promise<{
  ok: boolean
  messageId?: number
  error?: string
}> {
  if (!BOT_TOKEN) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN is not set' }
  }

  const {
    chatId, text, parseMode = 'HTML', buttons, photoUrl,
    disablePreview, disableNotification,
  } = options

  const replyMarkup = buttons && buttons.length > 0
    ? buildInlineKeyboard(buttons)
    : undefined

  try {
    let endpoint: string
    let body: Record<string, unknown>

    if (photoUrl) {
      endpoint = `${TELEGRAM_API}/bot${BOT_TOKEN}/sendPhoto`
      body = {
        chat_id: chatId,
        photo: photoUrl,
        caption: text,
        parse_mode: parseMode,
        ...(replyMarkup && { reply_markup: replyMarkup }),
        ...(disableNotification && { disable_notification: true }),
      }
    } else {
      endpoint = `${TELEGRAM_API}/bot${BOT_TOKEN}/sendMessage`
      body = {
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: disablePreview ?? false,
        ...(replyMarkup && { reply_markup: replyMarkup }),
        ...(disableNotification && { disable_notification: true }),
      }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const result: TelegramResult = await response.json()

    if (!result.ok) {
      console.error(`[telegram-sender] Channel post failed: ${result.description}`)
      return { ok: false, error: result.description }
    }

    const messageId = (result.result as Record<string, unknown>)?.message_id as number | undefined
    return { ok: true, messageId }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[telegram-sender] Channel post error:`, error)
    return { ok: false, error: msg }
  }
}

// ── Pin message ──────────────────────────────────────────────────────

export async function pinChannelMessage(
  chatId: string,
  messageId: number,
  disableNotification = true
): Promise<{ ok: boolean; error?: string }> {
  if (!BOT_TOKEN) return { ok: false, error: 'BOT_TOKEN not set' }

  try {
    const response = await fetch(`${TELEGRAM_API}/bot${BOT_TOKEN}/pinChatMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        disable_notification: disableNotification,
      }),
    })
    const result: TelegramResult = await response.json()
    if (!result.ok) return { ok: false, error: result.description }
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// ── Edit message ─────────────────────────────────────────────────────

export async function editChannelMessage(
  chatId: string,
  messageId: number,
  text: string,
  options?: {
    parseMode?: 'HTML' | 'MarkdownV2'
    buttons?: InlineButton[][]
    disablePreview?: boolean
  }
): Promise<{ ok: boolean; error?: string }> {
  if (!BOT_TOKEN) return { ok: false, error: 'BOT_TOKEN not set' }

  const replyMarkup = options?.buttons && options.buttons.length > 0
    ? buildInlineKeyboard(options.buttons)
    : undefined

  try {
    const response = await fetch(`${TELEGRAM_API}/bot${BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: options?.parseMode ?? 'HTML',
        disable_web_page_preview: options?.disablePreview ?? false,
        ...(replyMarkup && { reply_markup: replyMarkup }),
      }),
    })
    const result: TelegramResult = await response.json()
    if (!result.ok) return { ok: false, error: result.description }
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// ── Edit caption (for photo messages) ────────────────────────────────

export async function editChannelCaption(
  chatId: string,
  messageId: number,
  caption: string,
  options?: {
    parseMode?: 'HTML' | 'MarkdownV2'
    buttons?: InlineButton[][]
  }
): Promise<{ ok: boolean; error?: string }> {
  if (!BOT_TOKEN) return { ok: false, error: 'BOT_TOKEN not set' }

  const replyMarkup = options?.buttons && options.buttons.length > 0
    ? buildInlineKeyboard(options.buttons)
    : undefined

  try {
    const response = await fetch(`${TELEGRAM_API}/bot${BOT_TOKEN}/editMessageCaption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        caption,
        parse_mode: options?.parseMode ?? 'HTML',
        ...(replyMarkup && { reply_markup: replyMarkup }),
      }),
    })
    const result: TelegramResult = await response.json()
    if (!result.ok) return { ok: false, error: result.description }
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// ── Delete message ───────────────────────────────────────────────────

export async function deleteChannelMessage(
  chatId: string,
  messageId: number
): Promise<{ ok: boolean; error?: string }> {
  if (!BOT_TOKEN) return { ok: false, error: 'BOT_TOKEN not set' }

  try {
    const response = await fetch(`${TELEGRAM_API}/bot${BOT_TOKEN}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
      }),
    })
    const result: TelegramResult = await response.json()
    if (!result.ok) return { ok: false, error: result.description }
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
