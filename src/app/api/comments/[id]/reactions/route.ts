import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySessionTokenV2 } from '@/lib/auth/telegram'

const VALID_TYPES = ['LIKE', 'DISLIKE', 'LAUGH', 'LOVE'] as const
type CommentReactionType = typeof VALID_TYPES[number]

// GET /api/comments/[id]/reactions - Get reactions for a comment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get current user's reactions if authenticated
    const authHeader = request.headers.get('authorization')
    let userId: string | null = null
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = verifySessionTokenV2(token)
      if (decoded) {
        userId = decoded.userId
      }
    }

    // Get reaction counts
    const reactions = await prisma.commentReaction.groupBy({
      by: ['type'],
      where: { commentId: id },
      _count: { type: true }
    })

    const counts: Record<string, number> = {}
    for (const r of reactions) {
      counts[r.type] = r._count.type
    }

    // Get user's reactions
    let userReactions: string[] = []
    if (userId) {
      const myReactions = await prisma.commentReaction.findMany({
        where: { commentId: id, userId },
        select: { type: true }
      })
      userReactions = myReactions.map(r => r.type)
    }

    return NextResponse.json({ counts, userReactions })
  } catch (error) {
    console.error('Error fetching comment reactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reactions' },
      { status: 500 }
    )
  }
}

// POST /api/comments/[id]/reactions - Toggle a reaction
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
    const { type } = body

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid reaction type' },
        { status: 400 }
      )
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true }
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if reaction exists
    const existing = await prisma.commentReaction.findUnique({
      where: {
        commentId_userId_type: {
          commentId: id,
          userId: decoded.userId,
          type: type as CommentReactionType
        }
      }
    })

    if (existing) {
      // Remove reaction
      await prisma.commentReaction.delete({
        where: { id: existing.id }
      })
      return NextResponse.json({ action: 'removed', type })
    } else {
      // Add reaction
      await prisma.commentReaction.create({
        data: {
          commentId: id,
          userId: decoded.userId,
          type: type as CommentReactionType
        }
      })
      return NextResponse.json({ action: 'added', type })
    }
  } catch (error) {
    console.error('Error toggling comment reaction:', error)
    return NextResponse.json(
      { error: 'Failed to toggle reaction' },
      { status: 500 }
    )
  }
}
