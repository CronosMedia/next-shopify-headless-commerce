import {createHash, timingSafeEqual} from 'crypto'
import {cookies} from 'next/headers'
import {NextResponse} from 'next/server'
import {getIronSession, type IronSession, type SessionOptions} from 'iron-session'

const ADMIN_SESSION_COOKIE_NAME = 'veridis_admin_session'
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7
const MIN_SECRET_LENGTH = 32

export type AdminSessionData = {
  isAdmin?: boolean
  authenticatedAt?: string
  role?: 'admin'
}

type SessionConfigResult =
  | {
      ok: true
      options: SessionOptions
    }
  | {
      ok: false
      message: string
    }

type AdminSessionResult =
  | {
      authenticated: true
      session: IronSession<AdminSessionData>
    }
  | {
      authenticated: false
      response: NextResponse
    }

function getAdminSessionOptions(): SessionConfigResult {
  const secret = process.env.ADMIN_SESSION_SECRET

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    return {
      ok: false,
      message: 'Admin session is not configured.',
    }
  }

  return {
    ok: true,
    options: {
      cookieName: ADMIN_SESSION_COOKIE_NAME,
      password: secret,
      ttl: ADMIN_SESSION_TTL_SECONDS,
      cookieOptions: {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: ADMIN_SESSION_TTL_SECONDS,
      },
    },
  }
}

export function getConfiguredAdminPassword(): string | null {
  return process.env.ADMIN_PASSWORD || null
}

export function verifyAdminPassword(input: string, expected: string): boolean {
  const inputHash = createHash('sha256').update(input).digest()
  const expectedHash = createHash('sha256').update(expected).digest()

  return timingSafeEqual(inputHash, expectedHash)
}

export async function getAdminSession(): Promise<IronSession<AdminSessionData> | null> {
  const config = getAdminSessionOptions()

  if (!config.ok) {
    return null
  }

  const cookieStore = await cookies()
  return getIronSession<AdminSessionData>(cookieStore, config.options)
}

export function isValidAdminSession(session: AdminSessionData | null): boolean {
  return Boolean(
    session?.isAdmin === true &&
      session.role === 'admin' &&
      typeof session.authenticatedAt === 'string'
  )
}

export async function requireAdminSession(): Promise<AdminSessionResult> {
  const session = await getAdminSession()

  if (!session || !isValidAdminSession(session)) {
    return {
      authenticated: false,
      response: NextResponse.json(
        {error: 'Not authenticated.'},
        {status: 401}
      ),
    }
  }

  return {
    authenticated: true,
    session,
  }
}
