'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CollectionPage() {
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', tel: '', amount: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [editDonor, setEditDonor] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', address: '', tel: '', amount: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (localStorage.getItem('donor_auth') !== 'true') {
      router.replace('/')
      return
    }
    loadDonors()
  }, [])

  async function loadDonors() {
    setLoading(true)
    const res = await fetch('/api/donors')
    const { donors } = await res.json()
    setDonors(donors || [])
    setLoading(false)
  }

  function logout() {
    localStorage.removeItem('donor_auth')
    router.push('/')
  }

  function downloadCSV() {
    const header = 'sn,name,address,tel,amount'
    const rows = donors.map(d => `${d.sn},${d.name},${d.address},${d.tel},${d.amount}`)
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `donors_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleAdd(e) {
    e.preventDefault()
    setFormError('')
    if (!form.name || !form.amount) {
      setFormError('All fields are required.')
      return
    }
    if (isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) {
      setFormError('Amount must be a positive number.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.error) { setFormError(data.error); setSaving(false); return }
      setShowModal(false)
      setForm({ name: '', address: '', tel: '', amount: '' })
      await loadDonors()
    } catch {
      setFormError('Failed to save. Try again.')
    }
    setSaving(false)
  }

  function openEdit(donor) {
    setEditDonor(donor)
    setEditForm({ name: donor.name, address: donor.address, tel: donor.tel, amount: donor.amount })
    setEditError('')
  }

  async function handleEditSave(e) {
    e.preventDefault()
    setEditError('')
    if (!editForm.name || !editForm.amount) {
      setEditError('All fields are required.')
      return
    }
    setEditSaving(true)
    try {
      const res = await fetch('/api/donors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sn: editDonor.sn, ...editForm }),
      })
      const data = await res.json()
      if (data.error) { setEditError(data.error); setEditSaving(false); return }
      setEditDonor(null)
      await loadDonors()
    } catch {
      setEditError('Failed to save. Try again.')
    }
    setEditSaving(false)
  }

  const totalAmount = donors.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)

  return (
    <div style={s.page}>
      <div style={s.bgGlow} />

      <nav style={s.nav}>
        <span style={s.navBrand}>Darus Sunnah New York</span>
        <div style={s.navLinks}>
          <a href="/dashboard" style={s.navLink}>Dashboard</a>
          <button onClick={logout} style={s.navBtn}>Sign Out</button>
        </div>
      </nav>

      <main style={s.main}>
        <div style={s.header}>
          <div>
            <h2 style={s.title}>Donor Details and Committed Amounts for Tarawhee</h2>
            <p style={s.subtitle}>Manage and track all donor contributions</p>
          </div>
          <div style={s.btnGroup}>
            <button style={s.dlBtn} onClick={downloadCSV}>⬇ Download CSV</button>
            <button style={s.addBtn} onClick={() => setShowModal(true)}>+ Add Donor</button>
          </div>
        </div>

        <div style={s.summaryRow}>
          <div style={s.summaryChip}>
            <span style={s.chipLabel}>Total Collected</span>
            <span style={s.chipValue}>$ {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={s.summaryChip}>
            <span style={s.chipLabel}>Total Donors</span>
            <span style={s.chipValue}>{donors.length}</span>
          </div>
        </div>

        <div style={s.tableWrap}>
          {loading ? (
            <p style={s.loading}>Loading…</p>
          ) : donors.length === 0 ? (
            <p style={s.loading}>No donors yet. Add the first one!</p>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  {['#', 'Name', 'Address', 'Telephone', 'Amount ($)', ''].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donors.map((d, i) => (
                  <tr key={d.sn} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                    <td style={s.td}>{d.sn}</td>
                    <td style={{...s.td, fontWeight: 500, color: '#f5f0e8'}}>{d.name}</td>
                    <td style={s.td}>{d.address}</td>
                    <td style={s.td}>{d.tel}</td>
                    <td style={{...s.td, color: '#c9a84c', fontWeight: 600, fontFamily: "'Playfair Display',serif"}}>
                      {parseFloat(d.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={s.td}>
                      <button style={s.editBtn} onClick={() => openEdit(d)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Add Modal */}
      {showModal && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Add New Donor</h3>
              <button style={s.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAdd} style={s.form}>
              {[
                { label: 'Full Name', key: 'name', placeholder: 'Donor full name', type: 'text' },
                { label: 'Address', key: 'address', placeholder: 'Street, City', type: 'text' },
                { label: 'Telephone', key: 'tel', placeholder: '347 XXXXXXX', type: 'tel' },
                { label: 'Amount $', key: 'amount', placeholder: '0.00', type: 'number' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key} style={s.field}>
                  <label style={s.label}>{label}</label>
                  <input style={s.input} type={type} placeholder={placeholder}
                    value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    min={type === 'number' ? '0' : undefined} step={type === 'number' ? '0.01' : undefined} />
                </div>
              ))}
              {formError && <p style={s.error}>{formError}</p>}
              <div style={s.modalActions}>
                <button type="button" style={s.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={saving ? {...s.submitBtn, opacity: 0.7} : s.submitBtn} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Donor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editDonor && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setEditDonor(null) }}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Edit Donor #{editDonor.sn}</h3>
              <button style={s.closeBtn} onClick={() => setEditDonor(null)}>✕</button>
            </div>
            <form onSubmit={handleEditSave} style={s.form}>
              {[
                { label: 'Full Name', key: 'name', type: 'text' },
                { label: 'Address', key: 'address', type: 'text' },
                { label: 'Telephone', key: 'tel', type: 'tel' },
                { label: 'Amount $', key: 'amount', type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key} style={s.field}>
                  <label style={s.label}>{label}</label>
                  <input style={s.input} type={type}
                    value={editForm[key]} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                    min={type === 'number' ? '0' : undefined} step={type === 'number' ? '0.01' : undefined} />
                </div>
              ))}
              {editError && <p style={s.error}>{editError}</p>}
              <div style={s.modalActions}>
                <button type="button" style={s.cancelBtn} onClick={() => setEditDonor(null)}>Cancel</button>
                <button type="submit" style={editSaving ? {...s.submitBtn, opacity: 0.7} : s.submitBtn} disabled={editSaving}>
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', position: 'relative' },
  bgGlow: { position: 'fixed', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #1a2e45 0%, #0d1b2a 70%)' },
  nav: { position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', borderBottom: '1px solid rgba(201,168,76,0.15)' },
  navBrand: { color: '#c9a84c', fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 600 },
  navLinks: { display: 'flex', alignItems: 'center', gap: 16 },
  navLink: { color: '#8a9bb0', fontSize: 14 },
  navBtn: { background: 'transparent', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', borderRadius: 6, padding: '7px 16px', fontSize: 13, cursor: 'pointer' },
  main: { position: 'relative', zIndex: 1, padding: '40px', maxWidth: 1100, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontFamily: "'Playfair Display',serif", fontSize: 30, color: '#f5f0e8' },
  subtitle: { color: '#8a9bb0', fontSize: 14, marginTop: 4 },
  btnGroup: { display: 'flex', gap: 12, alignItems: 'center' },
  dlBtn: { background: 'transparent', border: '1px solid rgba(201,168,76,0.4)', color: '#c9a84c', borderRadius: 8, padding: '12px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  addBtn: { background: 'linear-gradient(135deg,#c9a84c,#e4c97e)', color: '#0d1b2a', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  summaryRow: { display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' },
  summaryChip: { background: 'rgba(26,46,69,0.8)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 10, padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: 4 },
  chipLabel: { color: '#8a9bb0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' },
  chipValue: { color: '#c9a84c', fontSize: 22, fontFamily: "'Playfair Display',serif", fontWeight: 700 },
  tableWrap: { background: 'rgba(26,46,69,0.7)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, overflow: 'auto', backdropFilter: 'blur(8px)' },
  loading: { color: '#8a9bb0', padding: '40px', textAlign: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '14px 20px', textAlign: 'left', color: '#c9a84c', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(201,168,76,0.2)', background: 'rgba(13,27,42,0.5)' },
  td: { padding: '14px 20px', color: '#8a9bb0', fontSize: 14 },
  trEven: { background: 'transparent' },
  trOdd: { background: 'rgba(13,27,42,0.3)' },
  overlay: { position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' },
  modal: { background: '#1a2e45', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 16, padding: '32px', width: '100%', maxWidth: 440, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontFamily: "'Playfair Display',serif", fontSize: 22, color: '#f5f0e8' },
  closeBtn: { background: 'none', border: 'none', color: '#8a9bb0', fontSize: 18, cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 11, fontWeight: 600, color: '#c9a84c', letterSpacing: '0.08em', textTransform: 'uppercase' },
  input: { background: 'rgba(13,27,42,0.8)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 8, padding: '11px 14px', color: '#f5f0e8', fontSize: 14, outline: 'none' },
  error: { color: '#e05c5c', fontSize: 13 },
  modalActions: { display: 'flex', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, background: 'transparent', border: '1px solid rgba(201,168,76,0.2)', color: '#8a9bb0', borderRadius: 8, padding: '12px', fontSize: 14, cursor: 'pointer' },
  editBtn: { background: 'transparent', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' },
  submitBtn: { flex: 1, background: 'linear-gradient(135deg,#c9a84c,#e4c97e)', color: '#0d1b2a', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
}