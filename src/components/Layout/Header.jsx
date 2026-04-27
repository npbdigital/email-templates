export default function Header({ tab, setTab, onNewTemplate, onLogout, userEmail }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Email Templates</h1>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>NPB Digital — Felipe Sempe</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 3 }}>
          {[{ id: 'templates', label: 'Templates' }, { id: 'metrics', label: 'Métricas' }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                background: tab === t.id ? '#0f766e' : 'transparent',
                color: tab === t.id ? 'white' : '#64748b',
                transition: 'all 0.15s'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'templates' && (
          <button
            onClick={onNewTemplate}
            style={{ background: '#0f766e', color: 'white', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            + Novo template
          </button>
        )}
        {userEmail && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 10, borderLeft: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>{userEmail}</span>
            <button
              onClick={onLogout}
              style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: '#64748b', cursor: 'pointer' }}
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
