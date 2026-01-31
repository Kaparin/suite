import { NextResponse } from 'next/server'

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      hasDatabase: !!process.env.DATABASE_URL,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasTelegram: !!process.env.TELEGRAM_BOT_TOKEN,
      nodeEnv: process.env.NODE_ENV,
    },
  }

  return NextResponse.json(health)
}
