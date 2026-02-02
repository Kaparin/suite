import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTelegramSessionToken } from '@/lib/auth/telegram'
import { ProjectStatus } from '@prisma/client'

// POST /api/projects/[id]/publish - Publish token from DRAFT to UPCOMING
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Get auth token
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify token
  const payload = await verifyTelegramSessionToken(token)
  if (!payload || !payload.userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  try {
    // Find the project
    const project = await prisma.project.findUnique({
      where: { id },
      include: { owner: true }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check ownership
    if (project.ownerId !== payload.userId) {
      return NextResponse.json({ error: 'Not authorized to publish this project' }, { status: 403 })
    }

    // Check current status - only DRAFT can be published
    if (project.status !== ProjectStatus.DRAFT) {
      return NextResponse.json(
        { error: `Cannot publish project with status ${project.status}. Only DRAFT projects can be published.` },
        { status: 400 }
      )
    }

    // Validate required fields for publishing
    const errors: string[] = []
    if (!project.name || project.name.trim() === '') {
      errors.push('Token name is required')
    }
    if (!project.ticker || project.ticker.trim() === '') {
      errors.push('Token symbol is required')
    }
    if (!project.initialSupply) {
      errors.push('Initial supply is required')
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }

    // Update status to UPCOMING
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        status: ProjectStatus.UPCOMING,
        updatedAt: new Date()
      },
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
    })

    return NextResponse.json({
      success: true,
      project: {
        id: updatedProject.id,
        name: updatedProject.name,
        ticker: updatedProject.ticker,
        status: updatedProject.status,
        logo: updatedProject.logo,
        descriptionShort: updatedProject.descriptionShort,
        initialSupply: updatedProject.initialSupply,
        decimals: updatedProject.decimals,
        estimatedLaunchDate: updatedProject.estimatedLaunchDate?.toISOString() || null,
        owner: updatedProject.owner,
        _count: updatedProject._count,
        updatedAt: updatedProject.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error publishing project:', error)
    return NextResponse.json(
      { error: 'Failed to publish project' },
      { status: 500 }
    )
  }
}
