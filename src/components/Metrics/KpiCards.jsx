const pct = (n, d) => (d > 0 ? ((n / d) * 100).toFixed(1) + '%' : '—')

export default function KpiCards({ totals, unsubscribedCount = 0, spamCount = 0 }) {
  const sent = totals.sent || totals.delivered || 0
  const opened = totals.opened || 0
  const clicked = totals.clicked || 0
  const bounced = (totals.hardBounce || 0) + (totals.softBounce || 0)

  const bouncePct = sent > 0 ? bounced / sent : 0
  const spamPct = sent > 0 ? spamCount / sent : 0

  const bouncesBg = bouncePct > 0.02 ? '#fef2f2' : 'white'
  const spamColor = spamPct > 0.005 ? '#dc2626' : '#7c3aed'
  const spamBg = spamPct > 0.005 ? '#fef2f2' : 'white'

  const cards = [
    { label: 'Enviados',     value: sent,               sub: null,                color: '#0f766e', bg: 'white' },
    { label: 'Aberturas',    value: opened,             sub: pct(opened, sent),   color: '#0284c7', bg: 'white' },
    { label: 'Cliques',      value: clicked,            sub: pct(clicked, opened),color: '#7c3aed', bg: 'white' },
    { label: 'Bounces',      value: bounced,            sub: pct(bounced, sent),  color: '#dc2626', bg: bouncesBg },
    { label: 'Descadastros', value: unsubscribedCount,  sub: pct(unsubscribedCount, sent), color: '#64748b', bg: 'white' },
    { label: 'Reclamações',  value: spamCount,          sub: pct(spamCount, sent),color: spamColor, bg: spamBg }
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
      {cards.map(k => (
        <div key={k.label} style={{ background: k.bg, borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 16px' }}>
          <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{k.label}</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{k.value.toLocaleString('pt-BR')}</p>
          {k.sub && <p style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{k.sub} do total</p>}
        </div>
      ))}
    </div>
  )
}
