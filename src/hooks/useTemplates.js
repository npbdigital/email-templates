import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTemplates(activeFolder) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('email_templates')
      .select('*, email_folders(name)')
      .order('created_at', { ascending: true })
    if (activeFolder) query = query.eq('folder_id', activeFolder)
    const { data } = await query
    setTemplates(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [activeFolder])

  useEffect(() => { load() }, [load])

  const saveTemplate = async ({ id, name, subject, body_html, folder_id }) => {
    const payload = { name, subject, body_html, folder_id: folder_id || null }
    if (id) {
      await supabase.from('email_templates').update(payload).eq('id', id)
    } else {
      await supabase.from('email_templates').insert(payload)
    }
    await load()
  }

  const deleteTemplate = async (id) => {
    await supabase.from('email_templates').delete().eq('id', id)
    await load()
  }

  return { templates, loading, reload: load, saveTemplate, deleteTemplate }
}
