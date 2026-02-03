import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateTelegramAuth, createTelegramSessionToken, type TelegramAuthData } from '@/lib/auth/telegram'

// GET /api/auth/telegram/callback - Handle Telegram OAuth redirect
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Telegram sends data as URL parameters
  const id = searchParams.get('id')
  const first_name = searchParams.get('first_name')
  const last_name = searchParams.get('last_name')
  const username = searchParams.get('username')
  const photo_url = searchParams.get('photo_url')
  const auth_date = searchParams.get('auth_date')
  const hash = searchParams.get('hash')

  // Check for required params
  if (!id || !auth_date || !hash) {
    // Redirect to login with error
    return NextResponse.redirect(new URL('/login?error=missing_params', request.url))
  }

  const telegramData: TelegramAuthData = {
    id: parseInt(id),
    first_name: first_name || 'User',
    last_name: last_name || undefined,
    username: username || undefined,
    photo_url: photo_url || undefined,
    auth_date: parseInt(auth_date),
    hash
  }

  // Validate Telegram auth data
  if (!validateTelegramAuth(telegramData)) {
    return NextResponse.redirect(new URL('/login?error=invalid_auth', request.url))
  }

  const telegramId = telegramData.id.toString()

  try {
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { telegramId }
    })

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          telegramId,
          telegramUsername: telegramData.username,
          telegramPhotoUrl: telegramData.photo_url,
          telegramFirstName: telegramData.first_name,
          telegramAuthDate: new Date(telegramData.auth_date * 1000),
          username: telegramData.username || telegramData.first_name
        }
      })
    } else {
      // Update existing user's Telegram info
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          telegramUsername: telegramData.username,
          telegramPhotoUrl: telegramData.photo_url,
          telegramFirstName: telegramData.first_name,
          telegramAuthDate: new Date(telegramData.auth_date * 1000)
        }
      })
    }

    // Create session token
    const token = createTelegramSessionToken(
      telegramId,
      user.id,
      user.walletAddress
    )

    // Redirect to login page with token in URL (will be handled by client)
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('token', token)
    redirectUrl.searchParams.set('user', encodeURIComponent(JSON.stringify({
      id: user.id,
      telegramId: user.telegramId,
      telegramUsername: user.telegramUsername,
      telegramPhotoUrl: user.telegramPhotoUrl,
      telegramFirstName: user.telegramFirstName,
      walletAddress: user.walletAddress,
      isVerified: user.isVerified,
      plan: user.plan
    })))

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Telegram callback error:', error)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }
}
