import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySessionTokenV2 } from '@/lib/auth/telegram'

/**
 * POST /api/admin/merge-project
 * Merge a placeholder project with an existing project by linking tokenAddress
 * and optionally deleting the placeholder.
 *
 * Body: {
 *   projectId: string        // The original project to update
 *   tokenAddress: string     // The token address to link
 *   deletePlaceholder?: boolean  // Whether to delete placeholder with same tokenAddress
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifySessionTokenV2(token)
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, tokenAddress, deletePlaceholder = true } = body

    if (!projectId || !tokenAddress) {
      return NextResponse.json(
        { error: 'projectId and tokenAddress are required' },
        { status: 400 }
      )
    }

    // Find the original project
    const originalProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true, name: true, ticker: true, tokenAddress: true }
    })

    if (!originalProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check ownership
    if (originalProject.ownerId !== decoded.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Check if project already has a different tokenAddress
    if (originalProject.tokenAddress && originalProject.tokenAddress !== tokenAddress) {
      return NextResponse.json(
        { error: 'Project already linked to a different token' },
        { status: 400 }
      )
    }

    // Find placeholder project with same tokenAddress (if exists)
    const placeholderProject = await prisma.project.findFirst({
      where: {
        tokenAddress: tokenAddress,
        id: { not: projectId }
      },
      select: { id: true, name: true, ticker: true }
    })

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // If placeholder exists and we should delete it
      if (placeholderProject && deletePlaceholder) {
        // Transfer any comments/reactions to original project
        await tx.comment.updateMany({
          where: { projectId: placeholderProject.id },
          data: { projectId: projectId }
        })

        await tx.reaction.updateMany({
          where: { projectId: placeholderProject.id },
          data: { projectId: projectId }
        })

        // Delete the placeholder
        await tx.project.delete({
          where: { id: placeholderProject.id }
        })
      }

      // Update original project with tokenAddress and status
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: {
          tokenAddress: tokenAddress,
          status: 'LAUNCHED'
        }
      })

      return {
        project: updatedProject,
        placeholderDeleted: placeholderProject ? placeholderProject.id : null,
        commentsTransferred: placeholderProject ? true : false
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Project linked to token successfully',
      ...result
    })
  } catch (error) {
    console.error('Error merging project:', error)
    return NextResponse.json(
      { error: 'Failed to merge project' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/merge-project?tokenAddress=xxx
 * Find projects that could be merged (both placeholder and original)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifySessionTokenV2(token)
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tokenAddress = searchParams.get('tokenAddress')

    if (!tokenAddress) {
      return NextResponse.json({ error: 'tokenAddress is required' }, { status: 400 })
    }

    // Find all projects related to this token address or owned by user
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { tokenAddress: tokenAddress },
          { ownerId: decoded.userId }
        ]
      },
      select: {
        id: true,
        name: true,
        ticker: true,
        tokenAddress: true,
        status: true,
        ownerId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    })

    // Identify placeholder vs original
    const placeholder = projects.find(p =>
      p.tokenAddress === tokenAddress &&
      (p.name === 'Unclaimed Token' || p.ticker === 'TOKEN')
    )

    const userProjects = projects.filter(p => p.ownerId === decoded.userId)

    return NextResponse.json({
      placeholder,
      userProjects,
      canMerge: placeholder && userProjects.length > 0
    })
  } catch (error) {
    console.error('Error finding projects:', error)
    return NextResponse.json({ error: 'Failed to find projects' }, { status: 500 })
  }
}
