import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234'

    if (password === adminPassword) {
      const response = NextResponse.json({ success: true })
      
      // Set a secure, HTTP-only cookie for the admin session
      response.headers.append(
        'Set-Cookie',
        `admin_session=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`
      )
      
      return response
    }

    return NextResponse.json(
      { error: 'Parolă incorectă. Vă rugăm încercați din nou.' },
      { status: 401 }
    )
  } catch {
    return NextResponse.json(
      { error: 'A apărut o eroare neașteptată.' },
      { status: 500 }
    )
  }
}
