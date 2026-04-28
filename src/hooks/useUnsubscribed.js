import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useUnsubscribed({ sourceFilter = '', search = '', startDate = null, endDate = null } = {}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('email_unsubscribed')
      .select('*, email_templates(name)')
      .order('unsubscribed_at', { ascending: false })
      .limit(2000)

    if (sourceFilter) q = q.eq('source', sourceFilter)
    if (search) q = q.ilike('email', `%${search}%`)
    if (startDate) q = q.gte('unsubscribed_at', new Date(`${startDate}T00:00:00-03:00`).toISOString())
    if (endDate) q = q.lte('unsubscribed_at', new Date(`${endDate}T23:59:59.999-03:00`).toISOString())

    const { data } = await q
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [sourceFilter, search, startDate, endDate])

  useEffect(() => { load() }, [load])

  const addManual = async ({ email, reason, contact_name }) => {
    const lowered = email.trim().toLowerCase()
    if (!lowered) throw new Error('E-mail obrigatório.')
    const { error } = await supabase
      .from('email_unsubscribed')
      .upsert(
        {
          email: lowered,
          source: 'manual',
          reason: reason?.trim() || null,
          contact_name: contact_name?.trim() || null
        },
        { onConflict: 'email', ignoreDuplicates: false }
      )
    if (error) throw error
    await load()
  }

  const reactivate = async (email) => {
    const { error } = await supabase
      .from('email_unsubscribed')
      .delete()
      .eq('email', email)
    if (error) throw error
    await load()
  }

  return { items, loading, reload: load, addManual, reactivate }
}

const SOURCE_LABELS = {
  link_email: 'Link no e-mail',
  manual: 'Manual',
  hard_bounce: 'Hard bounce',
  spam_complaint: 'Reclamação de spam',
  soft_bounce_repeated: 'Soft bounce repetido'
}

export function sourceLabel(source) {
  return SOURCE_LABELS[source] || source
}

export function exportUnsubscribedCsv(items) {
  const header = ['email', 'contact_name', 'source', 'reason', 'unsubscribed_at']
  const rows = items.map(i => header.map(h => csvField(i[h])))
  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `descadastros_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function csvField(v) {
  if (v == null) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}
