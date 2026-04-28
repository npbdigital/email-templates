import { useState } from 'react'
import { UserX, Download, Undo2 } from 'lucide-react'
import DateRangePicker, { presetRange } from '../components/Metrics/DateRangePicker'
import AddManualForm from '../components/Unsubscribed/AddManualForm'
import { useUnsubscribed, sourceLabel, exportUnsubscribedCsv } from '../hooks/useUnsubscribed'

const SOURCE_OPTIONS = [
  { value: '', label: 'Todas as origens' },
  { value: 'link_email', label: 'Link no e-mail' },
  { value: 'manual', label: 'Manual' },
  { value: 'hard_bounce', label: 'Hard bounce' },
  { value: 'spam_complaint', label: 'Reclamação de spam' },
  { value: 'soft_bounce_repeated', label: 'Soft bounce repetido' }
]

const initial = presetRange('last30')

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  })
}

const SOURCE_BADGE_COLORS = {
  link_email: { bg: '#f0f9ff', fg: '#0369a1' },
  manual: { bg: '#f1f5f9', fg: '#475569' },
  hard_bounce: { bg: '#fffbeb', fg: '#b45309' },
  spam_complaint: { bg: '#fef2f2', fg: '#b91c1c' },
  soft_bounce_repeated: { bg: '#fefce8', fg: '#a16207' }
}

export default function UnsubscribedPage() {
  const [sourceFilter, setSourceFilter] = useState('')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState(initial.start)
  const [endDate, setEndDate] = useState(initial.end)
  const [busyEmail, setBusyEmail] = useState(null)

  const { items, loading, addManual, reactivate } = useUnsubscribed({
    sourceFilter,
    search,
    startDate,
    endDate
  })

  const handleReactivate = async (email, source) => {
    const isCritical = source === 'spam_complaint' || source === 'hard_bounce'
    const msg = isCritical
      ? `ATENÇÃO: ${email} foi descadastrado por ${sourceLabel(source)}. Reativar este e-mail pode resultar em problemas sérios de entregabilidade. Tem certeza?`
      : `Reativar ${email}? Voltará a receber e-mails normalmente.`
    if (!confirm(msg)) return
    setBusyEmail(email)
    try {
      await reactivate(email)
    } finally {
      setBusyEmail(null)
    }
  }

  const sel = { border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: 13, outline: 'none', background: 'white', cursor: 'pointer' }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Descadastros</h1>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Lista de e-mails que não recebem mais nossas mensagens</p>
        </div>
        <button
          onClick={() => exportUnsubscribedCsv(items)}
          disabled={items.length === 0}
          style={{
            background: items.length > 0 ? 'white' : '#f1f5f9',
            color: items.length > 0 ? '#0f766e' : '#94a3b8',
            border: '1px solid #e2e8f0', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, fontWeight: 500,
            cursor: items.length > 0 ? 'pointer' : 'default',
            display: 'inline-flex', alignItems: 'center', gap: 6
          }}
        >
          <Download size={14} />
          Exportar CSV
        </button>
      </div>

      <AddManualForm onAdd={addManual} />

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <DateRangePicker startDate={startDate} endDate={endDate} onChange={(s, e) => { setStartDate(s); setEndDate(e) }} />
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} style={sel}>
          {SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por e-mail..."
          style={{ ...sel, minWidth: 200, cursor: 'text' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 13 }}>Carregando descadastros...</div>
      ) : items.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: 14, borderRadius: '50%', background: '#f0fdfa', color: '#0f766e', marginBottom: 12 }}>
            <UserX size={28} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>Nenhum descadastro no período</p>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Ajuste os filtros ou amplie o período.</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['E-mail', 'Nome', 'Origem', 'Motivo', 'Data', ''].map((h, i) => (
                  <th key={i} style={{ textAlign: 'left', padding: '10px 14px', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(it => {
                const c = SOURCE_BADGE_COLORS[it.source] || SOURCE_BADGE_COLORS.manual
                return (
                  <tr key={it.email} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', color: '#1e293b', fontWeight: 500, wordBreak: 'break-all' }}>{it.email}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{it.contact_name || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: c.bg, color: c.fg, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20 }}>
                        {sourceLabel(it.source)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 12 }}>{it.reason || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(it.unsubscribed_at)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleReactivate(it.email, it.source)}
                        disabled={busyEmail === it.email}
                        title="Reativar (volta a receber e-mails)"
                        style={{
                          background: 'none', border: '1px solid #e2e8f0', borderRadius: 6,
                          padding: '4px 10px', fontSize: 12, color: '#475569', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: 5
                        }}
                      >
                        <Undo2 size={12} />
                        {busyEmail === it.email ? '...' : 'Reativar'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
