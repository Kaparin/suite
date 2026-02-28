import { Bot, Context, session, SessionFlavor, InlineKeyboard } from 'grammy'
import { prisma } from '@/lib/prisma'
import { createSessionTokenV2 } from '@/lib/auth/telegram'
import type { Project, TokenMetric, RiskFlag } from '@prisma/client'

// Session data
interface SessionData {
  step?: 'name' | 'idea' | 'audience' | 'utilities'
  projectData?: {
    name?: string
    idea?: string
    audience?: string
    utilities?: string
  }
}

type MyContext = Context & SessionFlavor<SessionData>

// Types for projects with relations
type ProjectWithMetricsAndFlags = Project & {
  metrics: TokenMetric[]
  riskFlags: RiskFlag[]
}

type ProjectWithFlags = Project & {
  riskFlags: RiskFlag[]
}

type ProjectWithScore = ProjectWithMetricsAndFlags & {
  score: number
}

const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_TOKEN!)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.axiome-launch.com'
const COINFLIP_URL = 'https://coinflip.axiome-launch.com/game'

// Session middleware
bot.use(session({
  initial: (): SessionData => ({})
}))

// === Commands ===

// /start - Welcome message or auth callback
bot.command('start', async (ctx) => {
  const payload = ctx.match?.trim()

  // Check if this is an auth request
  if (payload?.startsWith('auth_')) {
    const authCode = payload.replace('auth_', '')

    // Get user data
    const telegramId = ctx.from?.id.toString()
    const username = ctx.from?.username
    const firstName = ctx.from?.first_name

    if (!telegramId) {
      await ctx.reply('❌ Could not get your Telegram data. Please try again.')
      return
    }

    // Try to get user's profile photo
    let photoUrl: string | undefined
    try {
      const photos = await ctx.api.getUserProfilePhotos(ctx.from!.id, { limit: 1 })
      if (photos.total_count > 0 && photos.photos[0]?.[0]) {
        const file = await ctx.api.getFile(photos.photos[0][0].file_id)
        if (file.file_path) {
          photoUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`
        }
      }
    } catch (photoError) {
      console.error('Could not fetch profile photo:', photoError)
    }

    // Save/update user in database
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {
        telegramUsername: username,
        telegramFirstName: firstName,
        telegramPhotoUrl: photoUrl,
        telegramAuthDate: new Date()
      },
      create: {
        telegramId,
        telegramUsername: username,
        telegramFirstName: firstName,
        telegramPhotoUrl: photoUrl,
        telegramAuthDate: new Date(),
        username: username || firstName
      }
    })

    // Generate auth URL with user data
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.axiome-launch.com'

    // Fetch user wallets for response
    const wallets = await prisma.wallet.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' }
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
        verifiedAt: w.verifiedAt.toISOString()
      })),
      primaryWallet,
      isVerified: wallets.length > 0,
      plan: user.plan
    }))

    // Create V2 session token
    const token = createSessionTokenV2(user.id, telegramId)

    const authUrl = `${siteUrl}/login?auth_code=${authCode}&token=${token}&user=${userData}`

    const keyboard = new InlineKeyboard()
      .url('✅ Complete Login', authUrl)

    await ctx.reply(
      `🔐 *Login Request*

Click the button below to complete your login to Axiome Launch Suite.

This will authorize your Telegram account: *${firstName}* ${username ? `(@${username})` : ''}`,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    )
    return
  }

  // Regular /start command
  const keyboard = new InlineKeyboard()
    .url('🎮 Play Heads or Tails', COINFLIP_URL)
    .row()
    .text('🚀 Create Token', 'create')
    .text('🔍 Explorer', 'explorer')
    .row()
    .text('📊 Top Tokens', 'top')
    .text('⏳ Upcoming', 'upcoming')
    .row()
    .url('🌐 Website', SITE_URL)

  await ctx.reply(
    `🌌 *Welcome to Axiome Launch Suite!*

We build independent Web3 products on Axiome blockchain. Each project has its own token and economy.

🎮 *Heads or Tails* — Live PvP Game
Flip a coin, win 90% of the pot. Powered by *COIN* token.
Provably fair, instant results, on-chain verification.
→ [Play now](${COINFLIP_URL})

💎 *LAUNCH Token* — Ecosystem Revenue
Hold LAUNCH to earn revenue from every project we build. The more products — the more value for holders.

*Commands:*
• /game - Play Heads or Tails
• /create - Create a new token project
• /token <address> - View token details
• /top - Top tokens by trust score
• /upcoming - Upcoming token launches

Let's build something amazing! 🚀`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
      link_preview_options: { is_disabled: true }
    }
  )

  // Save user to database
  const telegramId = ctx.from?.id.toString()
  if (telegramId) {
    await prisma.user.upsert({
      where: { telegramId },
      update: {
        username: ctx.from?.username,
        telegramUsername: ctx.from?.username,
        telegramFirstName: ctx.from?.first_name
      },
      create: {
        telegramId,
        username: ctx.from?.username,
        telegramUsername: ctx.from?.username,
        telegramFirstName: ctx.from?.first_name
      }
    })
  }
})

// /login - Get login link
bot.command('login', async (ctx) => {
  const telegramId = ctx.from?.id.toString()
  const username = ctx.from?.username
  const firstName = ctx.from?.first_name

  if (!telegramId) {
    await ctx.reply('❌ Could not get your Telegram data.')
    return
  }

  // Generate auth code
  const authCode = Math.random().toString(36).substring(2) + Date.now().toString(36)

  // Try to get user's profile photo
  let photoUrl: string | undefined
  try {
    const photos = await ctx.api.getUserProfilePhotos(ctx.from!.id, { limit: 1 })
    if (photos.total_count > 0 && photos.photos[0]?.[0]) {
      const file = await ctx.api.getFile(photos.photos[0][0].file_id)
      if (file.file_path) {
        photoUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`
      }
    }
  } catch (photoError) {
    console.error('Could not fetch profile photo:', photoError)
  }

  // Save/update user in database
  const user = await prisma.user.upsert({
    where: { telegramId },
    update: {
      telegramUsername: username,
      telegramFirstName: firstName,
      telegramPhotoUrl: photoUrl,
      telegramAuthDate: new Date()
    },
    create: {
      telegramId,
      telegramUsername: username,
      telegramFirstName: firstName,
      telegramPhotoUrl: photoUrl,
      telegramAuthDate: new Date(),
      username: username || firstName
    }
  })

  // Generate V2 session token
  const token = createSessionTokenV2(user.id, telegramId)

  // Fetch user wallets for response
  const userWallets = await prisma.wallet.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' }
  })
  const userPrimaryWallet = userWallets.find(w => w.isPrimary)?.address || (userWallets[0]?.address ?? null)

  const userData = encodeURIComponent(JSON.stringify({
    id: user.id,
    telegramId: user.telegramId,
    telegramUsername: user.telegramUsername,
    telegramFirstName: user.telegramFirstName,
    telegramPhotoUrl: user.telegramPhotoUrl,
    wallets: userWallets.map(w => ({
      id: w.id,
      address: w.address,
      label: w.label,
      isPrimary: w.isPrimary,
      verifiedAt: w.verifiedAt.toISOString()
    })),
    primaryWallet: userPrimaryWallet,
    isVerified: userWallets.length > 0,
    plan: user.plan
  }))

  const authUrl = `${SITE_URL}/login?auth_code=${authCode}&token=${token}&user=${userData}`

  const keyboard = new InlineKeyboard()
    .url('🔐 Login to Website', authUrl)

  await ctx.reply(
    `🔐 *Login to Axiome Launch Suite*

Click the button below to log in with your Telegram account.

${userWallets.length > 0 ? '✅ Your wallet is verified' : '⚠️ Verify your wallet on the website to access full features'}

After login you can:
• Play Heads or Tails (COIN token)
• Create and manage token projects
• Explore tokens and community discussions`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    }
  )
})

// /myprojects - Show user's projects
bot.command('myprojects', async (ctx) => {
  const telegramId = ctx.from?.id.toString()

  if (!telegramId) {
    await ctx.reply('❌ Could not identify you.')
    return
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: {
        projects: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            _count: {
              select: { reactions: true, comments: true }
            }
          }
        }
      }
    })

    if (!user || user.projects.length === 0) {
      const keyboard = new InlineKeyboard()
        .url('🚀 Create Token', `${SITE_URL}/create`)

      await ctx.reply(
        'You haven\'t created any tokens yet. Start now!',
        { reply_markup: keyboard }
      )
      return
    }

    const list = user.projects
      .map((p, i) => {
        const statusEmojiMap: Record<string, string> = {
          DRAFT: '📝',
          UPCOMING: '⏳',
          PRESALE: '🔥',
          LAUNCHED: '✅',
          ARCHIVED: '📦'
        }
        const statusEmoji = statusEmojiMap[p.status] || '❓'
        const stats = `💬 ${p._count.comments} | ❤️ ${p._count.reactions}`
        return `${i + 1}. ${statusEmoji} *${p.name}* ($${p.ticker})\n   Status: ${p.status} | ${stats}`
      })
      .join('\n\n')

    const keyboard = new InlineKeyboard()
      .url('📊 Dashboard', `${SITE_URL}/dashboard`)
      .url('➕ Create New', `${SITE_URL}/create`)

    await ctx.reply(
      `📁 *Your Projects*\n\n${list}`,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    )
  } catch (error) {
    console.error('Error fetching user projects:', error)
    await ctx.reply('❌ Error fetching your projects. Please try again.')
  }
})

// /create - Start token creation wizard
bot.command('create', async (ctx) => {
  ctx.session.step = 'name'
  ctx.session.projectData = {}

  await ctx.reply(
    `🎨 *Token Creation Wizard*

Let's create your token! I'll ask you a few questions and generate everything you need.

*Step 1/4: Project Name*
What's the name of your token project?

Example: _Moon Finance_, _Axiome Meme_, _SafeYield_`,
    { parse_mode: 'Markdown' }
  )
})

// /game - Play Heads or Tails
bot.command('game', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .url('🎮 Play Now', COINFLIP_URL)
    .url('📖 Game Rules', `${SITE_URL}/docs#coinflip`)

  await ctx.reply(
    `🎮 *Heads or Tails — Live PvP Game*

Flip a coin against another player. Winner takes *90%* of the pot.

🪙 *How it works:*
1. Buy COIN tokens on the presale
2. Deposit COIN to your game balance
3. Create a bet or accept an existing one
4. Result is instant — smart contract determines the winner

💰 *Key info:*
• Token: *COIN* (CW20 on Axiome)
• Min bet: 1 COIN
• Commission: 10% of the pot
• Fairness: commit-reveal scheme, fully on-chain

🎁 *Referral program:*
Invite friends and earn up to 3% from their games!
• Level 1: 3% • Level 2: 1.5% • Level 3: 0.5%

🏆 *Events & Raffles:*
Regular contests and raffles with real COIN prizes.`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    }
  )
})

// /token <address or id> - View token details
bot.command('token', async (ctx) => {
  const query = ctx.match?.trim()

  if (!query) {
    await ctx.reply('Please provide a token address or ID:\n`/token axm1abc123...`\nor\n`/token <project_id>`', { parse_mode: 'Markdown' })
    return
  }

  try {
    // Try to find by tokenAddress first, then by project ID
    let project = await prisma.project.findUnique({
      where: { tokenAddress: query },
      include: {
        metrics: { orderBy: { date: 'desc' }, take: 1 },
        riskFlags: { where: { isActive: true } },
        owner: {
          select: {
            telegramUsername: true,
            telegramFirstName: true
          }
        },
        _count: {
          select: { reactions: true, comments: true }
        }
      }
    })

    // If not found by tokenAddress, try by ID
    if (!project) {
      project = await prisma.project.findUnique({
        where: { id: query },
        include: {
          metrics: { orderBy: { date: 'desc' }, take: 1 },
          riskFlags: { where: { isActive: true } },
          owner: {
            select: {
              telegramUsername: true,
              telegramFirstName: true
            }
          },
          _count: {
            select: { reactions: true, comments: true }
          }
        }
      })
    }

    if (!project) {
      await ctx.reply(`❌ Token not found: \`${query}\``, { parse_mode: 'Markdown' })
      return
    }

    const metric = project.metrics[0]
    const riskCount = project.riskFlags.length
    const isOnChain = project.status === 'LAUNCHED' && project.tokenAddress

    // Build keyboard based on token status
    const keyboard = new InlineKeyboard()
      .url('📄 View Page', `${SITE_URL}/t/${project.tokenAddress || project.id}`)

    if (isOnChain && project.tokenAddress) {
      keyboard.row().url('💱 Trade', `https://axiometrade.pro/swap?token=${project.tokenAddress}`)
    }

    if (isOnChain) {
      // On-chain token - show full stats
      const score = Math.max(0, Math.min(100, 100 - riskCount * 15))
      const scoreEmoji = score >= 80 ? '🟢' : score >= 50 ? '🟡' : '🔴'
      const riskText = riskCount === 0
        ? '✅ No risk flags'
        : `⚠️ ${riskCount} risk flag(s)`

      await ctx.reply(
        `🪙 *${project.name}* ($${project.ticker})

${project.descriptionShort || 'No description'}

📊 *Stats:*
• Holders: ${metric?.holdersEstimate || 'N/A'}
• Volume 24h: $${metric?.volumeEstimate?.toLocaleString() || 'N/A'}
• Transactions: ${metric?.txCount || 'N/A'}

${scoreEmoji} *Trust Score:* ${score}/100
${riskText}

📝 Contract: \`${project.tokenAddress}\``,
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      )
    } else {
      // Upcoming token - show different info
      const creator = project.owner?.telegramUsername
        ? `@${project.owner.telegramUsername}`
        : project.owner?.telegramFirstName || 'Anonymous'
      const statusText = project.status === 'PRESALE' ? '🔥 Presale Active' : '⏳ Coming Soon'

      await ctx.reply(
        `🪙 *${project.name}* ($${project.ticker})
${statusText}

${project.descriptionShort || 'No description'}

👤 *Creator:* ${creator}
💬 *Comments:* ${project._count.comments}
❤️ *Reactions:* ${project._count.reactions}

_Token not yet launched on-chain_`,
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      )
    }
  } catch (error) {
    console.error('Error fetching token:', error)
    await ctx.reply('❌ Error fetching token data. Please try again.')
  }
})

// /top - Show top tokens (on-chain launched tokens)
bot.command('top', async (ctx) => {
  try {
    const projects: ProjectWithMetricsAndFlags[] = await prisma.project.findMany({
      where: { status: 'LAUNCHED' },
      include: {
        metrics: { orderBy: { date: 'desc' }, take: 1 },
        riskFlags: { where: { isActive: true } }
      },
      take: 10
    })

    if (projects.length === 0) {
      await ctx.reply('No launched tokens yet. Check /upcoming for tokens coming soon!')
      return
    }

    // Sort by score
    const sorted: ProjectWithScore[] = projects
      .map((p: ProjectWithMetricsAndFlags): ProjectWithScore => ({
        ...p,
        score: Math.max(0, Math.min(100, 100 - p.riskFlags.length * 15 +
          ((p.metrics[0]?.txCount || 0) > 100 ? 5 : 0)))
      }))
      .sort((a: ProjectWithScore, b: ProjectWithScore) => b.score - a.score)

    const list = sorted
      .map((p: ProjectWithScore, i: number) => {
        const emoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
        const scoreEmoji = p.score >= 80 ? '🟢' : p.score >= 50 ? '🟡' : '🔴'
        return `${emoji} *${p.name}* ($${p.ticker}) ${scoreEmoji} ${p.score}`
      })
      .join('\n')

    await ctx.reply(
      `🏆 *Top Tokens by Trust Score*\n\n${list}\n\nUse /token <address> to view details`,
      { parse_mode: 'Markdown' }
    )
  } catch (error) {
    console.error('Error fetching top tokens:', error)
    await ctx.reply('❌ Error fetching tokens. Please try again.')
  }
})

// /new - Show newest tokens (on-chain launched tokens)
bot.command('new', async (ctx) => {
  try {
    const projects: ProjectWithFlags[] = await prisma.project.findMany({
      where: { status: 'LAUNCHED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        riskFlags: { where: { isActive: true } }
      }
    })

    if (projects.length === 0) {
      await ctx.reply('No launched tokens yet. Check /upcoming for tokens coming soon!')
      return
    }

    const list = projects
      .map((p: ProjectWithFlags) => {
        const age = Math.floor((Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        const ageText = age === 0 ? 'today' : `${age}d ago`
        return `🆕 *${p.name}* ($${p.ticker}) - ${ageText}`
      })
      .join('\n')

    await ctx.reply(
      `🆕 *Newest Tokens*\n\n${list}\n\nUse /token <address> to view details`,
      { parse_mode: 'Markdown' }
    )
  } catch (error) {
    console.error('Error fetching new tokens:', error)
    await ctx.reply('❌ Error fetching tokens. Please try again.')
  }
})

// /watch <address> - Subscribe to alerts
bot.command('watch', async (ctx) => {
  const address = ctx.match?.trim()
  const telegramId = ctx.from?.id.toString()

  if (!address || !telegramId) {
    await ctx.reply('Please provide a token address:\n`/watch axm1abc123...`', { parse_mode: 'Markdown' })
    return
  }

  try {
    await prisma.alertSubscription.upsert({
      where: {
        telegramId_alertType_tokenAddress: {
          telegramId,
          alertType: 'TOKEN_UPDATE',
          tokenAddress: address
        }
      },
      update: { isActive: true },
      create: {
        telegramId,
        alertType: 'TOKEN_UPDATE',
        tokenAddress: address
      }
    })

    await ctx.reply(
      `✅ You're now watching \`${address}\`\n\nYou'll receive alerts for:\n• Price changes\n• Volume spikes\n• New risk flags`,
      { parse_mode: 'Markdown' }
    )
  } catch (error) {
    console.error('Error creating subscription:', error)
    await ctx.reply('❌ Error creating subscription. Please try again.')
  }
})

// /upcoming - Show upcoming token launches
bot.command('upcoming', async (ctx) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        status: { in: ['UPCOMING', 'PRESALE'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        owner: {
          select: {
            telegramUsername: true,
            telegramFirstName: true
          }
        },
        _count: {
          select: { reactions: true, comments: true }
        }
      }
    })

    if (projects.length === 0) {
      const keyboard = new InlineKeyboard()
        .url('🚀 Create Token', `${SITE_URL}/create`)

      await ctx.reply(
        'No upcoming tokens yet. Be the first to announce your project!',
        { reply_markup: keyboard }
      )
      return
    }

    const list = projects
      .map((p, i) => {
        const creator = p.owner?.telegramUsername
          ? `@${p.owner.telegramUsername}`
          : p.owner?.telegramFirstName || 'Anonymous'
        const stats = `💬 ${p._count.comments} | ❤️ ${p._count.reactions}`
        const statusEmoji = p.status === 'PRESALE' ? '🔥' : '⏳'
        return `${i + 1}. ${statusEmoji} *${p.name}* ($${p.ticker})\n   by ${creator} | ${stats}`
      })
      .join('\n\n')

    const keyboard = new InlineKeyboard()
      .url('🔍 View All', `${SITE_URL}/explorer?tab=upcoming`)

    await ctx.reply(
      `⏳ *Upcoming Token Launches*\n\n${list}\n\nVisit the Explorer for more details!`,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    )
  } catch (error) {
    console.error('Error fetching upcoming tokens:', error)
    await ctx.reply('❌ Error fetching upcoming tokens. Please try again.')
  }
})

// === Callback Queries ===

bot.callbackQuery('create', async (ctx) => {
  await ctx.answerCallbackQuery()
  ctx.session.step = 'name'
  ctx.session.projectData = {}

  await ctx.reply(
    `🎨 *Token Creation Wizard*

*Step 1/4: Project Name*
What's the name of your token project?`,
    { parse_mode: 'Markdown' }
  )
})

bot.callbackQuery('explorer', async (ctx) => {
  await ctx.answerCallbackQuery()
  const keyboard = new InlineKeyboard()
    .url('🔍 Open Explorer', `${SITE_URL}/explorer`)

  await ctx.reply('Open the Explorer to browse all tokens:', { reply_markup: keyboard })
})

bot.callbackQuery('top', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.api.sendMessage(ctx.chat!.id, '/top')
})

bot.callbackQuery('upcoming', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.api.sendMessage(ctx.chat!.id, '/upcoming')
})

// === Message Handler for Wizard ===

bot.on('message:text', async (ctx) => {
  const step = ctx.session.step
  if (!step) return

  const text = ctx.message.text

  switch (step) {
    case 'name':
      ctx.session.projectData!.name = text
      ctx.session.step = 'idea'
      await ctx.reply(
        `✅ Great name: *${text}*

*Step 2/4: Token Idea*
Describe what your token does. What problem does it solve? What makes it unique?`,
        { parse_mode: 'Markdown' }
      )
      break

    case 'idea':
      ctx.session.projectData!.idea = text
      ctx.session.step = 'audience'
      await ctx.reply(
        `✅ Got it!

*Step 3/4: Target Audience*
Who is your token for? (e.g., DeFi users, NFT collectors, gamers)`,
        { parse_mode: 'Markdown' }
      )
      break

    case 'audience':
      ctx.session.projectData!.audience = text
      ctx.session.step = 'utilities'
      await ctx.reply(
        `✅ Perfect!

*Step 4/4: Utilities (optional)*
What can holders do with your token? (Staking, governance, discounts...)

Send "skip" to skip this step.`,
        { parse_mode: 'Markdown' }
      )
      break

    case 'utilities':
      ctx.session.projectData!.utilities = text.toLowerCase() === 'skip' ? '' : text
      ctx.session.step = undefined

      // Link to create project
      const data = ctx.session.projectData!

      const keyboard = new InlineKeyboard()
        .url('🚀 Create Project', `${SITE_URL}/create`)

      await ctx.reply(
        `🎉 *All set!*

Your project: *${data.name}*

Click the button below to create your project and get community feedback!`,
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      )

      ctx.session.projectData = {}
      break
  }
})

// Error handler
bot.catch((err) => {
  console.error('Bot error:', err)
})

export { bot }
