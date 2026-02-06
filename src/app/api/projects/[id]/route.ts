import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySessionTokenV2 } from '@/lib/auth/telegram'

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
      const decoded = verifySessionTokenV2(token)
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
            wallets: {
              where: { isPrimary: true },
              select: { address: true },
              take: 1
            }
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
        { error: 'Access denied. This is a draft project and you are not the owner.' },
        { status: 403 }
      )
    }

    // Add canEdit flag — ownership check uses immutable userId
    const canEdit = project.ownerId === userId

    // Flatten owner walletAddress for backward compatibility
    const ownerWalletAddress = project.owner.wallets[0]?.address || null
    const projectResponse = {
      ...project,
      owner: {
        id: project.owner.id,
        telegramUsername: project.owner.telegramUsername,
        walletAddress: ownerWalletAddress
      }
    }

    return NextResponse.json({ project: projectResponse, canEdit })
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
    const decoded = verifySessionTokenV2(token)
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check project exists and user owns it
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { ownerId: true, status: true, tokenAddress: true }
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

    // Check if token is deployed on-chain
    const isDeployed = !!existingProject.tokenAddress

    // Only allow status changes: DRAFT -> UPCOMING (not for deployed tokens)
    let newStatus = existingProject.status
    if (status && status !== existingProject.status && !isDeployed) {
      if (existingProject.status === 'DRAFT' && status === 'UPCOMING') {
        newStatus = 'UPCOMING'
      } else if (existingProject.status === 'UPCOMING' && status === 'DRAFT') {
        // Allow unpublishing
        newStatus = 'DRAFT'
      }
      // Other status changes are not allowed via this endpoint
    }

    // Build update data - contract fields are locked if token is deployed
    const updateData: Record<string, unknown> = {}

    // Contract fields - only editable if NOT deployed
    if (!isDeployed) {
      if (name !== undefined) updateData.name = name
      if (ticker !== undefined) updateData.ticker = ticker
      if (logo !== undefined) updateData.logo = logo
      if (decimals !== undefined) updateData.decimals = typeof decimals === 'number' ? decimals : parseInt(decimals)
      if (initialSupply !== undefined) updateData.initialSupply = initialSupply
      updateData.status = newStatus
    }

    // Database-only fields - always editable
    if (descriptionShort !== undefined) updateData.descriptionShort = descriptionShort
    if (descriptionLong !== undefined) updateData.descriptionLong = descriptionLong
    if (links !== undefined) updateData.links = links
    if (tokenomics !== undefined) updateData.tokenomics = tokenomics
    if (estimatedLaunchDate !== undefined) {
      updateData.estimatedLaunchDate = estimatedLaunchDate ? new Date(estimatedLaunchDate) : null
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
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
    const decoded = verifySessionTokenV2(token)
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
