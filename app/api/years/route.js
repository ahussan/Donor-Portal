import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const current = new Date().getFullYear()
    // Make sure the current year always has a tab
    await prisma.year.upsert({ where: { year: current }, update: {}, create: { year: current } })

    const [saved, used] = await Promise.all([
      prisma.year.findMany(),
      prisma.donor.findMany({ select: { year: true }, distinct: ['year'] }),
    ])
    const years = [...new Set([...saved.map(y => y.year), ...used.map(d => d.year)])].sort((a, b) => a - b)
    return NextResponse.json({ years, current })
  } catch (e) {
    console.error('GET /api/years error:', e)
    return NextResponse.json({ error: 'Failed to load years' }, { status: 500 })
  }
}

export async function POST(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'Please sign in to make changes.' }, { status: 401 })
  try {
    const { year } = await req.json()
    const y = Number(year)
    if (!Number.isInteger(y) || y < 2000 || y > 2100) {
      return NextResponse.json({ error: 'Enter a valid year (2000–2100)' }, { status: 400 })
    }
    await prisma.year.upsert({ where: { year: y }, update: {}, create: { year: y } })
    return NextResponse.json({ success: true, year: y })
  } catch (e) {
    console.error('POST /api/years error:', e)
    return NextResponse.json({ error: 'Failed to add year' }, { status: 500 })
  }
}
