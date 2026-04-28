import { supabase } from './supabase'
import { generateN8nWorkflow } from './n8nGenerator'

const N8N_BASE = (import.meta.env.VITE_N8N_BASE_URL || '').replace(/\/+$/, '')

async function n8nProxy(method, path, body) {
  const { data, error } = await supabase.functions.invoke('n8n-proxy', {
    body: { method, path, body }
  })
  if (error) {
    const detail = error?.message || error?.context?.error || ''
    throw new Error(`n8n-proxy: ${detail || 'falha'}`)
  }
  if (data && data.error) {
    const detail = data.detail ? ` (${data.detail})` : ''
    throw new Error(`n8n: ${data.error}${detail}`)
  }
  return data
}

function webhookUrlFor(automation) {
  if (!N8N_BASE) return null
  return `${N8N_BASE}/webhook/automation-${automation.id}`
}

export async function publishAutomation(automation, templates) {
  const workflow = generateN8nWorkflow(automation, templates)

  let workflowId = automation.n8n_workflow_id
  if (workflowId) {
    try {
      await n8nProxy('PUT', `/api/v1/workflows/${workflowId}`, workflow)
    } catch (e) {
      const msg = (e?.message || '').toLowerCase()
      if (msg.includes('404') || msg.includes('not found')) {
        workflowId = null
      } else {
        throw e
      }
    }
  }

  if (!workflowId) {
    const created = await n8nProxy('POST', '/api/v1/workflows', workflow)
    workflowId = created?.id
    if (!workflowId) throw new Error('n8n não retornou um workflow id.')
  }

  try {
    await n8nProxy('POST', `/api/v1/workflows/${workflowId}/activate`, null)
  } catch (e) {
    const msg = (e?.message || '').toLowerCase()
    if (!msg.includes('already')) throw e
  }

  return {
    n8n_workflow_id: workflowId,
    n8n_webhook_url: webhookUrlFor(automation)
  }
}

export async function unpublishAutomation(automation) {
  if (!automation.n8n_workflow_id) return
  try {
    await n8nProxy('POST', `/api/v1/workflows/${automation.n8n_workflow_id}/deactivate`, null)
  } catch (e) {
    const msg = (e?.message || '').toLowerCase()
    if (msg.includes('404') || msg.includes('not found')) return
    throw e
  }
}

export async function deleteN8nWorkflow(automation) {
  if (!automation.n8n_workflow_id) return
  try {
    await n8nProxy('DELETE', `/api/v1/workflows/${automation.n8n_workflow_id}`, null)
  } catch (e) {
    const msg = (e?.message || '').toLowerCase()
    if (msg.includes('404') || msg.includes('not found')) return
    throw e
  }
}
