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

    const res = await fetch(`${AXIOME_IDX_API}/connect/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
    console.error('Connect sign error:', error)
    return NextResponse.json(
      { error: 'Failed to submit signing request' },
      { status: 500 }
    )
  }
}
