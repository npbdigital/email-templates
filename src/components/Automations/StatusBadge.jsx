const MAP = {
  draft:  { label: 'Rascunho', bg: '#f1f5f9', fg: '#64748b' },
  active: { label: 'Ativa',    bg: '#ecfdf5', fg: '#047857' },
  paused: { label: 'Pausada',  bg: '#fef3c7', fg: '#92400e' }
}

export default function StatusBadge({ status }) {
  const s = MAP[status] || MAP.draft
  return (
    <span style={{
      display: 'inline-block',
      background: s.bg,
      color: s.fg,
      fontSize: 11,
      fontWeight: 600,
      padding: '3px 9px',
      borderRadius: 20
    }}>
      {s.label}
    </span>
  )
}
