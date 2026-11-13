import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const unauthorized = () => NextResponse.json({ error: 'Please sign in to make changes.' }, { status: 401 })

function serialize(d) {
  return {
    sn: d.sn,
    year: d.year,
    name: d.name,
    address: d.address,
    tel: d.tel,
    amount: d.amount.toString(),
  }
}

function parseAmount(v) {
  const n = parseFloat(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

function parseYear(v) {
  const n = Number(v)
  return Number.isInteger(n) && n >= 2000 && n <= 2100 ? n : null
}

export async function GET(req) {
  try {
    const year = parseYear(new URL(req.url).searchParams.get('year'))
    if (year === null) return NextResponse.json({ donors: [] })
    const donors = await prisma.donor.findMany({ where: { year }, orderBy: { sn: 'asc' } })
    return NextResponse.json({ donors: donors.map(serialize) })
  } catch (e) {
    console.error('GET /api/donors error:', e)
    return NextResponse.json({ error: 'Failed to load donors' }, { status: 500 })
  }
}

export async function POST(req) {
  if (!isAdmin()) return unauthorized()
  try {
    const { year, name, address, tel, amount } = await req.json()
    const y = parseYear(year)
    const amt = parseAmount(amount)

    if (y === null || !name || amt === null) {
      return NextResponse.json({ error: 'Year, name and a positive amount are required' }, { status: 400 })
    }

    const donor = await prisma.$transaction(async tx => {
      await tx.year.upsert({ where: { year: y }, update: {}, create: { year: y } })
      return tx.donor.create({
        data: { year: y, name: name.trim(), address: (address || '').trim(), tel: (tel || '').trim(), amount: amt },
      })
    })
    return NextResponse.json({ success: true, sn: donor.sn })
  } catch (e) {
    console.error('POST /api/donors error:', e)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

export async function PUT(req) {
  if (!isAdmin()) return unauthorized()
  try {
    const { sn, name, address, tel, amount } = await req.json()
    const amt = parseAmount(amount)

    if (!sn || !name || amt === null) {
      return NextResponse.json({ error: 'Name and a positive amount are required' }, { status: 400 })
    }

    try {
      await prisma.donor.update({
        where: { sn: Number(sn) },
        data: { name: name.trim(), address: (address || '').trim(), tel: (tel || '').trim(), amount: amt },
      })
    } catch (e) {
      if (e.code === 'P2025') return NextResponse.json({ error: 'Donor not found' }, { status: 404 })
      throw e
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('PUT /api/donors error:', e)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(req) {
  if (!isAdmin()) return unauthorized()
  try {
    const sn = Number(new URL(req.url).searchParams.get('sn'))
    if (!Number.isInteger(sn)) return NextResponse.json({ error: 'Invalid donor' }, { status: 400 })

    try {
      await prisma.donor.delete({ where: { sn } })
    } catch (e) {
      if (e.code === 'P2025') return NextResponse.json({ error: 'Donor not found' }, { status: 404 })
      throw e
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/donors error:', e)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
