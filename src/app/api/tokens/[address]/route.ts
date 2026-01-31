import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    if (!project) {
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
    })
  } catch (error) {
    console.error('Error fetching token:', error)
    return NextResponse.json(
      { error: 'Failed to fetch token' },
      { status: 500 }
    )
  }
}
