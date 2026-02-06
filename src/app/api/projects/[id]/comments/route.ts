import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySessionTokenV2 } from '@/lib/auth/telegram'
import { getRegisteredToken } from '@/lib/axiome/token-registry'

// Helper to find or create project by ID or token address
async function findOrCreateProject(idOrAddress: string, createIfMissing: boolean = false) {
  // First try to find by project ID
  let project = await prisma.project.findUnique({
    where: { id: idOrAddress }
  })

  if (project) return project

  // Try to find by token address
  project = await prisma.project.findUnique({
    where: { tokenAddress: idOrAddress }
  })

  if (project) return project

  // If not found and createIfMissing is true, create a minimal project for chain token
  if (createIfMissing && idOrAddress.startsWith('axm')) {
    // Check token registry for known token info
    const knownToken = getRegisteredToken(idOrAddress)

    // Find or create system user for placeholder ownership
    let systemUser = await prisma.user.findFirst({
      where: { telegramId: 'SYSTEM' }
    })

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          telegramId: 'SYSTEM',
          username: 'System',
          telegramFirstName: 'System'
        }
      })
    }

    project = await prisma.project.create({
      data: {
        tokenAddress: idOrAddress,
        name: knownToken?.name || 'Unclaimed Token',
        ticker: knownToken?.symbol || 'TOKEN',
        logo: knownToken?.logoUrl || null,
        isVerified: knownToken?.verified || false,
        ownerId: systemUser.id,
        status: 'LAUNCHED'
      }
    })
    return project
  }

  return null
}

// GET /api/projects/[id]/comments - Get comments for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Find project by ID or token address
    const project = await findOrCreateProject(id)

    if (!project) {
      return NextResponse.json({
        comments: [],
        pagination: { total: 0, limit, offset, hasMore: false }
      })
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              telegramUsername: true,
              telegramFirstName: true,
              telegramPhotoUrl: true
            }
          }
        }
      }),
      prisma.comment.count({ where: { projectId: project.id } })
    ])

    return NextResponse.json({
      comments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/comments - Add a comment (requires auth)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Comment too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    // Find or create project (auto-creates for chain tokens)
    const project = await findOrCreateProject(id, true)

    if (!project) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      )
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        projectId: project.id,
        userId: decoded.userId,
        content: content.trim()
      },
      include: {
        user: {
          select: {
            id: true,
            telegramUsername: true,
            telegramFirstName: true,
            telegramPhotoUrl: true
          }
        }
      }
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
