import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const COUNTABLE = ['sent', 'delivered', 'opened', 'clicked']

export function useMetrics(days, templateId) {
  const [metrics, setMetrics] = useState({ totals: {}, byDate: [], byTemplate: [], events: [] })
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const since = new Date()
    since.setDate(since.getDate() - days)

    let query = supabase
      .from('email_events')
      .select('*')
      .gte('event_date', since.toISOString())
      .order('event_date', { ascending: false })
      .limit(1000)

    if (templateId) query = query.eq('template_id', templateId)

    const { data } = await query
    const events = Array.isArray(data) ? data : []

    const totals = {}
    events.forEach(e => { totals[e.event_type] = (totals[e.event_type] || 0) + 1 })

    const dateMap = {}
    events.forEach(e => {
      const d = e.event_date?.slice(0, 10)
      if (!d) return
      if (!dateMap[d]) dateMap[d] = { date: d, sent: 0, delivered: 0, opened: 0, clicked: 0 }
      if (COUNTABLE.includes(e.event_type)) dateMap[d][e.event_type]++
    })
    const byDate = Object.values(dateMap).sort((a, b) => (a.date > b.date ? 1 : -1))

    const tplMap = {}
    events.forEach(e => {
      const k = e.template_name || e.template_id || 'Sem template'
      if (!tplMap[k]) tplMap[k] = { name: k, sent: 0, delivered: 0, opened: 0, clicked: 0 }
      if (COUNTABLE.includes(e.event_type)) tplMap[k][e.event_type]++
    })
    const byTemplate = Object.values(tplMap).sort((a, b) => b.sent - a.sent)

    setMetrics({ totals, byDate, byTemplate, events })
    setLoading(false)
  }, [days, templateId])

  useEffect(() => { load() }, [load])

  return { metrics, loading, reload: load }
}
