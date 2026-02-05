import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateTelegramAuth, createSessionTokenV2, type TelegramAuthData } from '@/lib/auth/telegram'
import { buildAuthUserResponse } from '@/lib/auth/userResponse'

// POST /api/auth/telegram - Authenticate via Telegram Login Widget
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TelegramAuthData

    // Validate required fields
    if (!body.id || !body.auth_date || !body.hash) {
      return NextResponse.json(
        { error: 'Missing required Telegram auth fields' },
        { status: 400 }
      )
    }

    // Validate Telegram auth data
    if (!validateTelegramAuth(body)) {
      return NextResponse.json(
        { error: 'Invalid Telegram authentication' },
        { status: 401 }
      )
    }

    const telegramId = body.id.toString()

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { telegramId },
      include: { wallets: true }
    })

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          telegramId,
          telegramUsername: body.username,
          telegramPhotoUrl: body.photo_url,
          telegramFirstName: body.first_name,
          telegramAuthDate: new Date(body.auth_date * 1000),
          username: body.username || body.first_name
        },
        include: { wallets: true }
      })
    } else {
      // Update existing user's Telegram info
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          telegramUsername: body.username,
          telegramPhotoUrl: body.photo_url,
          telegramFirstName: body.first_name,
          telegramAuthDate: new Date(body.auth_date * 1000)
        },
        include: { wallets: true }
      })
    }

    // Create V2 session token (no wallet data in token)
    const token = createSessionTokenV2(user.id, telegramId)

    // Return user data with wallets
    return NextResponse.json({
      user: buildAuthUserResponse(user),
      token
    })
  } catch (error) {
    console.error('Telegram auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
