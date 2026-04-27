const pct = (n, d) => (d > 0 ? ((n / d) * 100).toFixed(1) + '%' : '—')

export default function KpiCards({ totals }) {
  const sent = totals.sent || totals.delivered || 0
  const opened = totals.opened || 0
  const clicked = totals.clicked || 0
  const bounced = (totals.hardBounce || 0) + (totals.softBounce || 0)

  const cards = [
    { label: 'Enviados', value: sent, sub: null, color: '#0f766e' },
    { label: 'Aberturas', value: opened, sub: pct(opened, sent), color: '#0284c7' },
    { label: 'Cliques', value: clicked, sub: pct(clicked, opened), color: '#7c3aed' },
    { label: 'Bounces', value: bounced, sub: pct(bounced, sent), color: '#dc2626' }
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
      {cards.map(k => (
        <div key={k.label} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
          <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{k.label}</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value.toLocaleString()}</p>
          {k.sub && <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{k.sub} do total</p>}
        </div>
      ))}
    </div>
  )
}
