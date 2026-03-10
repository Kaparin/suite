import { NextRequest, NextResponse } from 'next/server'

const AXIOME_IDX_API = 'https://api-idx.axiomechain.pro'

/**
 * GET /api/connect/sign/:id — Poll transaction status
 * Returns: { status: "new"|"broadcast"|"result"|"cancel"|"error", payload: ... }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const res = await fetch(`${AXIOME_IDX_API}/connect/sign/${id}`, {
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: 'Axiome Connect API error', details: text },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Connect sign poll error:', error)
    return NextResponse.json(
      { error: 'Failed to poll signing status' },
      { status: 500 }
    )
  }
}
