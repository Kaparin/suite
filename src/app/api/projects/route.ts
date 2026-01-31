import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/projects - список проектов
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PUBLISHED'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const projects = await prisma.project.findMany({
      where: {
        status: status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
      include: {
        metrics: {
          orderBy: { date: 'desc' },
          take: 1,
        },
        riskFlags: {
          where: { isActive: true },
        },
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

// POST /api/projects - создать проект
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      ticker,
      descriptionShort,
      descriptionLong,
      tokenomics,
      links,
      launchPlan,
      faq,
      promoTexts,
      ownerId,
    } = body

    if (!name || !ticker) {
      return NextResponse.json(
        { error: 'Name and ticker are required' },
        { status: 400 }
      )
    }

    // Создаём временного пользователя если нет ownerId
    let userId = ownerId
    if (!userId) {
      const tempUser = await prisma.user.create({
        data: {
          username: `user_${Date.now()}`,
        },
      })
      userId = tempUser.id
    }

    const project = await prisma.project.create({
      data: {
        name,
        ticker,
        descriptionShort,
        descriptionLong,
        tokenomics,
        links,
        launchPlan,
        faq,
        promoTexts,
        ownerId: userId,
        status: 'DRAFT',
      },
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
