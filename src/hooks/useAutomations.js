import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const EMPTY_FLOW = { nodes: [], edges: [] }

export function useAutomations() {
  const [automations, setAutomations] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('automations')
      .select('id, name, description, trigger_event, status, n8n_workflow_id, n8n_webhook_url, updated_at, created_at')
      .order('updated_at', { ascending: false })
    setAutomations(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const createAutomation = async ({ name, trigger_event, description }) => {
    const payload = {
      name: name?.trim() || 'Nova automação',
      trigger_event: trigger_event?.trim() || `evento_${Date.now()}`,
      description: description?.trim() || null,
      status: 'draft',
      flow_data: EMPTY_FLOW
    }
    const { data, error } = await supabase
      .from('automations')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    await load()
    return data
  }

  const deleteAutomation = async (id) => {
    const { error } = await supabase.from('automations').delete().eq('id', id)
    if (error) throw error
    await load()
  }

  return { automations, loading, reload: load, createAutomation, deleteAutomation }
}

export async function fetchAutomation(id) {
  const { data, error } = await supabase
    .from('automations')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function updateAutomation(id, patch) {
  const { data, error } = await supabase
    .from('automations')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
