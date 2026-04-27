import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useFolders() {
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('email_folders')
      .select('*')
      .order('created_at', { ascending: true })
    setFolders(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const addFolder = async (name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    await supabase.from('email_folders').insert({ name: trimmed })
    await load()
  }

  const deleteFolder = async (id) => {
    await supabase.from('email_folders').delete().eq('id', id)
    await load()
  }

  return { folders, loading, reload: load, addFolder, deleteFolder }
}
