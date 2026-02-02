import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySessionToken } from '@/lib/auth'

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
            walletAddress: true,
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
              walletAddress: true,
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
      // If project not in DB but we have chain minter, return minimal data
      if (chainMinter) {
        return NextResponse.json({
          project: {
            id: null,
            name: 'Unknown Token',
            ticker: 'TOKEN',
            tokenAddress: address,
            descriptionShort: null,
            descriptionLong: null,
            links: null,
            tokenomics: null,
            isVerified: false,
            createdAt: new Date().toISOString(),
            riskFlags: [],
            owner: { walletAddress: chainMinter },
          },
          score: 50,
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

    // Verify JWT token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required. Please verify your wallet first.' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const session = verifySessionToken(token)

    if (!session || !session.verified) {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please verify your wallet again.' },
        { status: 401 }
      )
    }

    const walletAddress = session.walletAddress

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
      include: { owner: true },
    })

    // Also try by ID
    if (!project) {
      project = await prisma.project.findUnique({
        where: { id: address },
        include: { owner: true },
      })
    }

    // Get chain minter for verification
    const chainMinter = await getChainMinter(project?.tokenAddress || address)

    // Check ownership: either DB owner or chain minter
    const isOwner =
      project?.owner?.walletAddress?.toLowerCase() === walletAddress.toLowerCase() ||
      chainMinter?.toLowerCase() === walletAddress.toLowerCase()

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Not authorized to edit this token' },
        { status: 403 }
      )
    }

    // If project doesn't exist but caller is chain minter, create it
    if (!project && chainMinter?.toLowerCase() === walletAddress.toLowerCase()) {
      // First, find or create user
      let user = await prisma.user.findUnique({
        where: { walletAddress: walletAddress.toLowerCase() },
      })

      if (!user) {
        user = await prisma.user.create({
          data: { walletAddress: walletAddress.toLowerCase() },
        })
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
          status: 'PUBLISHED',
        },
        include: { owner: true },
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
            walletAddress: true,
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
