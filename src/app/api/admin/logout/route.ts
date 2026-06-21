import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  
  // Clear the admin session cookie by setting its Max-Age to 0
  response.headers.append(
    'Set-Cookie',
    `admin_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
  )
  
  return response
}
