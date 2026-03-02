import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const CSV_PATH = path.join(process.cwd(), 'public', 'data', 'donors.csv')

function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',')
  return lines.slice(1).map(line => {
    const values = line.split(',')
    const obj = {}
    headers.forEach((h, i) => { obj[h.trim()] = values[i]?.trim() || '' })
    return obj
  }).filter(r => r.sn)
}

export async function GET() {
  try {
    const text = fs.readFileSync(CSV_PATH, 'utf8')
    const donors = parseCSV(text)
    return NextResponse.json({ donors })
  } catch (e) {
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

    let text = ''
    let nextSn = 1
    try {
      text = fs.readFileSync(CSV_PATH, 'utf8')
      const donors = parseCSV(text)
      if (donors.length > 0) {
        nextSn = Math.max(...donors.map(d => parseInt(d.sn) || 0)) + 1
      }
    } catch (e) {
      text = 'sn,name,address,tel,amount\n'
    }

    // Sanitize: remove commas from fields to keep CSV valid
    const safe = v => String(v).replace(/,/g, ';')
    const newRow = `\n${nextSn},${safe(name)},${safe(address)},${safe(tel)},${safe(amount)}`

    // If file doesn't have header, add it
    if (!text.startsWith('sn,')) {
      text = 'sn,name,address,tel,amount\n' + text
    }

    fs.writeFileSync(CSV_PATH, text.trimEnd() + newRow)

    return NextResponse.json({ success: true, sn: nextSn })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
