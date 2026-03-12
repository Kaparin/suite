import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySessionTokenV2 } from '@/lib/auth'
import { KNOWN_TOKENS } from '@/lib/axiome/token-registry'
import { getProjectTrustScore } from '@/lib/trust/calculator'

const REST_URL = process.env.AXIOME_REST_URL

// Get minter (owner) from chain
async function getChainMinter(contractAddress: string): Promise<string | null> {
  if (!REST_URL) return null

  try {
    const query = Buffer.from(JSON.stringify({ minter: {} })).toString('base64')
    const response = await fetch(
      `${REST_URL}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
      { next: { revalidate: 300 } }
    )

    if (response.ok) {
      const data = await response.json()
      if (data.data) {
        let info
        if (typeof data.data === 'string') {
          info = JSON.parse(Buffer.from(data.data, 'base64').toString())
        } else {
          info = data.data
        }
        return info.minter || null
      }
    }
  } catch {
    // No minter
  }
  return null
}

// Get token info from chain
async function getChainTokenInfo(contractAddress: string): Promise<{
  name: string
  symbol: string
  decimals: number
  total_supply: string
} | null> {
  if (!REST_URL) return null

  try {
    const query = Buffer.from(JSON.stringify({ token_info: {} })).toString('base64')
    const response = await fetch(
      `${REST_URL}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
      { next: { revalidate: 300 } }
    )

    if (response.ok) {
      const data = await response.json()
      if (data.data) {
        let tokenInfo
        if (typeof data.data === 'string') {
          tokenInfo = JSON.parse(Buffer.from(data.data, 'base64').toString())
        } else {
          tokenInfo = data.data
        }
        return tokenInfo
      }
    }
  } catch {
    // Not a valid CW20
  }
  return null
}

// Get marketing info from chain
async function getChainMarketingInfo(contractAddress: string): Promise<{
  description?: string | null
  logo?: { url?: string } | null
  project?: string | null
  marketing?: string | null
} | null> {
  if (!REST_URL) return null

  try {
    const query = Buffer.from(JSON.stringify({ marketing_info: {} })).toString('base64')
    const response = await fetch(
      `${REST_URL}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
      { next: { revalidate: 300 } }
    )

    if (response.ok) {
      const data = await response.json()
      if (data.data) {
        let info
        if (typeof data.data === 'string') {
          info = JSON.parse(Buffer.from(data.data, 'base64').toString())
        } else {
          info = data.data
        }
        return info
      }
    }
  } catch {
    // No marketing info
  }
  return null
}

// GET /api/tokens/[address] - get token by contract address or project ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params

    // Look up by tokenAddress first, then by ID (for backwards compat with comments/reactions)
    let project = await prisma.project.findUnique({
      where: { tokenAddress: address },
      include: {
        metrics: {
          orderBy: { date: 'desc' as const },
          take: 30,
        },
        riskFlags: {
          where: { isActive: true },
        },
        changes: {
          orderBy: { createdAt: 'desc' as const },
          take: 20,
        },
      },
    })

    if (!project) {
      project = await prisma.project.findUnique({
        where: { id: address },
        include: {
          metrics: {
            orderBy: { date: 'desc' as const },
            take: 30,
          },
          riskFlags: {
            where: { isActive: true },
          },
          changes: {
            orderBy: { createdAt: 'desc' as const },
            take: 20,
          },
        },
      })
    }

    // Get chain data
    const contractAddr = project?.tokenAddress || address
    let chainMinter: string | null = null
    let chainTokenInfo: Awaited<ReturnType<typeof getChainTokenInfo>> = null
    let chainMarketingInfo: Awaited<ReturnType<typeof getChainMarketingInfo>> = null

    if (contractAddr.startsWith('axm')) {
      ;[chainMinter, chainTokenInfo, chainMarketingInfo] = await Promise.all([
        getChainMinter(contractAddr),
        getChainTokenInfo(contractAddr),
        getChainMarketingInfo(contractAddr),
      ])
    }

    if (!project) {
      // Check if it's a known token
      const knownToken = KNOWN_TOKENS.find(
        t => t.contractAddress.toLowerCase() === address.toLowerCase()
      )

      if (chainTokenInfo || knownToken) {
        // Token exists on chain, return chain data
        return NextResponse.json({
          project: {
            id: null,
            name: knownToken?.name || chainTokenInfo?.name || 'Unknown Token',
            ticker: knownToken?.symbol || chainTokenInfo?.symbol || 'TOKEN',
            tokenAddress: address,
            descriptionShort: chainMarketingInfo?.description || knownToken?.description || null,
            descriptionLong: null,
            logo: knownToken?.logoUrl || chainMarketingInfo?.logo?.url || null,
            links: chainMarketingInfo?.project ? { website: chainMarketingInfo.project } : null,
            tokenomics: chainTokenInfo ? {
              supply: chainTokenInfo.total_supply,
              decimals: chainTokenInfo.decimals
            } : null,
            isVerified: knownToken?.verified || false,
            createdAt: null,
            riskFlags: [],
            changes: [],
          },
          chainData: {
            tokenInfo: chainTokenInfo,
            marketingInfo: chainMarketingInfo,
          },
          score: knownToken?.verified ? 80 : 50,
          metrics: { holders: 0, txCount: 0, volume24h: 0 },
          chainMinter,
        })
      }

      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      )
    }

    const latestMetric = project.metrics[0]

    // Get persistent trust score
    const trustScore = await getProjectTrustScore(project.id)

    return NextResponse.json({
      project: {
        ...project,
        // Override name/ticker/logo with chain data when available
        name: chainTokenInfo?.name || project.name,
        ticker: chainTokenInfo?.symbol || project.ticker,
        logo: chainMarketingInfo?.logo?.url || project.logo,
      },
      chainData: {
        tokenInfo: chainTokenInfo,
        marketingInfo: chainMarketingInfo,
      },
      score: trustScore?.totalScore ?? 50,
      trustScore: trustScore ?? null,
      metrics: {
        holders: latestMetric?.holdersEstimate || 0,
        txCount: latestMetric?.txCount || 0,
        volume24h: latestMetric?.volumeEstimate || 0,
      },
      chainMinter,
    })
  } catch (error) {
    console.error('Error fetching token:', error)
    return NextResponse.json(
      { error: 'Failed to fetch token' },
      { status: 500 }
    )
  }
}

// PATCH /api/tokens/[address] - update custom token data (owner only, verified via chain minter)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params

    // Verify JWT token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifySessionTokenV2(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please log in again.' },
        { status: 401 }
      )
    }

    // Get user's wallets for ownership check
    const userWallets = await prisma.wallet.findMany({
      where: { userId: decoded.userId },
      select: { address: true }
    })
    const userWalletAddresses = userWallets.map(w => w.address.toLowerCase())

    // Ownership check: user's wallet must match the on-chain minter
    const chainMinter = await getChainMinter(address)
    if (!chainMinter || !userWalletAddresses.includes(chainMinter.toLowerCase())) {
      return NextResponse.json(
        { error: 'Not authorized. Only the token minter can edit this token.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { descriptionShort, descriptionLong, links } = body

    // Find existing project record
    let project = await prisma.project.findUnique({
      where: { tokenAddress: address },
    })

    // Auto-create project record if none exists
    if (!project) {
      // Fetch chain data for initial record
      const chainTokenInfo = await getChainTokenInfo(address)

      project = await prisma.project.create({
        data: {
          ownerId: decoded.userId,
          tokenAddress: address,
          name: chainTokenInfo?.name || 'Token',
          ticker: chainTokenInfo?.symbol || 'TOKEN',
          descriptionShort,
          descriptionLong,
          links,
          status: 'LAUNCHED',
        },
      })

      return NextResponse.json({ project, created: true })
    }

    // Track changes before updating
    const changes: { changeType: string; oldValue: unknown; newValue: unknown }[] = []
    if (descriptionShort !== undefined && descriptionShort !== project.descriptionShort) {
      changes.push({ changeType: 'descriptionShort', oldValue: project.descriptionShort, newValue: descriptionShort })
    }
    if (descriptionLong !== undefined && descriptionLong !== project.descriptionLong) {
      changes.push({ changeType: 'descriptionLong', oldValue: project.descriptionLong, newValue: descriptionLong })
    }
    if (links !== undefined && JSON.stringify(links) !== JSON.stringify(project.links)) {
      changes.push({ changeType: 'links', oldValue: project.links, newValue: links })
    }

    // Save change records
    if (changes.length > 0) {
      await prisma.projectChange.createMany({
        data: changes.map(c => ({
          projectId: project.id,
          userId: decoded.userId,
          changeType: c.changeType,
          oldValue: c.oldValue as any,
          newValue: c.newValue as any,
        })),
      })
    }

    // Update only custom fields (chain fields are read-only)
    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: {
        ...(descriptionShort !== undefined && { descriptionShort }),
        ...(descriptionLong !== undefined && { descriptionLong }),
        ...(links !== undefined && { links }),
      },
    })

    return NextResponse.json({ project: updatedProject })
  } catch (error) {
    console.error('Error updating token:', error)
    return NextResponse.json(
      { error: 'Failed to update token' },
      { status: 500 }
    )
  }
}
