import { Bot, Context, session, SessionFlavor, InlineKeyboard } from 'grammy'
import { prisma } from '@/lib/prisma'
import { createSessionTokenV2 } from '@/lib/auth/telegram'

// Session data (kept minimal — only for auth flow)
interface SessionData {
  _empty?: boolean
}

type MyContext = Context & SessionFlavor<SessionData>

const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_TOKEN!)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.axiome-launch.com'
const COINFLIP_URL = 'https://coinflip.axiome-launch.com'
const DOCS_URL = `${SITE_URL}/docs`
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || ''

// Session middleware
bot.use(session({
  initial: (): SessionData => ({})
}))

// ── Welcome message builder ──────────────────────────────────────────

function buildWelcomeText(firstName?: string): string {
  const greeting = firstName ? `${firstName}, welcome` : 'Welcome'
  return (
    `<b>Axiome Launch Suite</b>\n\n` +
    `${greeting} to the Axiome ecosystem!\n\n` +
    `<b>What we build:</b>\n` +
    `<blockquote>Independent Web3 products on Axiome blockchain. ` +
    `Each project has its own token and economy — and <b>LAUNCH</b> holders earn revenue from all of them.</blockquote>\n\n` +

    `<b>Live products:</b>\n\n` +

    `<b>Heads or Tails</b> — PvP coin flip game\n` +
    `Wager COIN against another player. Winner takes 90% of the pot. ` +
    `Provably fair, instant results, fully on-chain.\n\n` +

    `<b>LAUNCH Token</b> — ecosystem revenue share\n` +
    `Stake LAUNCH and earn from every product we build. ` +
    `More products = more value for holders.\n\n` +

    `<b>Commands:</b>\n` +
    `/start — This message\n` +
    `/game — Heads or Tails info\n` +
    `/login — Log in to website`
  )
}

function buildWelcomeKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .url('Play Heads or Tails', `${COINFLIP_URL}/game`)
    .row()
    .url('Launch Suite', SITE_URL)
    .url('Documentation', DOCS_URL)
    .row()
    .url('Buy LAUNCH', `${SITE_URL}/staking`)
    .url('Buy COIN', `${COINFLIP_URL}/presale`)
}

// ── /start ───────────────────────────────────────────────────────────

bot.command('start', async (ctx) => {
  const payload = ctx.match?.trim()

  // Auth callback: /start auth_<code>
  if (payload?.startsWith('auth_')) {
    await handleAuthStart(ctx, payload)
    return
  }

  // Regular welcome
  await ctx.reply(buildWelcomeText(ctx.from?.first_name), {
    parse_mode: 'HTML',
    reply_markup: buildWelcomeKeyboard(),
    link_preview_options: { is_disabled: true },
  })

  // Save/update user
  const telegramId = ctx.from?.id.toString()
  if (telegramId) {
    await prisma.user.upsert({
      where: { telegramId },
      update: {
        telegramUsername: ctx.from?.username,
        telegramFirstName: ctx.from?.first_name,
      },
      create: {
        telegramId,
        username: ctx.from?.username,
        telegramUsername: ctx.from?.username,
        telegramFirstName: ctx.from?.first_name,
      },
    })
  }
})

// ── /game ────────────────────────────────────────────────────────────

bot.command('game', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .url('Play Now', `${COINFLIP_URL}/game`)
    .row()
    .url('Game Rules', `${DOCS_URL}#coinflip`)

  await ctx.reply(
    `<b>Heads or Tails — Live PvP Game</b>\n\n` +
    `Flip a coin against another player. Winner takes <b>90%</b> of the pot.\n\n` +
    `<b>How it works:</b>\n` +
    `1. Deposit AXM or buy COIN on the presale\n` +
    `2. Create a bet or accept an existing one\n` +
    `3. Smart contract determines the winner instantly\n\n` +
    `<b>Key info:</b>\n` +
    `Token: <b>COIN</b> (CW20 on Axiome)\n` +
    `Min bet: 1 COIN\n` +
    `Commission: 10%\n` +
    `Fairness: commit-reveal, fully on-chain\n\n` +
    `<b>Referral program:</b>\n` +
    `Invite friends and earn up to 3% from their games!\n` +
    `Level 1: 3% | Level 2: 1.5% | Level 3: 0.5%`,
    {
      parse_mode: 'HTML',
      reply_markup: keyboard,
      link_preview_options: { is_disabled: true },
    }
  )
})

// ── /login ───────────────────────────────────────────────────────────

bot.command('login', async (ctx) => {
  const telegramId = ctx.from?.id.toString()
  const username = ctx.from?.username
  const firstName = ctx.from?.first_name

  if (!telegramId) {
    await ctx.reply('Could not get your Telegram data.')
    return
  }

  let photoUrl: string | undefined
  try {
    const photos = await ctx.api.getUserProfilePhotos(ctx.from!.id, { limit: 1 })
    if (photos.total_count > 0 && photos.photos[0]?.[0]) {
      const file = await ctx.api.getFile(photos.photos[0][0].file_id)
      if (file.file_path) {
        photoUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`
      }
    }
  } catch {
    // photo fetch is optional
  }

  const user = await prisma.user.upsert({
    where: { telegramId },
    update: {
      telegramUsername: username,
      telegramFirstName: firstName,
      telegramPhotoUrl: photoUrl,
      telegramAuthDate: new Date(),
    },
    create: {
      telegramId,
      telegramUsername: username,
      telegramFirstName: firstName,
      telegramPhotoUrl: photoUrl,
      telegramAuthDate: new Date(),
      username: username || firstName,
    },
  })

  const token = createSessionTokenV2(user.id, telegramId)

  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  })
  const primaryWallet = wallets.find(w => w.isPrimary)?.address || (wallets[0]?.address ?? null)

  const userData = encodeURIComponent(JSON.stringify({
    id: user.id,
    telegramId: user.telegramId,
    telegramUsername: user.telegramUsername,
    telegramFirstName: user.telegramFirstName,
    telegramPhotoUrl: user.telegramPhotoUrl,
    wallets: wallets.map(w => ({
      id: w.id,
      address: w.address,
      label: w.label,
      isPrimary: w.isPrimary,
      verifiedAt: w.verifiedAt.toISOString(),
    })),
    primaryWallet,
    isVerified: wallets.length > 0,
    plan: user.plan,
  }))

  const authCode = Math.random().toString(36).substring(2) + Date.now().toString(36)
  const authUrl = `${SITE_URL}/login?auth_code=${authCode}&token=${token}&user=${userData}`

  const keyboard = new InlineKeyboard()
    .url('Log in to Axiome', authUrl)

  await ctx.reply(
    `<b>Login to Axiome Launch Suite</b>\n\n` +
    `Click the button below to log in with your Telegram account.\n\n` +
    (wallets.length > 0
      ? 'Your wallet is verified.'
      : 'Verify your wallet on the website to access all features.'),
    {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    }
  )
})

// ── Auth callback handler (from /start auth_<code>) ──────────────────

async function handleAuthStart(ctx: MyContext, payload: string) {
  const authCode = payload.replace('auth_', '')
  const telegramId = ctx.from?.id.toString()
  const username = ctx.from?.username
  const firstName = ctx.from?.first_name

  if (!telegramId) {
    await ctx.reply('Could not get your Telegram data. Please try again.')
    return
  }

  let photoUrl: string | undefined
  try {
    const photos = await ctx.api.getUserProfilePhotos(ctx.from!.id, { limit: 1 })
    if (photos.total_count > 0 && photos.photos[0]?.[0]) {
      const file = await ctx.api.getFile(photos.photos[0][0].file_id)
      if (file.file_path) {
        photoUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`
      }
    }
  } catch {
    // optional
  }

  const user = await prisma.user.upsert({
    where: { telegramId },
    update: {
      telegramUsername: username,
      telegramFirstName: firstName,
      telegramPhotoUrl: photoUrl,
      telegramAuthDate: new Date(),
    },
    create: {
      telegramId,
      telegramUsername: username,
      telegramFirstName: firstName,
      telegramPhotoUrl: photoUrl,
      telegramAuthDate: new Date(),
      username: username || firstName,
    },
  })

  const token = createSessionTokenV2(user.id, telegramId)

  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  })
  const primaryWallet = wallets.find(w => w.isPrimary)?.address || (wallets[0]?.address ?? null)

  const userData = encodeURIComponent(JSON.stringify({
    id: user.id,
    telegramId: user.telegramId,
    telegramUsername: user.telegramUsername,
    telegramFirstName: user.telegramFirstName,
    telegramPhotoUrl: user.telegramPhotoUrl,
    wallets: wallets.map(w => ({
      id: w.id,
      address: w.address,
      label: w.label,
      isPrimary: w.isPrimary,
      verifiedAt: w.verifiedAt.toISOString(),
    })),
    primaryWallet,
    isVerified: wallets.length > 0,
    plan: user.plan,
  }))

  const authUrl = `${SITE_URL}/login?auth_code=${authCode}&token=${token}&user=${userData}`

  const keyboard = new InlineKeyboard()
    .url('Complete Login', authUrl)

  await ctx.reply(
    `<b>Login Request</b>\n\n` +
    `Click the button below to complete your login.\n\n` +
    `Account: <b>${firstName}</b>${username ? ` (@${username})` : ''}`,
    {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    }
  )
}

// ── New member welcome in channel/group ──────────────────────────────

bot.on('chat_member', async (ctx) => {
  const update = ctx.chatMember
  if (!update) return

  // Only react to users joining (status changes to 'member' or 'administrator')
  const oldStatus = update.old_chat_member.status
  const newStatus = update.new_chat_member.status
  const isJoining =
    (oldStatus === 'left' || oldStatus === 'kicked') &&
    (newStatus === 'member' || newStatus === 'administrator')

  if (!isJoining) return

  // Don't greet bots
  if (update.new_chat_member.user.is_bot) return

  const firstName = update.new_chat_member.user.first_name

  const keyboard = new InlineKeyboard()
    .url('Play Heads or Tails', `${COINFLIP_URL}/game`)
    .url('Launch Suite', SITE_URL)

  await ctx.api.sendMessage(update.chat.id,
    `<b>${firstName}</b>, welcome to the Axiome community!\n\n` +
    `Here you'll find the latest news about our ecosystem, events, and updates.\n\n` +
    `Check out our products:`,
    {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    }
  )
})

// ── Error handler ────────────────────────────────────────────────────

bot.catch((err) => {
  console.error('Bot error:', err)
})

export { bot }
