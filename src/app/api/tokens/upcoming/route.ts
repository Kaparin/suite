import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ProjectStatus, Prisma } from '@prisma/client'

interface UpcomingToken {
  id: string
  name: string
  ticker: string
  logo?: string | null
  descriptionShort?: string | null
  descriptionLong?: string | null
  status: string
  decimals: number
  initialSupply?: string | null
  estimatedLaunchDate?: string | null
  presaleStartDate?: string | null
  presaleEndDate?: string | null
  links?: {
    telegram?: string
    twitter?: string
    website?: string
    discord?: string
  } | null
  createdAt: string
  owner: {
    id: string
    telegramUsername?: string | null
    telegramFirstName?: string | null
    telegramPhotoUrl?: string | null
  } | null
  _count: {
    comments: number
    reactions: number
  }
}

// GET /api/tokens/upcoming - Database tokens (UPCOMING, PRESALE)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') // UPCOMING, PRESALE, or null for both
  const search = searchParams.get('search') || ''
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  const sortBy = searchParams.get('sortBy') || 'createdAt' // createdAt, launchDate, popular
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  try {
    // Build where clause
    const where: Prisma.ProjectWhereInput = {}

    // Filter by status
    if (status === 'UPCOMING') {
      where.status = ProjectStatus.UPCOMING
    } else if (status === 'PRESALE') {
      where.status = ProjectStatus.PRESALE
    } else {
      // Default: show both UPCOMING and PRESALE
      where.status = { in: [ProjectStatus.UPCOMING, ProjectStatus.PRESALE] }
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { ticker: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Determine sort order
    let orderBy: Record<string, string> = { createdAt: sortOrder }

    if (sortBy === 'launchDate') {
      orderBy = { estimatedLaunchDate: sortOrder }
    } else if (sortBy === 'popular') {
      // Sort by engagement (reactions count) - handled after fetch
      orderBy = { createdAt: 'desc' }
    }

    // Fetch projects
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          owner: {
            select: {
              id: true,
              telegramUsername: true,
              telegramFirstName: true,
              telegramPhotoUrl: true
            }
          },
          _count: {
            select: {
              comments: true,
              reactions: true
            }
          }
        }
      }),
      prisma.project.count({ where })
    ])

    // Transform to response format
    let tokens: UpcomingToken[] = projects.map(p => ({
      id: p.id,
      name: p.name,
      ticker: p.ticker,
      logo: p.logo,
      descriptionShort: p.descriptionShort,
      descriptionLong: p.descriptionLong,
      status: p.status,
      decimals: p.decimals,
      initialSupply: p.initialSupply,
      estimatedLaunchDate: p.estimatedLaunchDate?.toISOString() || null,
      presaleStartDate: p.presaleStartDate?.toISOString() || null,
      presaleEndDate: p.presaleEndDate?.toISOString() || null,
      links: p.links as UpcomingToken['links'],
      createdAt: p.createdAt.toISOString(),
      owner: p.owner,
      _count: p._count
    }))

    // Sort by popularity if requested
    if (sortBy === 'popular') {
      tokens = tokens.sort((a, b) => {
        const aScore = a._count.reactions + a._count.comments
        const bScore = b._count.reactions + b._count.comments
        return sortOrder === 'desc' ? bScore - aScore : aScore - bScore
      })
    }

    // Count by status
    const [upcomingCount, presaleCount] = await Promise.all([
      prisma.project.count({ where: { status: ProjectStatus.UPCOMING } }),
      prisma.project.count({ where: { status: ProjectStatus.PRESALE } })
    ])

    return NextResponse.json({
      tokens,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      counts: {
        all: upcomingCount + presaleCount,
        upcoming: upcomingCount,
        presale: presaleCount
      }
    })
  } catch (error) {
    console.error('Error fetching upcoming tokens:', error)
    return NextResponse.json(
      { error: 'Failed to fetch upcoming tokens' },
      { status: 500 }
    )
  }
}
