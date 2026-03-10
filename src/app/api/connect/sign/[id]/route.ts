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

    const responseText = await res.text()

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Axiome Connect API error', details: responseText },
        { status: res.status }
      )
    }

    // Try to parse as JSON, fallback to wrapping in object
    try {
      const data = JSON.parse(responseText)
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ status: responseText.trim() })
    }
  } catch (error) {
    console.error('[connect/sign/poll] Error:', error)
    return NextResponse.json(
      { error: 'Failed to poll signing status' },
      { status: 500 }
    )
  }
}
