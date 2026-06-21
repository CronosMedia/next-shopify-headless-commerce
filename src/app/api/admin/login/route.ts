import { NextRequest, NextResponse } from 'next/server'
import {
  getAdminSession,
  getConfiguredAdminPassword,
  verifyAdminPassword,
} from '@/lib/admin-session'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    const adminPassword = getConfiguredAdminPassword()
    const session = await getAdminSession()

    if (!adminPassword || !session) {
      return NextResponse.json(
        { error: 'Admin authentication is not configured.' },
        { status: 500 }
      )
    }

    if (
      typeof password === 'string' &&
      verifyAdminPassword(password, adminPassword)
    ) {
      session.isAdmin = true
      session.role = 'admin'
      session.authenticatedAt = new Date().toISOString()
      await session.save()

      return NextResponse.json({ success: true })
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
