import { NextResponse } from 'next/server'
import { COOKIE, MAX_AGE, checkCredentials, createSession, isAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ admin: isAdmin() })
}

export async function POST(req) {
  try {
    const { username, password } = await req.json()
    if (!checkCredentials(username, password)) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 })
    }
    const res = NextResponse.json({ admin: true })
    res.cookies.set(COOKIE, createSession(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: MAX_AGE,
    })
    return res
  } catch (e) {
    console.error('POST /api/auth error:', e)
    return NextResponse.json({ error: 'Sign in failed' }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ admin: false })
  res.cookies.set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
