import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 })
  }

  try {
    // Find user by wallet address
    const user = await prisma.user.findFirst({
      where: { walletAddress: address }
    })

    if (!user) {
      // Return empty dashboard for new users
      return NextResponse.json({
        projects: [],
        stats: {
          totalProjects: 0,
          publishedProjects: 0,
          draftProjects: 0
        }
      })
    }

    // Get user's projects
    const projects = await prisma.project.findMany({
      where: { ownerId: user.id },
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
    const publishedProjects = projects.filter(p => p.status === 'PUBLISHED').length
    const draftProjects = projects.filter(p => p.status === 'DRAFT').length

    return NextResponse.json({
      projects: projects.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString()
      })),
      stats: {
        totalProjects,
        publishedProjects,
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
