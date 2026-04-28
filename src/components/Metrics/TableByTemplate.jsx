const pct = (n, d) => (d > 0 ? ((n / d) * 100).toFixed(1) + '%' : '—')

export default function TableByTemplate({ byTemplate }) {
  if (byTemplate.length === 0) return null

  const headers = ['Template', 'Enviados', 'Entregues', 'Aberturas', 'Taxa abertura', 'Cliques', 'Taxa clique']

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 20 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 14 }}>Por template</p>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
            {headers.map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {byTemplate.map((t) => (
            <tr key={t.id} style={{ borderBottom: '1px solid #f8fafc' }}>
              <td style={{ padding: '8px 10px', color: '#1e293b', fontWeight: 500 }}>{t.name}</td>
              <td style={{ padding: '8px 10px', color: '#475569' }}>{t.sent}</td>
              <td style={{ padding: '8px 10px', color: '#475569' }}>{t.delivered}</td>
              <td style={{ padding: '8px 10px', color: '#0284c7', fontWeight: 600 }}>{t.opened}</td>
              <td style={{ padding: '8px 10px', color: '#0284c7' }}>{pct(t.opened, t.sent)}</td>
              <td style={{ padding: '8px 10px', color: '#7c3aed', fontWeight: 600 }}>{t.clicked}</td>
              <td style={{ padding: '8px 10px', color: '#7c3aed' }}>{pct(t.clicked, t.opened)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
