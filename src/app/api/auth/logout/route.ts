import { NextResponse } from 'next/server'

// POST /api/auth/logout - Clear session
export async function POST() {
  // Create response that clears auth cookie
  const response = NextResponse.json({ success: true })

  // Clear cookie if using cookies (optional enhancement)
  response.cookies.delete('auth_token')

  return response
}
