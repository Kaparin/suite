import { NextRequest, NextResponse } from 'next/server'

const AXIOME_IDX_API = 'https://api-idx.axiomechain.pro'

/**
 * POST /api/connect/sign — Submit a signing request to Axiome Connect
 * Body: { payload: "axiomesign://base64..." }
 * Returns: transaction ID (short hex string)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[connect/sign] Submitting payload to Axiome API, length:', JSON.stringify(body).length)

    const res = await fetch(`${AXIOME_IDX_API}/connect/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const responseText = await res.text()
    console.log('[connect/sign] Response status:', res.status, 'body:', responseText.slice(0, 200))

    if (!res.ok) {
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
      // Response is a plain string (transaction ID)
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
