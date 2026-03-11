import { NextResponse } from 'next/server'

const AXIOME_IDX_API = 'https://api-idx.axiomechain.pro'

/**
 * Forward relevant client headers to the Axiome API
 * so the wallet can display origin site info during authorization
 */
function getForwardHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {}

  const xff = request.headers.get('x-forwarded-for')
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const userAgent = request.headers.get('user-agent')

  if (xff) headers['X-Forwarded-For'] = xff
  if (origin) headers['Origin'] = origin
  if (referer) headers['Referer'] = referer
  if (userAgent) headers['User-Agent'] = userAgent

  return headers
}

/**
 * GET /api/connect/auth — Get a new connect token from Axiome
 * Returns: { token: "hex24chars", ... }
 */
export async function GET(request: Request) {
  try {
    const res = await fetch(`${AXIOME_IDX_API}/connect/create_token`, {
      headers: getForwardHeaders(request),
    })
    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to create connect token', details: JSON.stringify(data) },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[connect/auth] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create connect token' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/connect/auth — Check token info (poll for wallet association)
 * Body: { token: "hex24chars" }
 * Returns: { exists: boolean, account: string | null, ... }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const res = await fetch(`${AXIOME_IDX_API}/connect/get_token_info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getForwardHeaders(request),
      },
      body: JSON.stringify({ token }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Token info check failed', details: JSON.stringify(data) },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[connect/auth] POST Error:', error)
    return NextResponse.json(
      { error: 'Failed to check token info' },
      { status: 500 }
    )
  }
}
