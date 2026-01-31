import { NextRequest, NextResponse } from 'next/server'
import { webhookCallback } from 'grammy'
import { bot } from '@/bot'

// Webhook handler for Telegram updates
const handler = webhookCallback(bot, 'std/http')

export async function POST(request: NextRequest) {
  try {
    const response = await handler(request)
    return response
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}

// Telegram sends GET to verify webhook
export async function GET() {
  return NextResponse.json({ status: 'Telegram webhook is active' })
}
