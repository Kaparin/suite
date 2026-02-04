import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTelegramSessionToken } from '@/lib/auth/telegram'

// GET /api/projects/[id] - получить проект по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if user is authenticated (optional - for edit permissions)
    let userId: string | null = null
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = verifyTelegramSessionToken(token)
      if (decoded?.userId) {
        userId = decoded.userId
      }
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            telegramUsername: true,
            walletAddress: true,
          },
        },
        metrics: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        riskFlags: {
          where: { isActive: true },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // If project is DRAFT, only owner can view it
    if (project.status === 'DRAFT' && project.ownerId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Add canEdit flag
    const canEdit = project.ownerId === userId

    return NextResponse.json({ project, canEdit })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id] - обновить проект
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyTelegramSessionToken(token)
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check project exists and user owns it
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { ownerId: true, status: true }
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (existingProject.ownerId !== decoded.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse body and filter allowed fields
    const body = await request.json()
    const {
      name,
      ticker,
      logo,
      descriptionShort,
      descriptionLong,
      decimals,
      initialSupply,
      links,
      tokenomics,
      estimatedLaunchDate,
      status
    } = body

    // Only allow status changes: DRAFT -> UPCOMING
    let newStatus = existingProject.status
    if (status && status !== existingProject.status) {
      if (existingProject.status === 'DRAFT' && status === 'UPCOMING') {
        newStatus = 'UPCOMING'
      } else if (existingProject.status === 'UPCOMING' && status === 'DRAFT') {
        // Allow unpublishing
        newStatus = 'DRAFT'
      }
      // Other status changes are not allowed via this endpoint
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(ticker !== undefined && { ticker }),
        ...(logo !== undefined && { logo }),
        ...(descriptionShort !== undefined && { descriptionShort }),
        ...(descriptionLong !== undefined && { descriptionLong }),
        ...(decimals !== undefined && { decimals: typeof decimals === 'number' ? decimals : parseInt(decimals) }),
        ...(initialSupply !== undefined && { initialSupply }),
        ...(links !== undefined && { links }),
        ...(tokenomics !== undefined && { tokenomics }),
        ...(estimatedLaunchDate !== undefined && {
          estimatedLaunchDate: estimatedLaunchDate ? new Date(estimatedLaunchDate) : null
        }),
        status: newStatus,
      },
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - удалить проект
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyTelegramSessionToken(token)
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check project exists and user owns it
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { ownerId: true }
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (existingProject.ownerId !== decoded.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
