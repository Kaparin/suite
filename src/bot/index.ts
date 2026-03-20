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

/** Auto-delete timeout for group/channel welcome messages (ms) */
const WELCOME_AUTO_DELETE_MS = 10_000

// Session middleware
bot.use(session({
  initial: (): SessionData => ({})
}))

// ── i18n ─────────────────────────────────────────────────────────────

type Lang = 'en' | 'ru'

function detectLang(languageCode?: string): Lang {
  if (languageCode?.startsWith('ru')) return 'ru'
  return 'en'
}

const i18n = {
  en: {
    welcomeTitle: 'Axiome Launch Suite',
    welcomeGreeting: (name: string) => `${name}, welcome to the Axiome ecosystem!`,
    welcomeGreetingAnon: 'Welcome to the Axiome ecosystem!',
    whatWeBuild: 'What we build:',
    whatWeBuildDesc:
      'Independent Web3 products on Axiome blockchain. ' +
      'Each project has its own token and economy — and <b>LAUNCH</b> holders earn revenue from all of them.',
    liveProducts: 'Live products:',
    hotTitle: 'Heads or Tails',
    hotDesc: 'PvP coin flip game. Wager COIN against another player. Winner takes 90% of the pot. Provably fair, instant results, fully on-chain.',
    launchTitle: 'LAUNCH Token',
    launchDesc: 'Ecosystem revenue share. Stake LAUNCH and earn from every product we build. More products = more value for holders.',
    commands: 'Commands:',
    cmdStart: 'This message',
    cmdGame: 'Heads or Tails info',
    cmdLogin: 'Log in to website',
    // Buttons
    btnPlay: 'Play Heads or Tails',
    btnSuite: 'Launch Suite',
    btnDocs: 'Documentation',
    btnBuyLaunch: '',
    btnBuyCoin: '',
    btnPlayNow: 'Play Now',
    btnRules: 'Game Rules',
    // /game
    gameTitle: 'Heads or Tails — Live PvP Game',
    gameDesc: 'Flip a coin against another player. Winner takes <b>90%</b> of the pot.',
    gameHow: 'How it works:',
    gameStep1: '1. Deposit AXM or buy COIN on the presale',
    gameStep2: '2. Create a bet or accept an existing one',
    gameStep3: '3. Smart contract determines the winner instantly',
    gameInfo: 'Key info:',
    gameToken: 'Token: <b>COIN</b> (CW20 on Axiome)',
    gameMin: 'Min bet: 1 COIN',
    gameComm: 'Commission: 10%',
    gameFair: 'Fairness: commit-reveal, fully on-chain',
    gameRef: 'Referral program:',
    gameRefDesc: 'Invite friends and earn from the treasury (10% commission)!\nLevel 1: 15% | Level 2: 7% | Level 3: 3% of treasury',
    // /login
    loginTitle: 'Login to Axiome Launch Suite',
    loginClick: 'Click the button below to log in with your Telegram account.',
    loginVerified: 'Your wallet is verified.',
    loginNotVerified: 'Verify your wallet on the website to access all features.',
    btnLogin: 'Log in to Axiome',
    // Auth
    authTitle: 'Login Request',
    authClick: 'Click the button below to complete your login.',
    authAccount: 'Account:',
    btnComplete: 'Complete Login',
    // Group welcome
    groupWelcome: (name: string) => `<b>${name}</b>, welcome to the Axiome community!`,
    groupWelcomeDesc: 'Check out our products:',
    // Errors
    errNoData: 'Could not get your Telegram data.',
  },
  ru: {
    welcomeTitle: 'Axiome Launch Suite',
    welcomeGreeting: (name: string) => `${name}, добро пожаловать в экосистему Axiome!`,
    welcomeGreetingAnon: 'Добро пожаловать в экосистему Axiome!',
    whatWeBuild: 'Что мы строим:',
    whatWeBuildDesc:
      'Независимые Web3-продукты на блокчейне Axiome. ' +
      'У каждого проекта свой токен и экономика — а держатели <b>LAUNCH</b> зарабатывают со всех продуктов.',
    liveProducts: 'Активные продукты:',
    hotTitle: 'Орёл и Решка',
    hotDesc: 'PvP игра на монетку. Поставь COIN против другого игрока. Победитель забирает 90% банка. Доказуемо честная, мгновенные результаты, полностью ончейн.',
    launchTitle: 'Токен LAUNCH',
    launchDesc: 'Доля дохода экосистемы. Стейкай LAUNCH и зарабатывай с каждого продукта. Больше продуктов = больше ценность.',
    commands: 'Команды:',
    cmdStart: 'Это сообщение',
    cmdGame: 'Инфо об игре',
    cmdLogin: 'Войти на сайт',
    btnPlay: 'Играть в Орёл и Решку',
    btnSuite: 'Launch Suite',
    btnDocs: 'Документация',
    btnBuyLaunch: '',
    btnBuyCoin: '',
    btnPlayNow: 'Играть',
    btnRules: 'Правила',
    gameTitle: 'Орёл и Решка — PvP Игра',
    gameDesc: 'Подбрось монетку против другого игрока. Победитель забирает <b>90%</b> банка.',
    gameHow: 'Как играть:',
    gameStep1: '1. Пополни AXM или купи COIN на пресейле',
    gameStep2: '2. Создай ставку или прими существующую',
    gameStep3: '3. Смарт-контракт мгновенно определит победителя',
    gameInfo: 'Основное:',
    gameToken: 'Токен: <b>COIN</b> (CW20 на Axiome)',
    gameMin: 'Мин. ставка: 1 COIN',
    gameComm: 'Комиссия: 10%',
    gameFair: 'Честность: commit-reveal, полностью ончейн',
    gameRef: 'Реферальная программа:',
    gameRefDesc: 'Приглашай друзей и зарабатывай из казны (10% комиссия)!\nУровень 1: 15% | Уровень 2: 7% | Уровень 3: 3% от казны',
    loginTitle: 'Вход в Axiome Launch Suite',
    loginClick: 'Нажмите кнопку ниже, чтобы войти через Telegram.',
    loginVerified: 'Ваш кошелёк верифицирован.',
    loginNotVerified: 'Верифицируйте кошелёк на сайте для полного доступа.',
    btnLogin: 'Войти в Axiome',
    authTitle: 'Запрос на вход',
    authClick: 'Нажмите кнопку ниже, чтобы завершить вход.',
    authAccount: 'Аккаунт:',
    btnComplete: 'Завершить вход',
    groupWelcome: (name: string) => `<b>${name}</b>, добро пожаловать в сообщество Axiome!`,
    groupWelcomeDesc: 'Попробуй наши продукты:',
    errNoData: 'Не удалось получить данные Telegram.',
  },
} as const

// ── Message builders ─────────────────────────────────────────────────

function buildWelcomeText(lang: Lang, firstName?: string): string {
  const t = i18n[lang]
  const greeting = firstName ? t.welcomeGreeting(firstName) : t.welcomeGreetingAnon
  return (
    `<b>${t.welcomeTitle}</b>\n\n` +
    `${greeting}\n\n` +
    `<b>${t.whatWeBuild}</b>\n` +
    `<blockquote>${t.whatWeBuildDesc}</blockquote>\n\n` +
    `<b>${t.liveProducts}</b>\n\n` +
    `<b>${t.hotTitle}</b> — ${t.hotDesc}\n\n` +
    `<b>${t.launchTitle}</b> — ${t.launchDesc}\n\n` +
    `<b>${t.commands}</b>\n` +
    `/start — ${t.cmdStart}\n` +
    `/game — ${t.cmdGame}\n` +
    `/login — ${t.cmdLogin}`
  )
}

function buildWelcomeKeyboard(lang: Lang): InlineKeyboard {
  const t = i18n[lang]
  return new InlineKeyboard()
    .url(t.btnPlay, `${COINFLIP_URL}/game`)
    .row()
    .url(t.btnSuite, SITE_URL)
    .url(t.btnDocs, DOCS_URL)
}

function buildGameText(lang: Lang): string {
  const t = i18n[lang]
  return (
    `<b>${t.gameTitle}</b>\n\n` +
    `${t.gameDesc}\n\n` +
    `<b>${t.gameHow}</b>\n` +
    `${t.gameStep1}\n${t.gameStep2}\n${t.gameStep3}\n\n` +
    `<b>${t.gameInfo}</b>\n` +
    `${t.gameToken}\n${t.gameMin}\n${t.gameComm}\n${t.gameFair}\n\n` +
    `<b>${t.gameRef}</b>\n${t.gameRefDesc}`
  )
}

// ── /start ───────────────────────────────────────────────────────────

bot.command('start', async (ctx) => {
  const payload = ctx.match?.trim()

  if (payload?.startsWith('auth_')) {
    await handleAuthStart(ctx, payload)
    return
  }

  const lang = detectLang(ctx.from?.language_code)

  await ctx.reply(buildWelcomeText(lang, ctx.from?.first_name), {
    parse_mode: 'HTML',
    reply_markup: buildWelcomeKeyboard(lang),
    link_preview_options: { is_disabled: true },
  })

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
  const lang = detectLang(ctx.from?.language_code)
  const t = i18n[lang]

  const keyboard = new InlineKeyboard()
    .url(t.btnPlayNow, `${COINFLIP_URL}/game`)
    .row()
    .url(t.btnRules, `${DOCS_URL}#coinflip`)

  await ctx.reply(buildGameText(lang), {
    parse_mode: 'HTML',
    reply_markup: keyboard,
    link_preview_options: { is_disabled: true },
  })
})

// ── /login ───────────────────────────────────────────────────────────

bot.command('login', async (ctx) => {
  const lang = detectLang(ctx.from?.language_code)
  const t = i18n[lang]
  const telegramId = ctx.from?.id.toString()
  const username = ctx.from?.username
  const firstName = ctx.from?.first_name

  if (!telegramId) {
    await ctx.reply(t.errNoData)
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

  const authCode = Math.random().toString(36).substring(2) + Date.now().toString(36)
  const authUrl = `${SITE_URL}/login?auth_code=${authCode}&token=${token}&user=${userData}`

  const keyboard = new InlineKeyboard()
    .url(t.btnLogin, authUrl)

  await ctx.reply(
    `<b>${t.loginTitle}</b>\n\n` +
    `${t.loginClick}\n\n` +
    (wallets.length > 0 ? t.loginVerified : t.loginNotVerified),
    {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    }
  )
})

// ── Auth callback (/start auth_<code>) ───────────────────────────────

async function handleAuthStart(ctx: MyContext, payload: string) {
  const authCode = payload.replace('auth_', '')
  const lang = detectLang(ctx.from?.language_code)
  const t = i18n[lang]
  const telegramId = ctx.from?.id.toString()
  const username = ctx.from?.username
  const firstName = ctx.from?.first_name

  if (!telegramId) {
    await ctx.reply(t.errNoData)
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
    .url(t.btnComplete, authUrl)

  await ctx.reply(
    `<b>${t.authTitle}</b>\n\n` +
    `${t.authClick}\n\n` +
    `${t.authAccount} <b>${firstName}</b>${username ? ` (@${username})` : ''}`,
    {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    }
  )
}

// ── New member welcome (group/supergroup) — auto-deletes after 10s ───

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

bot.on('chat_member', async (ctx) => {
  const update = ctx.chatMember
  if (!update) return

  const oldStatus = update.old_chat_member.status
  const newStatus = update.new_chat_member.status
  const isJoining =
    (oldStatus === 'left' || oldStatus === 'kicked') &&
    (newStatus === 'member' || newStatus === 'administrator')

  if (!isJoining) return
  if (update.new_chat_member.user.is_bot) return

  const user = update.new_chat_member.user
  const lang = detectLang(user.language_code)
  const t = i18n[lang]

  const keyboard = new InlineKeyboard()
    .url(t.btnPlay, `${COINFLIP_URL}/game`)
    .url(t.btnSuite, SITE_URL)

  try {
    const sent = await ctx.api.sendMessage(
      update.chat.id,
      `${t.groupWelcome(user.first_name)}\n\n${t.groupWelcomeDesc}`,
      {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      }
    )

    // Wait then delete — must be awaited so serverless doesn't kill the process
    await sleep(WELCOME_AUTO_DELETE_MS)
    try {
      await ctx.api.deleteMessage(update.chat.id, sent.message_id)
    } catch (delErr) {
      console.error('Failed to auto-delete welcome message:', delErr)
    }
  } catch (err) {
    console.error('Failed to send group welcome:', err)
  }
})

// ── Error handler ────────────────────────────────────────────────────

bot.catch((err) => {
  console.error('Bot error:', err)
})

export { bot }
