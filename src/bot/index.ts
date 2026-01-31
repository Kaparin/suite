import { Bot, Context, session, SessionFlavor, InlineKeyboard } from 'grammy'
import { prisma } from '@/lib/prisma'

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

const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_TOKEN!)

// Session middleware
bot.use(session({
  initial: (): SessionData => ({})
}))

// === Commands ===

// /start - Welcome message
bot.command('start', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text('🚀 Create Token', 'create')
    .text('🔍 Explorer', 'explorer')
    .row()
    .text('📊 Top Tokens', 'top')
    .text('🆕 New Tokens', 'new')
    .row()
    .url('🌐 Open Website', 'https://axiome-launch.vercel.app')

  await ctx.reply(
    `🌌 *Welcome to Axiome Launch Suite!*

Your AI-powered launchpad for tokens on Axiome blockchain.

*What can I do?*
• /create - Create a new token with AI assistance
• /token <address> - View token details
• /top - Show top tokens by score
• /new - Show newest tokens
• /watch <address> - Subscribe to token alerts

Let's build something amazing! 🚀`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    }
  )

  // Save user to database
  const telegramId = ctx.from?.id.toString()
  if (telegramId) {
    await prisma.user.upsert({
      where: { telegramId },
      update: { username: ctx.from?.username },
      create: {
        telegramId,
        username: ctx.from?.username,
      }
    })
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

// /token <address> - View token details
bot.command('token', async (ctx) => {
  const address = ctx.match?.trim()

  if (!address) {
    await ctx.reply('Please provide a token address:\n`/token axm1abc123...`', { parse_mode: 'Markdown' })
    return
  }

  try {
    const project = await prisma.project.findUnique({
      where: { tokenAddress: address },
      include: {
        metrics: { orderBy: { date: 'desc' }, take: 1 },
        riskFlags: { where: { isActive: true } }
      }
    })

    if (!project) {
      await ctx.reply(`❌ Token not found: \`${address}\``, { parse_mode: 'Markdown' })
      return
    }

    const metric = project.metrics[0]
    const riskCount = project.riskFlags.length
    const score = Math.max(0, Math.min(100, 100 - riskCount * 15))

    const scoreEmoji = score >= 80 ? '🟢' : score >= 50 ? '🟡' : '🔴'
    const riskText = riskCount === 0
      ? '✅ No risk flags'
      : `⚠️ ${riskCount} risk flag(s)`

    const keyboard = new InlineKeyboard()
      .url('📄 View Landing', `https://axiome-launch.vercel.app/t/${address}`)
      .row()
      .url('💱 Buy/Sell', `https://app.axiometrade.pro/swap?token=${address}`)

    await ctx.reply(
      `🪙 *${project.name}* ($${project.ticker})

${project.descriptionShort || 'No description'}

📊 *Stats:*
• Holders: ${metric?.holdersEstimate || 'N/A'}
• Volume 24h: $${metric?.volumeEstimate?.toLocaleString() || 'N/A'}
• Transactions: ${metric?.txCount || 'N/A'}

${scoreEmoji} *Trust Score:* ${score}/100
${riskText}

📝 Contract: \`${address}\``,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    )
  } catch (error) {
    console.error('Error fetching token:', error)
    await ctx.reply('❌ Error fetching token data. Please try again.')
  }
})

// /top - Show top tokens
bot.command('top', async (ctx) => {
  try {
    const projects = await prisma.project.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        metrics: { orderBy: { date: 'desc' }, take: 1 },
        riskFlags: { where: { isActive: true } }
      },
      take: 10
    })

    if (projects.length === 0) {
      await ctx.reply('No tokens found yet. Be the first to create one! /create')
      return
    }

    // Sort by score
    type ProjectWithRelations = typeof projects[number]
    type ProjectWithScore = ProjectWithRelations & { score: number }
    const sorted = projects
      .map((p: ProjectWithRelations): ProjectWithScore => ({
        ...p,
        score: Math.max(0, Math.min(100, 100 - p.riskFlags.length * 15 +
          ((p.metrics[0]?.txCount || 0) > 100 ? 5 : 0)))
      }))
      .sort((a: ProjectWithScore, b: ProjectWithScore) => b.score - a.score)

    const list = sorted
      .map((p, i) => {
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

// /new - Show newest tokens
bot.command('new', async (ctx) => {
  try {
    const projects = await prisma.project.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        riskFlags: { where: { isActive: true } }
      }
    })

    if (projects.length === 0) {
      await ctx.reply('No tokens found yet. Be the first to create one! /create')
      return
    }

    const list = projects
      .map(p => {
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
    .url('🔍 Open Explorer', 'https://axiome-launch.vercel.app/explorer')

  await ctx.reply('Open the Explorer to browse all tokens:', { reply_markup: keyboard })
})

bot.callbackQuery('top', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.api.sendMessage(ctx.chat!.id, '/top')
})

bot.callbackQuery('new', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.api.sendMessage(ctx.chat!.id, '/new')
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

      // Generate link to studio with prefilled data
      const data = ctx.session.projectData!
      const params = new URLSearchParams({
        name: data.name || '',
        idea: data.idea || '',
        audience: data.audience || '',
        utilities: data.utilities || '',
        from: 'telegram'
      })

      const keyboard = new InlineKeyboard()
        .url('🚀 Generate with AI', `https://axiome-launch.vercel.app/studio?${params}`)

      await ctx.reply(
        `🎉 *All set!*

Your project: *${data.name}*

Click the button below to open Token Studio and generate your complete token package with AI!`,
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

// Start bot function
export async function startBot() {
  console.log('🤖 Starting Telegram bot...')
  await bot.start({
    onStart: (botInfo) => {
      console.log(`✅ Bot @${botInfo.username} is running!`)
    }
  })
}
