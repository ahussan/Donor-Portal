import crypto from 'crypto'
import { cookies } from 'next/headers'

// Defaults match the original hard-coded login. Override with env vars on Vercel.
const USER = process.env.ADMIN_USER || 'admin'
const PASS = process.env.ADMIN_PASSWORD || 'admin123'
const SECRET = process.env.AUTH_SECRET || `donor-app:${PASS}`

export const COOKIE = 'donor_session'
export const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

const hmac = v => crypto.createHmac('sha256', SECRET).update(String(v)).digest('hex')
const digest = v => crypto.createHash('sha256').update(String(v)).digest()

export function checkCredentials(username, password) {
  const userOk = crypto.timingSafeEqual(digest(username ?? ''), digest(USER))
  const passOk = crypto.timingSafeEqual(digest(password ?? ''), digest(PASS))
  return userOk && passOk
}

export function createSession() {
  const exp = Date.now() + MAX_AGE * 1000
  return `${exp}.${hmac(exp)}`
}

export function isAdmin() {
  const value = cookies().get(COOKIE)?.value
  if (!value) return false
  const [exp, sig] = value.split('.')
  if (!exp || !sig || Number(exp) < Date.now()) return false
  const expected = Buffer.from(hmac(exp))
  const actual = Buffer.from(sig)
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
}
