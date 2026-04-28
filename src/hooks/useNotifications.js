import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useNotifications({ typeFilter = '', statusFilter = 'all', limit = null } = {}) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('notifications')
      .select('*, email_templates(name)')
      .order('created_at', { ascending: false })

    if (typeFilter) q = q.eq('type', typeFilter)
    if (statusFilter === 'active') q = q.eq('dismissed', false)
    if (statusFilter === 'unread') q = q.eq('read', false).eq('dismissed', false)
    if (statusFilter === 'dismissed') q = q.eq('dismissed', true)
    if (limit) q = q.limit(limit)

    const { data } = await q
    setNotifications(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [typeFilter, statusFilter, limit])

  useEffect(() => { load() }, [load])

  const dismiss = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    await supabase.from('notifications').update({ dismissed: true }).eq('id', id)
  }

  const markRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }

  const dismissAll = async (ids) => {
    if (!ids?.length) return
    setNotifications(prev => prev.filter(n => !ids.includes(n.id)))
    await supabase.from('notifications').update({ dismissed: true }).in('id', ids)
  }

  return { notifications, loading, reload: load, dismiss, markRead, dismissAll }
}

export function useNotificationCount({ pollMs = 30000 } = {}) {
  const [count, setCount] = useState(0)

  const load = useCallback(async () => {
    const { count: c } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('dismissed', false)
    setCount(c || 0)
  }, [])

  useEffect(() => {
    load()
    if (!pollMs) return
    const t = setInterval(load, pollMs)
    return () => clearInterval(t)
  }, [load, pollMs])

  return { count, reload: load }
}
