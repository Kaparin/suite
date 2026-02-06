import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySessionTokenV2 } from '@/lib/auth/telegram'
import { getRegisteredToken } from '@/lib/axiome/token-registry'

type ReactionType = 'ROCKET' | 'FIRE' | 'HEART' | 'EYES' | 'WARNING'

// Helper to find project by ID or token address
async function findProject(idOrAddress: string) {
  // First try to find by project ID
  let project = await prisma.project.findUnique({
    where: { id: idOrAddress }
  })

  if (project) return project

  // Try to find by token address
  project = await prisma.project.findUnique({
    where: { tokenAddress: idOrAddress }
  })

  return project
}

// GET /api/projects/[id]/reactions - Get reactions for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Find project by ID or token address
    const project = await findProject(id)

    if (!project) {
      // Return empty counts for non-existent projects
      return NextResponse.json({
        counts: { ROCKET: 0, FIRE: 0, HEART: 0, EYES: 0, WARNING: 0 },
        userReactions: [],
        total: 0
      })
    }

    // Get reaction counts by type
    const reactionCounts = await prisma.reaction.groupBy({
      by: ['type'],
      where: { projectId: project.id },
      _count: { type: true }
    })

    // Get current user's reactions if authenticated
    let userReactions: ReactionType[] = []
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = verifySessionTokenV2(token)
      if (decoded) {
        const reactions = await prisma.reaction.findMany({
          where: {
            projectId: project.id,
            userId: decoded.userId
          },
          select: { type: true }
        })
        userReactions = reactions.map(r => r.type)
      }
    }

    // Format counts
    const counts: Record<ReactionType, number> = {
      ROCKET: 0,
      FIRE: 0,
      HEART: 0,
      EYES: 0,
      WARNING: 0
    }

    for (const r of reactionCounts) {
      counts[r.type] = r._count.type
    }

    return NextResponse.json({
      counts,
      userReactions,
      total: Object.values(counts).reduce((a, b) => a + b, 0)
    })
  } catch (error) {
    console.error('Error fetching reactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reactions' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/reactions - Toggle a reaction (requires auth)
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
    const { type } = body as { type: ReactionType }

    const validTypes: ReactionType[] = ['ROCKET', 'FIRE', 'HEART', 'EYES', 'WARNING']
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid reaction type' },
        { status: 400 }
      )
    }

    // Find project by ID or token address
    let project = await findProject(id)

    // If project doesn't exist but this is a chain token, create a placeholder project
    if (!project && id.startsWith('axm')) {
      // Check token registry for known token info
      const knownToken = getRegisteredToken(id)

      // Create system user if needed
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
          tokenAddress: id,
          name: knownToken?.name || 'Unclaimed Token',
          ticker: knownToken?.symbol || 'TOKEN',
          logo: knownToken?.logoUrl || null,
          isVerified: knownToken?.verified || false,
          ownerId: systemUser.id,
          status: 'LAUNCHED'
        }
      })
    }

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if reaction already exists
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        projectId_userId_type: {
          projectId: project.id,
          userId: decoded.userId,
          type
        }
      }
    })

    if (existingReaction) {
      // Remove reaction (toggle off)
      await prisma.reaction.delete({
        where: { id: existingReaction.id }
      })

      return NextResponse.json({
        action: 'removed',
        type
      })
    } else {
      // Add reaction (toggle on)
      await prisma.reaction.create({
        data: {
          projectId: project.id,
          userId: decoded.userId,
          type
        }
      })

      return NextResponse.json({
        action: 'added',
        type
      })
    }
  } catch (error) {
    console.error('Error toggling reaction:', error)
    return NextResponse.json(
      { error: 'Failed to toggle reaction' },
      { status: 500 }
    )
  }
}
