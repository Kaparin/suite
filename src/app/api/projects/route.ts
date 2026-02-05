import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySessionTokenV2 } from '@/lib/auth/telegram'

type ProjectStatus = 'DRAFT' | 'UPCOMING' | 'PRESALE' | 'PUBLISHED' | 'LAUNCHED' | 'ARCHIVED'

// GET /api/projects - список проектов
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PUBLISHED'
    const ownerId = searchParams.get('ownerId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: { status?: ProjectStatus; ownerId?: string } = {}

    if (status && status !== 'ALL') {
      where.status = status as ProjectStatus
    }

    if (ownerId) {
      where.ownerId = ownerId
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
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
        metrics: {
          orderBy: { date: 'desc' },
          take: 1,
        },
        riskFlags: {
          where: { isActive: true },
        },
        _count: {
          select: {
            comments: true,
            reactions: true
          }
        }
      },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - создать проект (requires verified user = has wallet)
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifySessionTokenV2(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = decoded.userId

    // Check if user has at least one verified wallet
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallets: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    if (user.wallets.length === 0) {
      return NextResponse.json(
        { error: 'Wallet verification required to create tokens' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      ticker,
      logo,
      descriptionShort,
      descriptionLong,
      decimals,
      initialSupply,
      tokenomics,
      links,
      launchPlan,
      faq,
      promoTexts,
      estimatedLaunchDate,
      status = 'DRAFT'
    } = body

    if (!name || !ticker) {
      return NextResponse.json(
        { error: 'Name and ticker are required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses: ProjectStatus[] = ['DRAFT', 'UPCOMING']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be DRAFT or UPCOMING' },
        { status: 400 }
      )
    }

    // Use primary wallet as creatorWallet
    const primaryWallet = user.wallets.find(w => w.isPrimary) || user.wallets[0]

    const project = await prisma.project.create({
      data: {
        name,
        ticker: ticker.toUpperCase(),
        logo,
        descriptionShort,
        descriptionLong,
        decimals: decimals || 6,
        initialSupply,
        tokenomics,
        links,
        launchPlan,
        faq,
        promoTexts,
        estimatedLaunchDate: estimatedLaunchDate ? new Date(estimatedLaunchDate) : null,
        ownerId: userId,
        creatorWallet: primaryWallet?.address || null,
        status: status as ProjectStatus,
      },
      include: {
        owner: {
          select: {
            id: true,
            telegramUsername: true,
            telegramFirstName: true
          }
        }
      }
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
