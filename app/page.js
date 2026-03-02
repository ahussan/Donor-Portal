'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ── Hard-coded credentials ──
const USERS = [
  { username: 'admin',  password: 'admin123' },
  { username: 'admin1', password: 'admin1pass' },
  { username: 'admin2', password: 'admin2pass' },
]

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTimeout(() => {
      if (USERS.some(u => u.username === username && u.password === password)) {
        localStorage.setItem('donor_auth', 'true')
        router.push('/collection')
      } else {
        setError('Invalid username or password.')
        setLoading(false)
      }
    }, 400)
  }

  return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.card}>
        <h1 style={styles.title}>Darus Sunnah New York</h1>
        <p style={styles.subtitle}>Sign in to manage collections</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoFocus
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button style={loading ? {...styles.btn, opacity: 0.7} : styles.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <a href="/dashboard" style={styles.publicLink}>View public dashboard →</a>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bg: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at 30% 50%, #1a2e45 0%, #0d1b2a 60%)',
    zIndex: 0,
  },
  card: {
    position: 'relative', zIndex: 1,
    background: 'rgba(26,46,69,0.9)',
    border: '1px solid rgba(201,168,76,0.3)',
    borderRadius: 16,
    padding: '48px 40px',
    width: '100%',
    maxWidth: 400,
    backdropFilter: 'blur(12px)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
    textAlign: 'center',
  },
  logoMark: {
    fontSize: 28, color: '#c9a84c', marginBottom: 16,
    display: 'inline-block',
    animation: 'pulse 3s ease-in-out infinite',
  },
  title: {
    fontSize: 28, color: '#f5f0e8', marginBottom: 6,
    fontFamily: "'Playfair Display', serif",
  },
  subtitle: {
    fontSize: 14, color: '#8a9bb0', marginBottom: 32,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' },
  label: { fontSize: 12, fontWeight: 600, color: '#c9a84c', letterSpacing: '0.08em', textTransform: 'uppercase' },
  input: {
    background: 'rgba(13,27,42,0.8)',
    border: '1px solid rgba(201,168,76,0.25)',
    borderRadius: 8,
    padding: '12px 16px',
    color: '#f5f0e8',
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  error: { color: '#e05c5c', fontSize: 13, margin: '-8px 0' },
  btn: {
    marginTop: 8,
    background: 'linear-gradient(135deg, #c9a84c, #e4c97e)',
    color: '#0d1b2a',
    border: 'none',
    borderRadius: 8,
    padding: '14px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.1s',
    letterSpacing: '0.04em',
  },
  publicLink: {
    display: 'inline-block',
    marginTop: 24,
    color: '#8a9bb0',
    fontSize: 13,
    transition: 'color 0.2s',
  },
}
