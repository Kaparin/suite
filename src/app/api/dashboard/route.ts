import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySessionTokenV2 } from '@/lib/auth/telegram'

export async function GET(request: NextRequest) {
  // Verify authentication
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.substring(7)
  const decoded = verifySessionTokenV2(token)
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  try {
    // Get user's projects directly via userId
    const projects = await prisma.project.findMany({
      where: { ownerId: decoded.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        ticker: true,
        status: true,
        tokenAddress: true,
        createdAt: true,
        logo: true
      }
    })

    // Calculate stats
    const totalProjects = projects.length
    const launchedProjects = projects.filter(p => p.status === 'LAUNCHED').length
    const draftProjects = projects.filter(p => p.status === 'DRAFT').length

    return NextResponse.json({
      projects: projects.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString()
      })),
      stats: {
        totalProjects,
        launchedProjects,
        draftProjects
      }
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
