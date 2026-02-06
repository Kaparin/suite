import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySessionTokenV2 } from '@/lib/auth'
import { KNOWN_TOKENS } from '@/lib/axiome/token-registry'

const REST_URL = process.env.AXIOME_REST_URL

// Get minter (owner) from chain
async function getChainMinter(contractAddress: string): Promise<string | null> {
  if (!REST_URL) return null

  try {
    const query = Buffer.from(JSON.stringify({ minter: {} })).toString('base64')
    const response = await fetch(
      `${REST_URL}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
      { next: { revalidate: 300 } }
    )

    if (response.ok) {
      const data = await response.json()
      if (data.data) {
        let info
        if (typeof data.data === 'string') {
          info = JSON.parse(Buffer.from(data.data, 'base64').toString())
        } else {
          info = data.data
        }
        return info.minter || null
      }
    }
  } catch {
    // No minter
  }
  return null
}

// Get token info from chain
async function getChainTokenInfo(contractAddress: string): Promise<{
  name: string
  symbol: string
  decimals: number
  total_supply: string
} | null> {
  if (!REST_URL) return null

  try {
    const query = Buffer.from(JSON.stringify({ token_info: {} })).toString('base64')
    const response = await fetch(
      `${REST_URL}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
      { next: { revalidate: 300 } }
    )

    if (response.ok) {
      const data = await response.json()
      if (data.data) {
        let tokenInfo
        if (typeof data.data === 'string') {
          tokenInfo = JSON.parse(Buffer.from(data.data, 'base64').toString())
        } else {
          tokenInfo = data.data
        }
        return tokenInfo
      }
    }
  } catch {
    // Not a valid CW20
  }
  return null
}

// Get marketing info from chain
async function getChainMarketingInfo(contractAddress: string): Promise<{
  description?: string
  logo?: { url?: string }
} | null> {
  if (!REST_URL) return null

  try {
    const query = Buffer.from(JSON.stringify({ marketing_info: {} })).toString('base64')
    const response = await fetch(
      `${REST_URL}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
      { next: { revalidate: 300 } }
    )

    if (response.ok) {
      const data = await response.json()
      if (data.data) {
        let info
        if (typeof data.data === 'string') {
          info = JSON.parse(Buffer.from(data.data, 'base64').toString())
        } else {
          info = data.data
        }
        return info
      }
    }
  } catch {
    // No marketing info
  }
  return null
}

// GET /api/tokens/[address] - получить токен по адресу или ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params

    // Сначала ищем по tokenAddress, потом по ID
    let project = await prisma.project.findUnique({
      where: { tokenAddress: address },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            wallets: {
              where: { isPrimary: true },
              select: { address: true },
              take: 1
            },
          },
        },
        metrics: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        riskFlags: {
          where: { isActive: true },
        },
      },
    })

    // Если не найден по адресу, ищем по ID
    if (!project) {
      project = await prisma.project.findUnique({
        where: { id: address },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              wallets: {
                where: { isPrimary: true },
                select: { address: true },
                take: 1
              },
            },
          },
          metrics: {
            orderBy: { date: 'desc' },
            take: 30,
          },
          riskFlags: {
            where: { isActive: true },
          },
        },
      })
    }

    // Get chain minter for ownership verification
    let chainMinter: string | null = null
    if (project?.tokenAddress || address.startsWith('axm')) {
      chainMinter = await getChainMinter(project?.tokenAddress || address)
    }

    if (!project) {
      // Try to get token info from chain
      const chainTokenInfo = await getChainTokenInfo(address)
      const chainMarketingInfo = await getChainMarketingInfo(address)

      // Check if it's a known token
      const knownToken = KNOWN_TOKENS.find(
        t => t.contractAddress.toLowerCase() === address.toLowerCase()
      )

      if (chainTokenInfo || knownToken) {
        // Token exists on chain, return chain data
        return NextResponse.json({
          project: {
            id: null,
            name: knownToken?.name || chainTokenInfo?.name || 'Unknown Token',
            ticker: knownToken?.symbol || chainTokenInfo?.symbol || 'TOKEN',
            tokenAddress: address,
            descriptionShort: chainMarketingInfo?.description || null,
            descriptionLong: null,
            logo: knownToken?.logoUrl || chainMarketingInfo?.logo?.url || null,
            links: null,
            tokenomics: chainTokenInfo ? {
              supply: chainTokenInfo.total_supply,
              decimals: chainTokenInfo.decimals
            } : null,
            isVerified: knownToken?.verified || false,
            createdAt: null, // Unknown for chain-discovered tokens without DB record
            riskFlags: [],
            owner: chainMinter ? { wallets: [{ address: chainMinter }] } : null,
          },
          score: knownToken?.verified ? 80 : 50,
          metrics: { holders: 0, txCount: 0, volume24h: 0 },
          chainMinter,
        })
      }

      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      )
    }

    // Вычисляем score на основе метрик и флагов
    const latestMetric = project.metrics[0]
    const riskCount = project.riskFlags.length

    let score = 100
    // Уменьшаем score за каждый риск-флаг
    score -= riskCount * 15
    // Увеличиваем за активность
    if (latestMetric) {
      if (latestMetric.txCount > 100) score += 5
      if (latestMetric.holdersEstimate > 50) score += 5
    }
    // Ограничиваем score в пределах 0-100
    score = Math.max(0, Math.min(100, score))

    return NextResponse.json({
      project,
      score,
      metrics: {
        holders: latestMetric?.holdersEstimate || 0,
        txCount: latestMetric?.txCount || 0,
        volume24h: latestMetric?.volumeEstimate || 0,
      },
      chainMinter,
    })
  } catch (error) {
    console.error('Error fetching token:', error)
    return NextResponse.json(
      { error: 'Failed to fetch token' },
      { status: 500 }
    )
  }
}

// PATCH /api/tokens/[address] - обновить данные токена (только для владельца)
// Requires JWT authentication via Authorization header
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params

    // Verify JWT token from Authorization header (supports both old wallet auth and new Telegram auth)
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required. Please verify your wallet first.' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Verify V2 session token
    const decoded = verifySessionTokenV2(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please log in again.' },
        { status: 401 }
      )
    }

    // Get user's wallets for ownership check
    const userWallets = await prisma.wallet.findMany({
      where: { userId: decoded.userId },
      select: { address: true }
    })
    const userWalletAddresses = userWallets.map(w => w.address.toLowerCase())

    const body = await request.json()
    const {
      name,
      descriptionShort,
      descriptionLong,
      links,
      logo,
    } = body

    // Find project by token address
    let project = await prisma.project.findUnique({
      where: { tokenAddress: address },
      include: {
        owner: {
          select: {
            id: true,
            wallets: {
              where: { isPrimary: true },
              select: { address: true },
              take: 1
            }
          }
        }
      },
    })

    // Also try by ID
    if (!project) {
      project = await prisma.project.findUnique({
        where: { id: address },
        include: {
          owner: {
            select: {
              id: true,
              wallets: {
                where: { isPrimary: true },
                select: { address: true },
                take: 1
              }
            }
          }
        },
      })
    }

    // Get chain minter for verification
    const chainMinter = await getChainMinter(project?.tokenAddress || address)

    // Check ownership: either DB owner or user owns a wallet that is the chain minter
    const ownerWalletAddress = project?.owner?.wallets?.[0]?.address?.toLowerCase()
    const isOwner =
      project?.ownerId === decoded.userId ||
      (ownerWalletAddress && userWalletAddresses.includes(ownerWalletAddress)) ||
      (chainMinter && userWalletAddresses.includes(chainMinter.toLowerCase()))

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Not authorized to edit this token' },
        { status: 403 }
      )
    }

    // If project doesn't exist but caller is chain minter, create it
    const minterWallet = chainMinter ? userWalletAddresses.find(w => w === chainMinter.toLowerCase()) : null
    if (!project && minterWallet) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Create project
      project = await prisma.project.create({
        data: {
          ownerId: user.id,
          tokenAddress: address,
          name: name || 'Unnamed Token',
          ticker: body.ticker || 'TOKEN',
          descriptionShort,
          descriptionLong,
          links,
          logo,
          status: 'LAUNCHED',
        },
        include: {
          owner: {
            select: {
              id: true,
              wallets: {
                where: { isPrimary: true },
                select: { address: true },
                take: 1
              }
            }
          }
        },
      })

      return NextResponse.json({ project, created: true })
    }

    if (!project) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      )
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: {
        ...(name && { name }),
        ...(descriptionShort !== undefined && { descriptionShort }),
        ...(descriptionLong !== undefined && { descriptionLong }),
        ...(links !== undefined && { links }),
        ...(logo !== undefined && { logo }),
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            wallets: {
              where: { isPrimary: true },
              select: { address: true },
              take: 1
            },
          },
        },
      },
    })

    return NextResponse.json({ project: updatedProject })
  } catch (error) {
    console.error('Error updating token:', error)
    return NextResponse.json(
      { error: 'Failed to update token' },
      { status: 500 }
    )
  }
}
