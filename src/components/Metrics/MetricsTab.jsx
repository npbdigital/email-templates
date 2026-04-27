import { useMetrics } from '../../hooks/useMetrics'
import KpiCards from './KpiCards'
import ChartByDate from './ChartByDate'
import TableByTemplate from './TableByTemplate'
import EventsLog from './EventsLog'

export default function MetricsTab({ templates, days, setDays, templateId, setTemplateId }) {
  const { metrics, loading, reload } = useMetrics(days, templateId)
  const { totals, byDate, byTemplate, events } = metrics

  const lblStyle = { fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }
  const selStyle = { border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: 13, outline: 'none', background: 'white', cursor: 'pointer' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <label style={lblStyle}>Período</label>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={selStyle}>
            <option value={7}>Últimos 7 dias</option>
            <option value={14}>Últimos 14 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
        </div>
        <div>
          <label style={lblStyle}>Template</label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            style={{ ...selStyle, minWidth: 200 }}
          >
            <option value="">Todos os templates</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div style={{ marginTop: 20 }}>
          <button
            onClick={reload}
            style={{ background: '#0f766e', color: 'white', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, cursor: 'pointer' }}
          >
            {loading ? 'Carregando...' : '↻ Atualizar'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>Carregando métricas...</div>
      ) : (
        <>
          <KpiCards totals={totals} />
          <ChartByDate byDate={byDate} />
          <TableByTemplate byTemplate={byTemplate} />
          <EventsLog events={events} />
        </>
      )}
    </div>
  )
}
