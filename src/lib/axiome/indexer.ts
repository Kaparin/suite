// Token metrics indexer for Axiome blockchain

import { prisma } from '@/lib/prisma'
import { axiomeClient } from './client'

interface IndexerResult {
  processed: number
  errors: number
}

// Calculate risk flags based on token data
function calculateRiskFlags(
  tokenAddress: string,
  createdAt: Date,
  holdersCount: number,
  txCount: number
): { flagType: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }[] {
  const flags: { flagType: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }[] = []

  // Check if too new (less than 3 days)
  const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  if (ageInDays < 3) {
    flags.push({ flagType: 'TOO_NEW', severity: 'LOW' })
  }

  // Check low liquidity / holders
  if (holdersCount < 10) {
    flags.push({ flagType: 'HIGH_CONCENTRATION', severity: 'MEDIUM' })
  }

  // Check low activity
  if (txCount < 10 && ageInDays > 1) {
    flags.push({ flagType: 'LOW_LIQUIDITY', severity: 'LOW' })
  }

  return flags
}

// Index metrics for a single token
async function indexTokenMetrics(projectId: string, tokenAddress: string): Promise<boolean> {
  try {
    // Fetch data from blockchain
    const [tokenInfo, transactions] = await Promise.all([
      axiomeClient.getCW20TokenInfo(tokenAddress),
      axiomeClient.getTransactions(tokenAddress, 100)
    ])

    if (!tokenInfo) {
      console.log(`Token info not found for ${tokenAddress}`)
      return false
    }

    // Get holder count (simplified)
    const holdersCount = await axiomeClient.getCW20HolderCount(tokenAddress)

    // Calculate daily metrics
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const txCount = transactions.length
    const volumeEstimate = 0 // Would need price data

    // Upsert metrics
    await prisma.tokenMetric.upsert({
      where: {
        projectId_date: {
          projectId,
          date: today
        }
      },
      update: {
        txCount,
        holdersEstimate: holdersCount,
        volumeEstimate
      },
      create: {
        projectId,
        date: today,
        txCount,
        holdersEstimate: holdersCount,
        volumeEstimate
      }
    })

    // Get project for created date
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (project) {
      // Calculate and update risk flags
      const newFlags = calculateRiskFlags(
        tokenAddress,
        project.createdAt,
        holdersCount,
        txCount
      )

      // Deactivate old flags
      await prisma.riskFlag.updateMany({
        where: { projectId, isActive: true },
        data: { isActive: false }
      })

      // Create new flags
      for (const flag of newFlags) {
        await prisma.riskFlag.create({
          data: {
            projectId,
            flagType: flag.flagType as 'TOO_NEW' | 'NO_SOCIALS' | 'HIGH_CONCENTRATION' | 'LOW_LIQUIDITY' | 'SUDDEN_PUMP' | 'SUDDEN_DUMP' | 'HONEYPOT_SUSPECT' | 'UNLOCKED_SUPPLY',
            severity: flag.severity,
            isActive: true
          }
        })
      }
    }

    console.log(`✅ Indexed ${tokenAddress}: ${txCount} txs, ${holdersCount} holders`)
    return true
  } catch (error) {
    console.error(`Error indexing ${tokenAddress}:`, error)
    return false
  }
}

// Main indexer function - run periodically
export async function runIndexer(): Promise<IndexerResult> {
  console.log('🔄 Starting indexer run...')

  const result: IndexerResult = {
    processed: 0,
    errors: 0
  }

  try {
    // Check API health
    const isHealthy = await axiomeClient.healthCheck()
    if (!isHealthy) {
      console.error('❌ Axiome API is not healthy')
      return result
    }

    // Get all published projects with token addresses
    const projects = await prisma.project.findMany({
      where: {
        status: 'PUBLISHED',
        tokenAddress: { not: null }
      },
      select: {
        id: true,
        tokenAddress: true,
        name: true
      }
    })

    console.log(`Found ${projects.length} tokens to index`)

    // Index each token
    for (const project of projects) {
      if (!project.tokenAddress) continue

      const success = await indexTokenMetrics(project.id, project.tokenAddress)
      if (success) {
        result.processed++
      } else {
        result.errors++
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`✅ Indexer complete: ${result.processed} processed, ${result.errors} errors`)
  } catch (error) {
    console.error('Indexer error:', error)
  }

  return result
}

// Check for social links and update NO_SOCIALS flag
export async function checkSocialLinks(): Promise<void> {
  const projects = await prisma.project.findMany({
    where: { status: 'PUBLISHED' }
  })

  for (const project of projects) {
    const links = project.links as { telegram?: string; twitter?: string; website?: string } | null

    const hasSocials = links && (links.telegram || links.twitter || links.website)

    if (!hasSocials) {
      // Check if flag already exists
      const existingFlag = await prisma.riskFlag.findFirst({
        where: {
          projectId: project.id,
          flagType: 'NO_SOCIALS',
          isActive: true
        }
      })

      if (!existingFlag) {
        await prisma.riskFlag.create({
          data: {
            projectId: project.id,
            flagType: 'NO_SOCIALS',
            severity: 'LOW',
            isActive: true
          }
        })
      }
    } else {
      // Remove NO_SOCIALS flag if it exists
      await prisma.riskFlag.updateMany({
        where: {
          projectId: project.id,
          flagType: 'NO_SOCIALS'
        },
        data: { isActive: false }
      })
    }
  }
}
