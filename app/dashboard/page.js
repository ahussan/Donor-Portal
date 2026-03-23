'use client'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, count: 0, donors: [] })
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem('donor_auth') === 'true')
    fetch('/api/donors')
      .then(r => r.json())
      .then(({ donors }) => {
        const d = donors || []
        const total = d.reduce((sum, x) => sum + (parseFloat(x.amount) || 0), 0)
        setStats({ total, count: d.length, donors: d })
      })
  }, [])

  function logout() {
    localStorage.removeItem('donor_auth')
    window.location.href = '/'
  }

  return (
    <div style={s.page}>
      <div style={s.bgGlow} />

      <nav style={s.nav}>
        <span style={s.navBrand}>Darus Sunnah New York</span>
        <div style={s.navLinks}>
          {isLoggedIn ? (
            <>
              <a href="/collection" style={s.navLink}>Collections</a>
              <button onClick={logout} style={s.navBtn}>Sign Out</button>
            </>
          ) : (
            <a href="/" style={{...s.navLink, ...s.navBtnGold}}>Admin Sign In</a>
          )}
        </div>
      </nav>

      <main style={s.main}>
        <div style={s.logoBlock}>
          <div style={s.logoCircle}>
            <span style={s.logoEmoji}>🤝</span>
          </div>
          <h1 style={s.orgName}>Khatam-ul-Quran Hadiya Collection and Distribution</h1>
        </div>

        {/* Distribution Table */}
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={{...s.th, fontFamily: 'Arial, sans-serif', fontWeight: 'bold'}}>Distribution</th>
                <th style={{...s.th, fontFamily: 'Arial, sans-serif', fontWeight: 'bold'}}>Amount ($)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Hafeez Mufti Kawsar Ahmed ', amount: "4000.00" },
                { name: 'Hafeez Minhazur Rahman Choudhury', amount: "4000.00" },
                { name: 'Added to the Mosque Fund (Money given to Humayun Bhi)', amount: "181.00" },
              ].map((row, i) => (
                <tr key={row.name} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                  <td style={{...s.td, fontFamily: 'Arial, sans-serif', fontWeight: 'bold'}}>{row.name}</td>
                  <td style={{...s.td, color: '#c9a84c', fontWeight: 'bold', fontFamily: 'Arial, sans-serif'}}>
                    {row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={s.statsRow}>
          <div style={s.statCard}>
            <p style={s.statLabel}>Total Collected</p>
            <p style={s.statValue}>$ {stats.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            <div style={s.statBar} />
          </div>
          <div style={s.statCard}>
            <p style={s.statLabel}>Total Donors</p>
            <p style={s.statValue}>{stats.count}</p>
            <div style={s.statBar} />
          </div>
        </div>

        <div style={s.tableWrap}>
          {stats.donors.length === 0 ? (
            <p style={s.loading}>No donors yet.</p>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  {['#', 'Donor Name','Collected Amount ($)'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.donors.map((d, i) => (
                  <tr key={d.sn} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                    <td style={s.td}>{d.sn}</td>
                    <td style={{...s.td, fontWeight: 500, color: '#f5f0e8'}}>{d.name}</td>
                    <td style={{...s.td, color: '#c9a84c', fontWeight: 600, fontFamily: "'Playfair Display',serif"}}>
                      {parseFloat(d.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', position: 'relative', overflow: 'hidden' },
  bgGlow: { position: 'fixed', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #1a2e45 0%, #0d1b2a 70%)' },
  nav: { position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', borderBottom: '1px solid rgba(201,168,76,0.15)' },
  navBrand: { color: '#c9a84c', fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 600 },
  navLinks: { display: 'flex', alignItems: 'center', gap: 16 },
  navLink: { color: '#8a9bb0', fontSize: 14 },
  navBtnGold: { background: 'linear-gradient(135deg,#c9a84c,#e4c97e)', color: '#0d1b2a', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 13 },
  navBtn: { background: 'transparent', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', borderRadius: 6, padding: '7px 16px', fontSize: 13, cursor: 'pointer' },
  main: { position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px 60px', gap: 48 },
  logoBlock: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  logoCircle: { width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #1a2e45, #243b55)', border: '2px solid rgba(201,168,76,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(201,168,76,0.15)', fontSize: 44 },
  logoEmoji: { lineHeight: 1 },
  orgName: { fontFamily: "'Playfair Display',serif", fontSize: 36, color: '#f5f0e8', letterSpacing: '-0.02em' },
  tagline: { color: '#8a9bb0', fontSize: 20 },
  statsRow: { display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' },
  statCard: { background: 'rgba(26,46,69,0.8)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 16, padding: '36px 48px', textAlign: 'center', minWidth: 240, backdropFilter: 'blur(8px)', position: 'relative', overflow: 'hidden' },
  statLabel: { color: '#8a9bb0', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 },
  statValue: { fontFamily: "'Playfair Display',serif", fontSize: 38, color: '#c9a84c', fontWeight: 700 },
  statBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' },
  tableWrap: { background: 'rgba(26,46,69,0.7)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, overflow: 'auto', backdropFilter: 'blur(8px)', width: '100%', maxWidth: 900 },
  loading: { color: '#8a9bb0', padding: '40px', textAlign: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '14px 20px', textAlign: 'left', color: '#c9a84c', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(201,168,76,0.2)', background: 'rgba(13,27,42,0.5)' },
  td: { padding: '14px 20px', color: '#8a9bb0', fontSize: 14 },
  trEven: { background: 'transparent' },
  trOdd: { background: 'rgba(13,27,42,0.3)' },
}