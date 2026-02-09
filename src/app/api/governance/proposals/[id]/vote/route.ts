import { NextRequest, NextResponse } from 'next/server'
import { verifySessionTokenV2 } from '@/lib/auth/telegram'
import { prisma } from '@/lib/prisma'
import { canVote, getVotingPower } from '@/lib/governance/voting-power'

/**
 * POST /api/governance/proposals/[id]/vote
 * Vote on a proposal. Requires EXPLORER+ tier.
 *
 * Body: { inFavor: boolean }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const decoded = verifySessionTokenV2(authHeader.substring(7))
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  try {
    const { id: proposalId } = await params

    // Check voting eligibility
    const allowed = await canVote(decoded.userId)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Requires EXPLORER tier or higher to vote' },
        { status: 403 }
      )
    }

    // Get the proposal
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    if (proposal.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Proposal is no longer active' }, { status: 400 })
    }

    if (new Date() > proposal.endDate) {
      return NextResponse.json({ error: 'Voting period has ended' }, { status: 400 })
    }

    // Check if already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        proposalId_userId: {
          proposalId,
          userId: decoded.userId,
        },
      },
    })

    if (existingVote) {
      return NextResponse.json({ error: 'Already voted on this proposal' }, { status: 409 })
    }

    // Parse body
    const body = await request.json()
    const { inFavor } = body

    if (typeof inFavor !== 'boolean') {
      return NextResponse.json(
        { error: 'inFavor must be a boolean' },
        { status: 400 }
      )
    }

    // Calculate voting power
    const votingPower = await getVotingPower(decoded.userId)
    if (votingPower <= 0) {
      return NextResponse.json(
        { error: 'No voting power. Lock LAUNCH tokens first.' },
        { status: 403 }
      )
    }

    // Create vote and update proposal tallies in a transaction
    const [vote, updatedProposal] = await prisma.$transaction([
      prisma.vote.create({
        data: {
          proposalId,
          userId: decoded.userId,
          inFavor,
          votingPower,
        },
      }),
      prisma.proposal.update({
        where: { id: proposalId },
        data: inFavor
          ? { votesFor: { increment: votingPower } }
          : { votesAgainst: { increment: votingPower } },
      }),
    ])

    return NextResponse.json({
      success: true,
      vote: {
        id: vote.id,
        inFavor: vote.inFavor,
        votingPower: vote.votingPower,
      },
      proposal: {
        votesFor: updatedProposal.votesFor,
        votesAgainst: updatedProposal.votesAgainst,
      },
    })
  } catch (error) {
    console.error('[Governance Vote] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
