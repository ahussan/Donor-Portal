'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err.message || 'Sign in failed.')
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🕌</div>
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

          <button style={loading ? { ...styles.btn, opacity: 0.7 } : styles.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <a href="/" style={styles.publicLink}>View donor list →</a>
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
    padding: 24,
    background: 'linear-gradient(160deg, #e0f7f4 0%, #f4f8fb 50%, #e8f0fe 100%)',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 20,
    padding: '48px 40px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 20px 50px rgba(15,23,42,0.08)',
    textAlign: 'center',
  },
  logo: {
    width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
    background: '#ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
  },
  title: { fontSize: 28, color: '#0f172a', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 32 },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' },
  label: { fontSize: 12, fontWeight: 600, color: '#0f766e', letterSpacing: '0.08em', textTransform: 'uppercase' },
  input: {
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: 10,
    padding: '12px 16px',
    color: '#1e293b',
    fontSize: 15,
    outline: 'none',
  },
  error: { color: '#dc2626', fontSize: 13, margin: '-8px 0' },
  btn: {
    marginTop: 8,
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    borderRadius: 10,
    padding: '14px',
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: '0.04em',
    boxShadow: '0 4px 12px rgba(13,148,136,0.3)',
  },
  publicLink: { display: 'inline-block', marginTop: 24, color: '#0d9488', fontSize: 13, fontWeight: 500 },
}
