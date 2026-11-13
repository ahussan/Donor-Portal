'use client'
import { useEffect, useState } from 'react'

// Hard-coded distribution summary that was previously shown on every page.
// It only applies to the year it was recorded for.
const DISTRIBUTION_YEAR = 2025
const DISTRIBUTION = [
  { name: 'Hafeez Mufti Kawsar Ahmed', amount: 4000 },
  { name: 'Hafeez Minhazur Rahman Choudhury', amount: 4000 },
  { name: 'Added to the Mosque Fund (Money given to Humayun Bhi)', amount: 181 },
]

const EMPTY_FORM = { name: '', address: '', tel: '', amount: '' }
const fmt = n => (parseFloat(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function HomePage() {
  const [years, setYears] = useState([])
  const [year, setYear] = useState(null)
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [admin, setAdmin] = useState(false)

  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [editDonor, setEditDonor] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const [addingYear, setAddingYear] = useState(false)
  const [newYear, setNewYear] = useState('')
  const [yearError, setYearError] = useState('')

  useEffect(() => {
    fetch('/api/auth', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setAdmin(!!d.admin))
      .catch(() => {})
    loadYears()
  }, [])
  useEffect(() => { if (year !== null) loadDonors(year) }, [year])

  async function loadYears(select) {
    try {
      const res = await fetch('/api/years', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setYears(data.years)
      setYear(prev => select ?? prev ?? data.current)
    } catch {
      setLoadError('Could not load years. Check the database connection.')
      setLoading(false)
    }
  }

  async function loadDonors(y) {
    setLoading(true)
    setLoadError('')
    try {
      const res = await fetch(`/api/donors?year=${y}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDonors(data.donors)
    } catch {
      setLoadError('Could not load donors. Check the database connection.')
      setDonors([])
    }
    setLoading(false)
  }

  async function handleAddYear(e) {
    e.preventDefault()
    setYearError('')
    const res = await fetch('/api/years', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: newYear }),
    })
    const data = await res.json()
    if (!res.ok) { setYearError(data.error); if (res.status === 401) setAdmin(false); return }
    setAddingYear(false)
    setNewYear('')
    await loadYears(data.year)
  }

  function validate(f) {
    if (!f.name.trim()) return 'Name is required.'
    const n = parseFloat(f.amount)
    if (!Number.isFinite(n) || n <= 0) return 'Amount must be a positive number.'
    return ''
  }

  async function handleAdd(e) {
    e.preventDefault()
    const err = validate(form)
    if (err) { setFormError(err); return }
    setSaving(true)
    setFormError('')
    try {
      const res = await fetch('/api/donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, year }),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error); if (res.status === 401) setAdmin(false); setSaving(false); return }
      setShowAdd(false)
      setForm(EMPTY_FORM)
      await loadDonors(year)
    } catch {
      setFormError('Failed to save. Try again.')
    }
    setSaving(false)
  }

  function openEdit(d) {
    setEditDonor(d)
    setEditForm({ name: d.name, address: d.address, tel: d.tel, amount: d.amount })
    setEditError('')
  }

  async function handleEditSave(e) {
    e.preventDefault()
    const err = validate(editForm)
    if (err) { setEditError(err); return }
    setEditSaving(true)
    setEditError('')
    try {
      const res = await fetch('/api/donors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sn: editDonor.sn, ...editForm }),
      })
      const data = await res.json()
      if (!res.ok) { setEditError(data.error); if (res.status === 401) setAdmin(false); setEditSaving(false); return }
      setEditDonor(null)
      await loadDonors(year)
    } catch {
      setEditError('Failed to save. Try again.')
    }
    setEditSaving(false)
  }

  async function handleDelete(d) {
    if (!confirm(`Delete donor "${d.name}" (${fmt(d.amount)})? This cannot be undone.`)) return
    const res = await fetch(`/api/donors?sn=${d.sn}`, { method: 'DELETE' })
    if (!res.ok) {
      if (res.status === 401) setAdmin(false)
      alert(res.status === 401 ? 'Your session expired. Please sign in again.' : 'Failed to delete. Try again.')
      return
    }
    await loadDonors(year)
  }

  async function signOut() {
    await fetch('/api/auth', { method: 'DELETE' })
    setAdmin(false)
    setShowAdd(false)
    setEditDonor(null)
    setAddingYear(false)
  }

  function downloadCSV() {
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = donors.map(d => [d.sn, q(d.name), q(d.address), q(d.tel), d.amount].join(','))
    const csv = ['sn,name,address,tel,amount', ...rows].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `donors_${year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const total = donors.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
  const term = search.trim().toLowerCase()
  const filtered = term
    ? donors.filter(d => [d.name, d.address, d.tel].some(v => (v || '').toLowerCase().includes(term)))
    : donors

  const fields = [
    { label: 'Full Name', key: 'name', placeholder: 'Donor full name', type: 'text' },
    { label: 'Address', key: 'address', placeholder: 'Street, City', type: 'text' },
    { label: 'Telephone', key: 'tel', placeholder: '347 XXXXXXX', type: 'tel' },
    { label: 'Amount $', key: 'amount', placeholder: '0.00', type: 'number' },
  ]

  function renderForm(values, setValues, onSubmit, error, busy, onCancel, submitLabel) {
    return (
      <form onSubmit={onSubmit} style={s.form}>
        {fields.map(({ label, key, placeholder, type }) => (
          <div key={key} style={s.field}>
            <label style={s.label}>{label}</label>
            <input
              style={s.input}
              type={type}
              placeholder={placeholder}
              value={values[key]}
              onChange={e => setValues(f => ({ ...f, [key]: e.target.value }))}
              min={type === 'number' ? '0' : undefined}
              step={type === 'number' ? '0.01' : undefined}
            />
          </div>
        ))}
        {error && <p style={s.error}>{error}</p>}
        <div style={s.modalActions}>
          <button type="button" style={s.cancelBtn} onClick={onCancel}>Cancel</button>
          <button type="submit" style={busy ? { ...s.submitBtn, opacity: 0.7 } : s.submitBtn} disabled={busy}>
            {busy ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <span style={s.navBrand}>Darus Sunnah New York</span>
        {admin ? (
          <button style={s.navBtn} onClick={signOut}>Sign Out</button>
        ) : (
          <a href="/login" style={s.navSignIn}>Sign In</a>
        )}
      </nav>

      <main style={s.main}>
        <div style={s.orgBlock}>
          <div style={s.logoCircle}>🤝</div>
          <h1 style={s.orgName}>Khatam-ul-Quran Hadiya Collection and Distribution</h1>
        </div>

        <div style={s.header}>
          <div>
            <h2 style={s.title}>Donor Details and Committed Amounts for Tarawhee</h2>
            <p style={s.subtitle}>
              {admin ? 'Manage and track all donor contributions' : 'Viewing donor contributions · Sign in to manage collections'}
            </p>
          </div>
          <div style={s.btnGroup}>
            <button style={s.dlBtn} onClick={downloadCSV} disabled={!donors.length}>⬇ Export CSV</button>
            {admin && (
              <button style={s.addBtn} onClick={() => { setForm(EMPTY_FORM); setFormError(''); setShowAdd(true) }} disabled={year === null}>
                + Add Donor
              </button>
            )}
          </div>
        </div>

        {/* Year tabs */}
        <div style={s.tabs}>
          {years.map(y => (
            <button key={y} style={y === year ? { ...s.tab, ...s.tabActive } : s.tab} onClick={() => { setYear(y); setSearch('') }}>
              {y}
            </button>
          ))}
          {!admin ? null : addingYear ? (
            <form onSubmit={handleAddYear} style={s.yearForm}>
              <input
                style={s.yearInput}
                type="number"
                min="2000"
                max="2100"
                placeholder="Year"
                value={newYear}
                onChange={e => setNewYear(e.target.value)}
                autoFocus
              />
              <button type="submit" style={s.yearOk}>Add</button>
              <button type="button" style={s.yearCancel} onClick={() => { setAddingYear(false); setYearError('') }}>✕</button>
            </form>
          ) : (
            <button style={s.tabAdd} onClick={() => setAddingYear(true)}>+ Add Year</button>
          )}
        </div>
        {yearError && <p style={{ ...s.error, marginBottom: 12 }}>{yearError}</p>}

        {year === DISTRIBUTION_YEAR && (
          <div style={{ ...s.tableWrap, marginBottom: 28 }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Distribution</th>
                  <th style={s.th}>Amount ($)</th>
                </tr>
              </thead>
              <tbody>
                {DISTRIBUTION.map((row, i) => (
                  <tr key={row.name} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                    <td style={{ ...s.td, fontWeight: 'bold' }}>{row.name}</td>
                    <td style={{ ...s.td, color: '#0d9488', fontWeight: 'bold' }}>{fmt(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={s.summaryRow}>
          <div style={s.summaryChip}>
            <span style={s.chipLabel}>Total Collected ({year ?? '—'})</span>
            <span style={s.chipValue}>$ {fmt(total)}</span>
          </div>
          <div style={s.summaryChip}>
            <span style={s.chipLabel}>Total Donors</span>
            <span style={s.chipValue}>{donors.length}</span>
          </div>
        </div>

        <input
          style={s.search}
          type="search"
          placeholder="Search by name, address or telephone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div style={s.tableWrap}>
          {loadError ? (
            <p style={{ ...s.loading, color: '#dc2626' }}>{loadError}</p>
          ) : loading ? (
            <p style={s.loading}>Loading…</p>
          ) : donors.length === 0 ? (
            <p style={s.loading}>No donors for {year} yet. Add the first one!</p>
          ) : filtered.length === 0 ? (
            <p style={s.loading}>No donors match your search.</p>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  {['#', 'Name', 'Address', 'Telephone', 'Amount ($)', ...(admin ? [''] : [])].map((h, i) => (
                    <th key={i} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={d.sn} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                    <td style={s.td}>{i + 1}</td>
                    <td style={{ ...s.td, fontWeight: 500, color: '#0f172a' }}>{d.name}</td>
                    <td style={s.td}>{d.address}</td>
                    <td style={s.td}>{d.tel}</td>
                    <td style={{ ...s.td, color: '#0d9488', fontWeight: 600 }}>{fmt(d.amount)}</td>
                    {admin && (
                      <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                        <button style={s.editBtn} onClick={() => openEdit(d)}>Edit</button>
                        <button style={s.deleteBtn} onClick={() => handleDelete(d)}>Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {admin && showAdd && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Add Donor — {year}</h3>
              <button style={s.closeBtn} onClick={() => setShowAdd(false)}>✕</button>
            </div>
            {renderForm(form, setForm, handleAdd, formError, saving, () => setShowAdd(false), 'Save Donor')}
          </div>
        </div>
      )}

      {admin && editDonor && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setEditDonor(null) }}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Edit Donor</h3>
              <button style={s.closeBtn} onClick={() => setEditDonor(null)}>✕</button>
            </div>
            {renderForm(editForm, setEditForm, handleEditSave, editError, editSaving, () => setEditDonor(null), 'Save Changes')}
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(180deg, #e0f7f4 0%, #f4f8fb 260px)' },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 40px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' },
  navBrand: { color: '#0f766e', fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 600 },
  navBtn: { background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f766e', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 500 },
  navSignIn: { background: '#0d9488', color: '#ffffff', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 13 },
  main: { padding: '40px', maxWidth: 1100, margin: '0 auto' },
  orgBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', marginBottom: 36 },
  logoCircle: { width: 72, height: 72, borderRadius: '50%', background: '#ccfbf1', border: '3px solid #ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(13,148,136,0.2)', fontSize: 32 },
  orgName: { fontFamily: "'Playfair Display',serif", fontSize: 32, color: '#0f172a', letterSpacing: '-0.01em' },
  orgYear: { background: '#0d9488', color: '#ffffff', borderRadius: 999, padding: '4px 16px', fontSize: 14, fontWeight: 600 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' },
  title: { fontFamily: "'Playfair Display',serif", fontSize: 28, color: '#0f172a' },
  subtitle: { color: '#64748b', fontSize: 14, marginTop: 4 },
  btnGroup: { display: 'flex', gap: 12, alignItems: 'center' },
  dlBtn: { background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f766e', borderRadius: 10, padding: '11px 20px', fontWeight: 600, fontSize: 14 },
  addBtn: { background: '#0d9488', color: '#ffffff', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 600, fontSize: 14, boxShadow: '0 4px 12px rgba(13,148,136,0.3)' },

  tabs: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 },
  tab: { background: '#ffffff', border: '1px solid #cbd5e1', color: '#475569', borderRadius: 999, padding: '8px 22px', fontSize: 14, fontWeight: 600 },
  tabActive: { background: '#0d9488', borderColor: '#0d9488', color: '#ffffff', boxShadow: '0 4px 12px rgba(13,148,136,0.25)' },
  tabAdd: { background: 'transparent', border: '1px dashed #5eead4', color: '#0f766e', borderRadius: 999, padding: '8px 18px', fontSize: 14, fontWeight: 500 },
  yearForm: { display: 'flex', gap: 6, alignItems: 'center' },
  yearInput: { width: 100, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 999, padding: '8px 14px', fontSize: 14, outline: 'none' },
  yearOk: { background: '#0d9488', color: '#ffffff', border: 'none', borderRadius: 999, padding: '8px 16px', fontSize: 14, fontWeight: 600 },
  yearCancel: { background: 'none', border: 'none', color: '#64748b', fontSize: 16, padding: '4px 8px' },

  summaryRow: { display: 'flex', gap: 16, margin: '0 0 24px', flexWrap: 'wrap' },
  summaryChip: { background: '#ffffff', border: '1px solid #e2e8f0', borderLeft: '4px solid #0d9488', borderRadius: 12, padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: 4, boxShadow: '0 1px 3px rgba(15,23,42,0.05)' },
  chipLabel: { color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' },
  chipValue: { color: '#0f766e', fontSize: 24, fontFamily: "'Playfair Display',serif", fontWeight: 700 },
  search: { width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#1e293b', outline: 'none', marginBottom: 16 },
  tableWrap: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'auto', boxShadow: '0 1px 3px rgba(15,23,42,0.05)' },
  loading: { color: '#64748b', padding: '40px', textAlign: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '14px 20px', textAlign: 'left', color: '#0f766e', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #e2e8f0', background: '#f0fdfa' },
  td: { padding: '14px 20px', color: '#475569', fontSize: 14 },
  trEven: { background: '#ffffff' },
  trOdd: { background: '#f8fafc' },
  editBtn: { background: '#f0fdfa', border: '1px solid #99f6e4', color: '#0f766e', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 500, marginRight: 8 },
  deleteBtn: { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 500 },

  overlay: { position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)', padding: 16 },
  modal: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, padding: '32px', width: '100%', maxWidth: 440, boxShadow: '0 24px 60px rgba(15,23,42,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontFamily: "'Playfair Display',serif", fontSize: 22, color: '#0f172a' },
  closeBtn: { background: 'none', border: 'none', color: '#64748b', fontSize: 18 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 11, fontWeight: 600, color: '#0f766e', letterSpacing: '0.08em', textTransform: 'uppercase' },
  input: { background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: '11px 14px', color: '#1e293b', fontSize: 14, outline: 'none' },
  error: { color: '#dc2626', fontSize: 13 },
  modalActions: { display: 'flex', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, background: '#ffffff', border: '1px solid #cbd5e1', color: '#475569', borderRadius: 10, padding: '12px', fontSize: 14 },
  submitBtn: { flex: 1, background: '#0d9488', color: '#ffffff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600 },
}
