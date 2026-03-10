import { NextRequest, NextResponse } from 'next/server'

const AXIOME_IDX_API = 'https://api-idx.axiomechain.pro'

/**
 * PUT /api/connect/sign/status — Update signing request status (e.g., cancel)
 * Body: { id: "transactionId", status: "cancel" }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    const res = await fetch(`${AXIOME_IDX_API}/connect/sign/status`, {
      method: 'PUT',
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
    console.error('Connect sign status error:', error)
    return NextResponse.json(
      { error: 'Failed to update signing status' },
      { status: 500 }
    )
  }
}
