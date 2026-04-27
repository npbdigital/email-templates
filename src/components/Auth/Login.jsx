import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) setError(err.message || 'Falha ao entrar.')
  }

  const inp = { width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none' }
  const lbl = { fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380, background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>Email Templates</h1>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>NPB Digital — Felipe Sempe</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>E-mail</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inp}
            />
          </div>

          <div>
            <label style={lbl}>Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inp}
            />
          </div>

          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              background: loading || !email || !password ? '#94a3b8' : '#0f766e',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '11px 22px',
              fontSize: 14,
              fontWeight: 500,
              cursor: loading || !email || !password ? 'default' : 'pointer',
              marginTop: 4
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
