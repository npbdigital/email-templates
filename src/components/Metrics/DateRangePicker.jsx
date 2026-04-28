import { useEffect, useRef, useState } from 'react'

const PRESETS = [
  { id: 'today', label: 'Hoje' },
  { id: 'yesterday', label: 'Ontem' },
  { id: 'last7', label: 'Últimos 7 dias' },
  { id: 'last14', label: 'Últimos 14 dias' },
  { id: 'last30', label: 'Últimos 30 dias' },
  { id: 'this_month', label: 'Este mês' },
  { id: 'last_month', label: 'Mês passado' },
  { id: 'custom', label: 'Personalizado' }
]

function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function presetRange(id) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (id === 'today') return { start: toISODate(today), end: toISODate(today) }
  if (id === 'yesterday') {
    const y = new Date(today); y.setDate(today.getDate() - 1)
    return { start: toISODate(y), end: toISODate(y) }
  }
  if (id === 'last7') {
    const s = new Date(today); s.setDate(today.getDate() - 6)
    return { start: toISODate(s), end: toISODate(today) }
  }
  if (id === 'last14') {
    const s = new Date(today); s.setDate(today.getDate() - 13)
    return { start: toISODate(s), end: toISODate(today) }
  }
  if (id === 'last30') {
    const s = new Date(today); s.setDate(today.getDate() - 29)
    return { start: toISODate(s), end: toISODate(today) }
  }
  if (id === 'this_month') {
    const s = new Date(today.getFullYear(), today.getMonth(), 1)
    return { start: toISODate(s), end: toISODate(today) }
  }
  if (id === 'last_month') {
    const s = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const e = new Date(today.getFullYear(), today.getMonth(), 0)
    return { start: toISODate(s), end: toISODate(e) }
  }
  return null
}

export default function DateRangePicker({ startDate, endDate, onChange }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const inp = {
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: 13,
    outline: 'none',
    background: 'white',
    color: '#1e293b'
  }
  const lbl = { fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }

  const applyPreset = (id) => {
    setOpen(false)
    if (id === 'custom') return
    const range = presetRange(id)
    if (range) onChange(range.start, range.end)
  }

  return (
    <>
      <div>
        <label style={lbl}>De</label>
        <input
          type="date"
          value={startDate}
          max={endDate || undefined}
          onChange={(e) => onChange(e.target.value, endDate)}
          style={inp}
        />
      </div>
      <div>
        <label style={lbl}>Até</label>
        <input
          type="date"
          value={endDate}
          min={startDate || undefined}
          onChange={(e) => onChange(startDate, e.target.value)}
          style={inp}
        />
      </div>
      <div ref={wrapRef} style={{ position: 'relative' }}>
        <label style={lbl}>&nbsp;</label>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{
            border: '1px solid #e2e8f0',
            background: 'white',
            borderRadius: 8,
            padding: '7px 12px',
            fontSize: 13,
            cursor: 'pointer',
            color: '#475569',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          Atalhos ▾
        </button>
        {open && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
            padding: 6,
            minWidth: 180,
            zIndex: 10
          }}>
            {PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '7px 10px',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#475569',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
