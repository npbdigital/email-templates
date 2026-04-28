import { useState } from 'react'

function slugify(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60)
}

export default function NewAutomationModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [trigger, setTrigger] = useState('')
  const [touchedTrigger, setTouchedTrigger] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')

  const triggerVal = touchedTrigger ? trigger : slugify(name)
  const canSubmit = name.trim().length > 0 && triggerVal.trim().length > 0 && !submitting

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setErr('')
    setSubmitting(true)
    try {
      await onCreate({ name: name.trim(), trigger_event: triggerVal.trim() })
    } catch (e2) {
      setErr(e2?.message || 'Falha ao criar automação.')
      setSubmitting(false)
    }
  }

  const inp = { width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }
  const lbl = { fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{ background: 'white', borderRadius: 14, padding: 24, width: '100%', maxWidth: 460, border: '1px solid #e2e8f0' }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Nova automação</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Nome</label>
            <input
              autoFocus
              style={inp}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Webnário — fluxo lembrete"
            />
          </div>
          <div>
            <label style={lbl}>Nome do evento (gatilho)</label>
            <input
              style={inp}
              value={triggerVal}
              onChange={(e) => { setTouchedTrigger(true); setTrigger(e.target.value) }}
              placeholder="webnario_confirmado"
            />
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>
              É o nome usado pelo Unnichat para iniciar a automação. Use letras minúsculas, números e underline.
            </p>
          </div>

          {err && (
            <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
              {err}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', padding: '8px 14px' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              background: canSubmit ? '#0f766e' : '#94a3b8',
              color: 'white', border: 'none', borderRadius: 8,
              padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: canSubmit ? 'pointer' : 'default'
            }}
          >
            {submitting ? 'Criando...' : 'Criar e abrir'}
          </button>
        </div>
      </form>
    </div>
  )
}
