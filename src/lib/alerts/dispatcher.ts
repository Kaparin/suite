/**
 * Alert Dispatcher
 *
 * Processes alert subscriptions and delivers notifications to subscribers
 * via Telegram. Called periodically from the cron job.
 *
 * Alert types:
 *  - NEW_TOKEN:     A project status just changed to LAUNCHED
 *  - VOLUME_SPIKE:  Volume > 2x previous day
 *  - PRICE_CHANGE:  Price changed > 10%
 *  - RISK_FLAG:     A new active risk flag was added
 *  - TOKEN_UPDATE:  Tracked token had meaningful changes (reserved for future use)
 */

import { prisma } from '@/lib/prisma'
import { sendTelegramMessage } from './telegram-sender'

// How far back to look for recent events (in minutes)
const LOOKBACK_MINUTES = 15

// ---------------------------------------------------------------------------
// Alert condition checkers
// ---------------------------------------------------------------------------

interface ProjectForAlert {
  id: string
  name: string
  ticker: string
  tokenAddress: string | null
  status: string
  updatedAt: Date
}

interface MetricPair {
  projectId: string
  projectName: string
  projectTicker: string
  tokenAddress: string | null
  today: { volumeEstimate: number; priceUsd: number | null }
  yesterday: { volumeEstimate: number; priceUsd: number | null }
}

interface RiskFlagForAlert {
  projectId: string
  projectName: string
  projectTicker: string
  tokenAddress: string | null
  flagType: string
  severity: string
}

/**
 * Find projects whose status recently changed to LAUNCHED.
 */
async function findNewlyLaunchedTokens(since: Date): Promise<ProjectForAlert[]> {
  return prisma.project.findMany({
    where: {
      status: 'LAUNCHED',
      updatedAt: { gte: since },
    },
    select: {
      id: true,
      name: true,
      ticker: true,
      tokenAddress: true,
      status: true,
      updatedAt: true,
    },
  })
}

/**
 * Get metric pairs (today vs yesterday) for all launched projects.
 * Returns only pairs where both days have data.
 */
async function getMetricPairs(): Promise<MetricPair[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const metrics = await prisma.tokenMetric.findMany({
    where: {
      date: { in: [yesterday, today] },
    },
    include: {
      project: {
        select: { id: true, name: true, ticker: true, tokenAddress: true },
      },
    },
    orderBy: { date: 'asc' },
  })

  // Group by projectId
  const byProject = new Map<string, typeof metrics>()
  for (const m of metrics) {
    const arr = byProject.get(m.projectId) ?? []
    arr.push(m)
    byProject.set(m.projectId, arr)
  }

  const pairs: MetricPair[] = []
  for (const [, projectMetrics] of byProject) {
    if (projectMetrics.length < 2) continue
    const yesterdayMetric = projectMetrics.find(
      (m) => m.date.getTime() === yesterday.getTime()
    )
    const todayMetric = projectMetrics.find(
      (m) => m.date.getTime() === today.getTime()
    )
    if (!yesterdayMetric || !todayMetric) continue

    pairs.push({
      projectId: todayMetric.project.id,
      projectName: todayMetric.project.name,
      projectTicker: todayMetric.project.ticker,
      tokenAddress: todayMetric.project.tokenAddress,
      today: {
        volumeEstimate: todayMetric.volumeEstimate,
        priceUsd: todayMetric.priceUsd,
      },
      yesterday: {
        volumeEstimate: yesterdayMetric.volumeEstimate,
        priceUsd: yesterdayMetric.priceUsd,
      },
    })
  }

  return pairs
}

/**
 * Check if volume spiked (today > 2x yesterday).
 */
function checkVolumeSpike(pair: MetricPair): boolean {
  if (pair.yesterday.volumeEstimate <= 0) return false
  return pair.today.volumeEstimate > pair.yesterday.volumeEstimate * 2
}

/**
 * Check if price changed > 10% in either direction.
 */
function checkPriceChange(pair: MetricPair): { triggered: boolean; pctChange: number } {
  if (!pair.today.priceUsd || !pair.yesterday.priceUsd || pair.yesterday.priceUsd === 0) {
    return { triggered: false, pctChange: 0 }
  }
  const pctChange =
    ((pair.today.priceUsd - pair.yesterday.priceUsd) / pair.yesterday.priceUsd) * 100
  return { triggered: Math.abs(pctChange) > 10, pctChange }
}

/**
 * Find risk flags added recently.
 */
async function findRecentRiskFlags(since: Date): Promise<RiskFlagForAlert[]> {
  const flags = await prisma.riskFlag.findMany({
    where: {
      isActive: true,
      createdAt: { gte: since },
    },
    include: {
      project: {
        select: { id: true, name: true, ticker: true, tokenAddress: true },
      },
    },
  })

  return flags.map((f) => ({
    projectId: f.project.id,
    projectName: f.project.name,
    projectTicker: f.project.ticker,
    tokenAddress: f.project.tokenAddress,
    flagType: f.flagType,
    severity: f.severity,
  }))
}

// ---------------------------------------------------------------------------
// Message formatters
// ---------------------------------------------------------------------------

function formatNewTokenMessage(project: ProjectForAlert): string {
  const addressPart = project.tokenAddress
    ? `\nAddress: <code>${project.tokenAddress}</code>`
    : ''
  return (
    `<b>New Token Launched!</b>\n\n` +
    `<b>${project.name}</b> ($${project.ticker})${addressPart}\n\n` +
    `View: https://axiomelaunch.com/t/${project.tokenAddress ?? project.id}`
  )
}

function formatVolumeSpikeMessage(pair: MetricPair): string {
  const multiplier = (pair.today.volumeEstimate / pair.yesterday.volumeEstimate).toFixed(1)
  return (
    `<b>Volume Spike Alert</b>\n\n` +
    `<b>${pair.projectName}</b> ($${pair.projectTicker})\n` +
    `Volume is <b>${multiplier}x</b> compared to yesterday\n` +
    `Today: ${pair.today.volumeEstimate.toLocaleString()} | Yesterday: ${pair.yesterday.volumeEstimate.toLocaleString()}\n\n` +
    `View: https://axiomelaunch.com/t/${pair.tokenAddress ?? pair.projectId}`
  )
}

function formatPriceChangeMessage(pair: MetricPair, pctChange: number): string {
  const direction = pctChange > 0 ? 'up' : 'down'
  const sign = pctChange > 0 ? '+' : ''
  return (
    `<b>Price ${pctChange > 0 ? 'Surge' : 'Drop'} Alert</b>\n\n` +
    `<b>${pair.projectName}</b> ($${pair.projectTicker})\n` +
    `Price ${direction} <b>${sign}${pctChange.toFixed(1)}%</b>\n` +
    `Now: $${pair.today.priceUsd?.toFixed(6) ?? '?'} | Was: $${pair.yesterday.priceUsd?.toFixed(6) ?? '?'}\n\n` +
    `View: https://axiomelaunch.com/t/${pair.tokenAddress ?? pair.projectId}`
  )
}

function formatRiskFlagMessage(flag: RiskFlagForAlert): string {
  const severityLabel: Record<string, string> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  }
  const flagLabels: Record<string, string> = {
    TOO_NEW: 'Too New',
    NO_SOCIALS: 'No Social Links',
    HIGH_CONCENTRATION: 'High Holder Concentration',
    LOW_LIQUIDITY: 'Low Liquidity',
    SUDDEN_PUMP: 'Sudden Pump',
    SUDDEN_DUMP: 'Sudden Dump',
    HONEYPOT_SUSPECT: 'Honeypot Suspect',
    UNLOCKED_SUPPLY: 'Unlocked Supply',
  }

  return (
    `<b>Risk Flag Alert</b>\n\n` +
    `<b>${flag.projectName}</b> ($${flag.projectTicker})\n` +
    `New flag: <b>${flagLabels[flag.flagType] ?? flag.flagType}</b>\n` +
    `Severity: <b>${severityLabel[flag.severity] ?? flag.severity}</b>\n\n` +
    `View: https://axiomelaunch.com/t/${flag.tokenAddress ?? flag.projectId}`
  )
}

// ---------------------------------------------------------------------------
// Delivery helper
// ---------------------------------------------------------------------------

async function deliverAlert(
  subscriptionId: string,
  alertType: string,
  telegramId: string,
  message: string
): Promise<boolean> {
  const sent = await sendTelegramMessage(telegramId, message)

  // Record delivery regardless of success (for debugging and deduplication)
  try {
    await prisma.alertDelivery.create({
      data: {
        subscriptionId,
        alertType,
        telegramId,
        message,
      },
    })
  } catch (error) {
    console.error(`[dispatcher] Failed to record delivery for sub ${subscriptionId}:`, error)
  }

  return sent
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------

/**
 * Process all active alert subscriptions and send notifications for
 * conditions that are currently met. Called from the cron job.
 *
 * @returns Stats about sent alerts and errors.
 */
export async function dispatchAlerts(): Promise<{ sent: number; errors: number }> {
  let sent = 0
  let errors = 0

  const since = new Date(Date.now() - LOOKBACK_MINUTES * 60 * 1000)

  // Load all active subscriptions grouped by type
  const subscriptions = await prisma.alertSubscription.findMany({
    where: { isActive: true },
  })

  if (subscriptions.length === 0) {
    return { sent: 0, errors: 0 }
  }

  // Group subscriptions by alertType for efficient processing
  const byType = new Map<string, typeof subscriptions>()
  for (const sub of subscriptions) {
    const arr = byType.get(sub.alertType) ?? []
    arr.push(sub)
    byType.set(sub.alertType, arr)
  }

  // --- NEW_TOKEN alerts ---
  const newTokenSubs = byType.get('NEW_TOKEN') ?? []
  if (newTokenSubs.length > 0) {
    try {
      const launchedProjects = await findNewlyLaunchedTokens(since)
      for (const project of launchedProjects) {
        const message = formatNewTokenMessage(project)
        for (const sub of newTokenSubs) {
          // If subscription is for a specific token, skip non-matching
          if (sub.tokenAddress && sub.tokenAddress !== project.tokenAddress) continue

          try {
            const ok = await deliverAlert(sub.id, 'NEW_TOKEN', sub.telegramId, message)
            if (ok) sent++
            else errors++
          } catch {
            errors++
          }
        }
      }
    } catch (error) {
      console.error('[dispatcher] Error processing NEW_TOKEN alerts:', error)
      errors++
    }
  }

  // --- VOLUME_SPIKE and PRICE_CHANGE alerts ---
  const volumeSubs = byType.get('VOLUME_SPIKE') ?? []
  const priceSubs = byType.get('PRICE_CHANGE') ?? []
  if (volumeSubs.length > 0 || priceSubs.length > 0) {
    try {
      const pairs = await getMetricPairs()

      for (const pair of pairs) {
        // Volume spike
        if (volumeSubs.length > 0 && checkVolumeSpike(pair)) {
          const message = formatVolumeSpikeMessage(pair)
          for (const sub of volumeSubs) {
            if (sub.tokenAddress && sub.tokenAddress !== pair.tokenAddress) continue
            try {
              const ok = await deliverAlert(sub.id, 'VOLUME_SPIKE', sub.telegramId, message)
              if (ok) sent++
              else errors++
            } catch {
              errors++
            }
          }
        }

        // Price change
        if (priceSubs.length > 0) {
          const { triggered, pctChange } = checkPriceChange(pair)
          if (triggered) {
            const message = formatPriceChangeMessage(pair, pctChange)
            for (const sub of priceSubs) {
              if (sub.tokenAddress && sub.tokenAddress !== pair.tokenAddress) continue
              try {
                const ok = await deliverAlert(sub.id, 'PRICE_CHANGE', sub.telegramId, message)
                if (ok) sent++
                else errors++
              } catch {
                errors++
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[dispatcher] Error processing VOLUME_SPIKE/PRICE_CHANGE alerts:', error)
      errors++
    }
  }

  // --- RISK_FLAG alerts ---
  const riskSubs = byType.get('RISK_FLAG') ?? []
  if (riskSubs.length > 0) {
    try {
      const recentFlags = await findRecentRiskFlags(since)
      for (const flag of recentFlags) {
        const message = formatRiskFlagMessage(flag)
        for (const sub of riskSubs) {
          if (sub.tokenAddress && sub.tokenAddress !== flag.tokenAddress) continue
          try {
            const ok = await deliverAlert(sub.id, 'RISK_FLAG', sub.telegramId, message)
            if (ok) sent++
            else errors++
          } catch {
            errors++
          }
        }
      }
    } catch (error) {
      console.error('[dispatcher] Error processing RISK_FLAG alerts:', error)
      errors++
    }
  }

  // TOKEN_UPDATE is reserved for future use

  console.log(`[dispatcher] Alert dispatch complete: ${sent} sent, ${errors} errors`)
  return { sent, errors }
}
