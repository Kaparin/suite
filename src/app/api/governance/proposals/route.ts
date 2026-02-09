import { NextRequest, NextResponse } from 'next/server'
import { verifySessionTokenV2 } from '@/lib/auth/telegram'
import { prisma } from '@/lib/prisma'
import { canPropose, getVotingPower } from '@/lib/governance/voting-power'

/**
 * GET /api/governance/proposals
 * List proposals, optionally filtered by status.
 * Query params: ?status=ACTIVE (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where = status ? { status: status as 'ACTIVE' | 'PASSED' | 'REJECTED' | 'EXECUTED' | 'EXPIRED' } : {}

    const proposals = await prisma.proposal.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            telegramUsername: true,
            telegramFirstName: true,
          },
        },
        _count: {
          select: { votes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // If the user is authenticated, include their vote info
    let userId: string | null = null
    const authHeader = request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const decoded = verifySessionTokenV2(authHeader.substring(7))
      if (decoded) {
        userId = decoded.userId
      }
    }

    let userVotes: Record<string, boolean> = {}
    let userVotingPower = 0

    if (userId) {
      const votes = await prisma.vote.findMany({
        where: {
          userId,
          proposalId: { in: proposals.map(p => p.id) },
        },
      })
      userVotes = Object.fromEntries(votes.map(v => [v.proposalId, v.inFavor]))
      userVotingPower = await getVotingPower(userId)
    }

    return NextResponse.json({
      proposals: proposals.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        type: p.type,
        projectId: p.projectId,
        quorum: p.quorum,
        threshold: p.threshold,
        startDate: p.startDate.toISOString(),
        endDate: p.endDate.toISOString(),
        status: p.status,
        votesFor: p.votesFor,
        votesAgainst: p.votesAgainst,
        totalVotes: p._count.votes,
        author: {
          id: p.author.id,
          username: p.author.telegramUsername,
          firstName: p.author.telegramFirstName,
        },
        userVote: userId ? (userVotes[p.id] ?? null) : null,
        createdAt: p.createdAt.toISOString(),
      })),
      userVotingPower,
    })
  } catch (error) {
    console.error('[Governance GET] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * POST /api/governance/proposals
 * Create a new proposal. Requires GOVERNOR tier.
 *
 * Body: { title, description, type, projectId?, durationDays }
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const decoded = verifySessionTokenV2(authHeader.substring(7))
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  try {
    // Check GOVERNOR tier
    const allowed = await canPropose(decoded.userId)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Requires GOVERNOR tier to create proposals' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, type, projectId, durationDays } = body

    // Validate required fields
    if (!title || !description || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, type' },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ['FEATURE_PROJECT', 'DELIST_PROJECT', 'PLATFORM_CHANGE', 'COMMUNITY_PICK']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate projectId for project-related proposals
    if ((type === 'FEATURE_PROJECT' || type === 'DELIST_PROJECT') && !projectId) {
      return NextResponse.json(
        { error: 'projectId is required for project-related proposals' },
        { status: 400 }
      )
    }

    // Validate duration (default 7 days, max 30)
    const duration = Math.min(Math.max(Number(durationDays) || 7, 1), 30)

    const endDate = new Date()
    endDate.setDate(endDate.getDate() + duration)

    const proposal = await prisma.proposal.create({
      data: {
        authorId: decoded.userId,
        title: String(title).slice(0, 200),
        description: String(description).slice(0, 5000),
        type,
        projectId: projectId || null,
        endDate,
      },
    })

    return NextResponse.json({
      success: true,
      proposal: {
        id: proposal.id,
        title: proposal.title,
        description: proposal.description,
        type: proposal.type,
        status: proposal.status,
        endDate: proposal.endDate.toISOString(),
        createdAt: proposal.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('[Governance POST] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
