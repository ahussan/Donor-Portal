// Seeds 2025 donors from 2025donors.csv. Safe to re-run: skips if 2025 already has donors.
// Also makes sure the 2026 tab exists (left empty).
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const SEED_YEAR = 2025
const CSV_FILE = path.join(__dirname, '..', '2025donors.csv')

// The old app stored commas as ";" because it wrote plain CSV - turn them back.
const unsafe = v => v.replace(/;\s*/g, ', ').trim()

function parse(text) {
  const [, ...lines] = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/)
  return lines
    .filter(l => l.trim())
    .map(line => {
      const [sn, name, address = '', tel = '', amount = ''] = line.split(',')
      return { sn: Number(sn), name: unsafe(name), address: unsafe(address), tel: unsafe(tel), amount: parseFloat(amount) }
    })
    .sort((a, b) => a.sn - b.sn)
}

async function main() {
  await prisma.year.upsert({ where: { year: 2026 }, update: {}, create: { year: 2026 } })
  await prisma.year.upsert({ where: { year: SEED_YEAR }, update: {}, create: { year: SEED_YEAR } })

  const existing = await prisma.donor.count({ where: { year: SEED_YEAR } })
  if (existing > 0) {
    console.log(`Skipped: ${SEED_YEAR} already has ${existing} donors.`)
    return
  }

  const rows = parse(fs.readFileSync(CSV_FILE, 'utf8'))
  const bad = rows.filter(r => !r.name || !Number.isFinite(r.amount) || r.amount <= 0)
  if (bad.length) throw new Error(`Invalid rows in CSV: ${JSON.stringify(bad)}`)

  // Insert one by one in CSV order so the auto-increment ids keep the original ordering.
  await prisma.$transaction(async tx => {
    for (const r of rows) {
      await tx.donor.create({
        data: { year: SEED_YEAR, name: r.name, address: r.address, tel: r.tel, amount: r.amount },
      })
    }
  })

  const total = rows.reduce((s, r) => s + r.amount, 0)
  console.log(`Seeded ${rows.length} donors for ${SEED_YEAR} (total $${total.toFixed(2)}). 2026 left empty.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
