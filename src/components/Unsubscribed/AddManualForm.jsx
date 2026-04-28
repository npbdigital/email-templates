import { useState } from 'react'

export default function AddManualForm({ onAdd }) {
  const [email, setEmail] = useState('')
  const [contactName, setContactName] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')

  const inp = { border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', background: 'white' }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setErr('')
    setSubmitting(true)
    try {
      await onAdd({ email, contact_name: contactName, reason })
      setEmail('')
      setContactName('')
      setReason('')
    } catch (e2) {
      setErr(e2?.message || 'Falha ao adicionar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 18, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="email@exemplo.com"
        style={{ ...inp, flex: '2 1 220px' }}
      />
      <input
        value={contactName}
        onChange={e => setContactName(e.target.value)}
        placeholder="Nome (opcional)"
        style={{ ...inp, flex: '1 1 140px' }}
      />
      <input
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="Motivo (opcional)"
        style={{ ...inp, flex: '2 1 200px' }}
      />
      <button
        type="submit"
        disabled={!email.trim() || submitting}
        style={{
          background: email.trim() && !submitting ? '#0f766e' : '#94a3b8',
          color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500,
          cursor: email.trim() && !submitting ? 'pointer' : 'default'
        }}
      >
        {submitting ? 'Adicionando...' : '+ Adicionar'}
      </button>
      {err && (
        <div style={{ width: '100%', background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
          {err}
        </div>
      )}
    </form>
  )
}
