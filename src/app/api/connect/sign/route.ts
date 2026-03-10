import { NextRequest, NextResponse } from 'next/server'

const AXIOME_IDX_API = 'https://api-idx.axiomechain.pro'

/**
 * POST /api/connect/sign — Submit a signing request to Axiome Connect
 * Body: { payload: "axiomesign://base64...", authToken: "hex24chars" }
 * Returns: transaction ID (short hex string)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { payload, authToken } = body

    if (!payload) {
      return NextResponse.json({ error: 'Payload is required' }, { status: 400 })
    }
    if (!authToken) {
      return NextResponse.json({ error: 'Auth token is required' }, { status: 400 })
    }

    const res = await fetch(`${AXIOME_IDX_API}/connect/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ payload }),
    })

    const responseText = await res.text()

    if (!res.ok) {
      console.error('[connect/sign] Error:', res.status, responseText.slice(0, 200))
      return NextResponse.json(
        { error: 'Axiome Connect API error', details: responseText },
        { status: res.status }
      )
    }

    // Try to parse as JSON, fallback to raw text (API may return plain string ID)
    try {
      const data = JSON.parse(responseText)
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ id: responseText.trim() })
    }
  } catch (error) {
    console.error('[connect/sign] Error:', error)
    return NextResponse.json(
      { error: 'Failed to submit signing request', details: String(error) },
      { status: 500 }
    )
  }
}
