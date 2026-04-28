function formatLabel(d, granularity) {
  if (granularity === 'week') {
    // d like "2026-W17" -> "S17"
    const wk = d.split('-W')[1]
    return wk ? `S${wk}` : d
  }
  return d.slice(5) // "MM-DD"
}

export default function ChartByDate({ byDate, granularity = 'day' }) {
  if (byDate.length === 0) return null

  const mv = Math.max(...byDate.map(d => Math.max(d.sent || 0, d.opened || 0, d.clicked || 0))) || 1
  const title = granularity === 'week' ? 'Envios por semana' : 'Envios por dia'

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 20 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 16 }}>{title}</p>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, overflowX: 'auto' }}>
        {byDate.map(d => (
          <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1, minWidth: 40 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 90 }}>
              {[
                { v: d.sent, c: '#0f766e' },
                { v: d.opened, c: '#0284c7' },
                { v: d.clicked, c: '#7c3aed' }
              ].map((bar, i) => (
                <div
                  key={i}
                  title={bar.v}
                  style={{
                    width: 8,
                    height: `${Math.max((bar.v / mv) * 90, bar.v > 0 ? 3 : 0)}px`,
                    background: bar.c,
                    borderRadius: '2px 2px 0 0',
                    transition: 'height 0.3s'
                  }}
                />
              ))}
            </div>
            <p style={{ fontSize: 9, color: '#94a3b8', transform: 'rotate(-45deg)', transformOrigin: 'center', whiteSpace: 'nowrap', marginTop: 4 }}>
              {formatLabel(d.date, granularity)}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        {[{ c: '#0f766e', l: 'Enviados' }, { c: '#0284c7', l: 'Abertos' }, { c: '#7c3aed', l: 'Cliques' }].map(item => (
          <div key={item.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: item.c }} />
            <span style={{ fontSize: 11, color: '#64748b' }}>{item.l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
