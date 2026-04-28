import { useState } from 'react'
import { useMetrics } from '../../hooks/useMetrics'
import KpiCards from './KpiCards'
import ChartByDate from './ChartByDate'
import TableByTemplate from './TableByTemplate'
import EventsLog from './EventsLog'
import DateRangePicker, { presetRange } from './DateRangePicker'
import NotificationsBanner from '../Notifications/NotificationsBanner'

const initial = presetRange('last7')

export default function MetricsTab({ templates }) {
  const [startDate, setStartDate] = useState(initial.start)
  const [endDate, setEndDate] = useState(initial.end)
  const [templateId, setTemplateId] = useState('')

  const { metrics, loading, reload } = useMetrics(startDate, endDate, templateId)
  const { totals, byDate, byTemplate, events, granularity, unsubscribedCount, spamCount } = metrics

  const onRangeChange = (s, e) => {
    setStartDate(s)
    setEndDate(e)
  }

  const lblStyle = { fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }
  const selStyle = { border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: 13, outline: 'none', background: 'white', cursor: 'pointer' }

  return (
    <div>
      <NotificationsBanner />

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={onRangeChange}
        />
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
        <div>
          <button
            onClick={reload}
            style={{ background: '#0f766e', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}
          >
            {loading ? 'Carregando...' : '↻ Atualizar'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>Carregando métricas...</div>
      ) : (
        <>
          <KpiCards totals={totals} unsubscribedCount={unsubscribedCount} spamCount={spamCount} />
          <ChartByDate byDate={byDate} granularity={granularity} />
          <TableByTemplate byTemplate={byTemplate} />
          <EventsLog events={events} />
        </>
      )}
    </div>
  )
}
