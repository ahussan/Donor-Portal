import { NextResponse } from 'next/server'
import { put, list } from '@vercel/blob'


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
  const { blobs } = await list()
  const blob = blobs.find(b => b.pathname === BLOB_KEY)
  if (!blob) return DEFAULT_CSV
  const res = await fetch(blob.url)
  return await res.text()
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

    if (!name || !address || !tel || !amount) {
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

    return NextResponse.json({ success: true, sn: nextSn })
  } catch (e) {
    console.error('POST /api/donors error:', e)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
