import { useState, useEffect } from 'react'
import { EVENT_LABELS, EVENT_COLORS } from '../../lib/supabase'

const PAGE_SIZE = 20

export default function EventsLog({ events }) {
  const [page, setPage] = useState(0)

  useEffect(() => { setPage(0) }, [events])

  const paged = events.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const headers = ['Data', 'E-mail', 'Lead', 'Evento', 'Template']

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 14 }}>Log de eventos — leads individuais</p>

      {events.length === 0 ? (
        <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '30px 0' }}>
          Nenhum evento registrado ainda.
        </p>
      ) : (
        <>
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
              {paged.map((e, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '8px 10px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {e.event_date ? new Date(e.event_date).toLocaleString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                      timeZone: 'America/Sao_Paulo'
                    }) : '—'}
                  </td>
                  <td style={{ padding: '8px 10px', color: '#1e293b' }}>{e.email}</td>
                  <td style={{ padding: '8px 10px', color: '#475569' }}>{e.lead_name || '—'}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{
                      background: (EVENT_COLORS[e.event_type] || '#94a3b8') + '22',
                      color: EVENT_COLORS[e.event_type] || '#94a3b8',
                      padding: '2px 8px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      {EVENT_LABELS[e.event_type] || e.event_type}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', color: '#64748b' }}>{e.email_templates?.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {events.length > PAGE_SIZE && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, events.length)} de {events.length}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  style={{
                    background: 'none',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    padding: '4px 12px',
                    fontSize: 12,
                    cursor: page === 0 ? 'default' : 'pointer',
                    color: page === 0 ? '#cbd5e1' : '#475569'
                  }}
                >
                  ← Anterior
                </button>
                <button
                  disabled={(page + 1) * PAGE_SIZE >= events.length}
                  onClick={() => setPage(p => p + 1)}
                  style={{
                    background: 'none',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    padding: '4px 12px',
                    fontSize: 12,
                    cursor: (page + 1) * PAGE_SIZE >= events.length ? 'default' : 'pointer',
                    color: (page + 1) * PAGE_SIZE >= events.length ? '#cbd5e1' : '#475569'
                  }}
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
