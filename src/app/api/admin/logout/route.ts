import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-session'

export async function POST() {
  const session = await getAdminSession()

  if (session) {
    session.destroy()
  }

  return NextResponse.json({ success: true })
}
