import { NextResponse } from 'next/server'
import { put, head } from '@vercel/blob'

const BLOB_KEY = 'donors.csv'
const DEFAULT_CSV = 'sn,name,address,tel,amount\n'

function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',')
  return lines.slice(1).map(line => {
    const values = line.split(',')
    const obj = {}
    headers.forEach((h, i) => { obj[h.trim()] = values[i]?.trim() || '' })
    return obj
  }).filter(r => r.sn)
}

async function readCSV() {
  try {
    const blob = await head(BLOB_KEY, { token: process.env.BLOB_READ_WRITE_TOKEN })
    const res = await fetch(blob.url, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    })
    return await res.text()
  } catch (e) {
    return DEFAULT_CSV
  }
}

async function writeCSV(text) {
  await put(BLOB_KEY, text, {
    access: 'public',
    contentType: 'text/csv',
    addRandomSuffix: false,
  })
}

export async function GET() {
  try {
    const text = await readCSV()
    const donors = parseCSV(text)
    return NextResponse.json({ donors })
  } catch (e) {
    console.error('GET /api/donors error:', e)
    return NextResponse.json({ donors: [] })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { name, address, tel, amount } = body

    if (!name || !amount) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }

    let text = DEFAULT_CSV
    try { text = await readCSV() } catch (_) {}

    const donors = parseCSV(text)
    const nextSn = donors.length > 0
      ? Math.max(...donors.map(d => parseInt(d.sn) || 0)) + 1
      : 1

    const safe = v => String(v).replace(/,/g, ';')
    const newRow = `${nextSn},${safe(name)},${safe(address)},${safe(tel)},${safe(amount)}`

    if (!text.startsWith('sn,')) text = DEFAULT_CSV
    const updatedCSV = text.trimEnd() + '\n' + newRow

    await writeCSV(updatedCSV)
    await new Promise(r => setTimeout(r, 300))
    return NextResponse.json({ success: true, sn: nextSn })
  } catch (e) {
    console.error('POST /api/donors error:', e)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const body = await req.json()
    const { sn, name, address, tel, amount } = body

    if (!sn || !name || !amount) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }

    let text = DEFAULT_CSV
    try { text = await readCSV() } catch (_) {}

    const donors = parseCSV(text)
    const idx = donors.findIndex(d => String(d.sn) === String(sn))
    if (idx === -1) return NextResponse.json({ error: 'Donor not found' }, { status: 404 })

    const safe = v => String(v).replace(/,/g, ';')
    donors[idx] = { sn, name: safe(name), address: safe(address || ''), tel: safe(tel || ''), amount: safe(amount) }

    const updatedCSV = 'sn,name,address,tel,amount\n' +
      donors.map(d => `${d.sn},${d.name},${d.address},${d.tel},${d.amount}`).join('\n')

    await writeCSV(updatedCSV)
    await new Promise(r => setTimeout(r, 300))
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('PUT /api/donors error:', e)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}