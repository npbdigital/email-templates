import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const COUNTABLE = ['sent', 'delivered', 'opened', 'clicked']
const TZ = 'America/Sao_Paulo'

// Brasil sem horário de verão desde 2019 — São Paulo é UTC-3 ano todo.
// Convertemos a meia-noite local em São Paulo para ISO UTC.
function startOfDayISO(dateStr) {
  return new Date(`${dateStr}T00:00:00-03:00`).toISOString()
}

function endOfDayISO(dateStr) {
  return new Date(`${dateStr}T23:59:59.999-03:00`).toISOString()
}

function spDateKey(iso) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ })
}

function isoWeekKey(dateStr) {
  // dateStr "YYYY-MM-DD" -> "YYYY-Www" (ISO 8601 week)
  const d = new Date(dateStr + 'T00:00:00Z')
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNr = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNr + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(((target - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function diffDays(start, end) {
  const s = new Date(start + 'T00:00:00Z')
  const e = new Date(end + 'T00:00:00Z')
  return Math.round((e - s) / 86400000) + 1
}

export function useMetrics(startDate, endDate, templateId) {
  const [metrics, setMetrics] = useState({ totals: {}, byDate: [], byTemplate: [], events: [], granularity: 'day', unsubscribedCount: 0, spamCount: 0 })
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!startDate || !endDate) return
    setLoading(true)

    const startUTC = startOfDayISO(startDate)
    const endUTC = endOfDayISO(endDate)

    let query = supabase
      .from('email_events')
      .select('*, email_templates(name)')
      .gte('event_date', startUTC)
      .lte('event_date', endUTC)
      .order('event_date', { ascending: false })
      .limit(5000)

    if (templateId) query = query.eq('template_id', templateId)

    let unsubQ = supabase
      .from('email_unsubscribed')
      .select('email,source', { count: 'exact' })
      .gte('unsubscribed_at', startUTC)
      .lte('unsubscribed_at', endUTC)

    if (templateId) unsubQ = unsubQ.eq('related_template_id', templateId)

    let spamQ = supabase
      .from('email_unsubscribed')
      .select('email', { count: 'exact', head: true })
      .eq('source', 'spam_complaint')
      .gte('unsubscribed_at', startUTC)
      .lte('unsubscribed_at', endUTC)

    if (templateId) spamQ = spamQ.eq('related_template_id', templateId)

    const [{ data }, { count: unsubscribedCount }, { count: spamCount }] = await Promise.all([
      query,
      unsubQ,
      spamQ
    ])

    const events = Array.isArray(data) ? data : []

    const totals = {}
    events.forEach(e => { totals[e.event_type] = (totals[e.event_type] || 0) + 1 })

    const rangeDays = diffDays(startDate, endDate)
    const granularity = rangeDays > 60 ? 'week' : 'day'

    const bucketMap = {}
    events.forEach(e => {
      if (!e.event_date) return
      const d = spDateKey(e.event_date)
      const k = granularity === 'week' ? isoWeekKey(d) : d
      if (!bucketMap[k]) bucketMap[k] = { date: k, sent: 0, delivered: 0, opened: 0, clicked: 0 }
      if (COUNTABLE.includes(e.event_type)) bucketMap[k][e.event_type]++
    })
    const byDate = Object.values(bucketMap).sort((a, b) => (a.date > b.date ? 1 : -1))

    const tplMap = {}
    events.forEach(e => {
      const k = e.template_id || 'sem_template'
      const displayName = e.email_templates?.name || (e.template_id ? 'Template removido' : 'Sem template')
      if (!tplMap[k]) tplMap[k] = { id: k, name: displayName, sent: 0, delivered: 0, opened: 0, clicked: 0 }
      if (COUNTABLE.includes(e.event_type)) tplMap[k][e.event_type]++
    })
    const byTemplate = Object.values(tplMap).sort((a, b) => b.sent - a.sent)

    setMetrics({
      totals,
      byDate,
      byTemplate,
      events,
      granularity,
      unsubscribedCount: unsubscribedCount || 0,
      spamCount: spamCount || 0
    })
    setLoading(false)
  }, [startDate, endDate, templateId])

  useEffect(() => { load() }, [load])

  return { metrics, loading, reload: load }
}
