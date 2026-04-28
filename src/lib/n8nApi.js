import { generateN8nWorkflow } from './n8nGenerator'

const N8N_BASE = (import.meta.env.VITE_N8N_BASE_URL || '').replace(/\/+$/, '')
const N8N_KEY = import.meta.env.VITE_N8N_API_KEY || ''

function ensureConfig() {
  if (!N8N_BASE) throw new Error('VITE_N8N_BASE_URL não configurado.')
  if (!N8N_KEY) throw new Error('VITE_N8N_API_KEY não configurado.')
}

async function n8nFetch(path, options = {}) {
  ensureConfig()
  const url = `${N8N_BASE}/api/v1${path}`
  let res
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        'X-N8N-API-KEY': N8N_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers || {})
      }
    })
  } catch (e) {
    throw new Error('Falha de rede ao chamar n8n. Provável CORS — adicione o domínio do app em N8N_CORS_ALLOW_ORIGIN nas vars do n8n. Detalhe: ' + (e?.message || ''))
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`n8n ${res.status}: ${text || res.statusText}`)
  }
  if (res.status === 204) return null
  return res.json()
}

function webhookUrlFor(automation) {
  return `${N8N_BASE}/webhook/automation-${automation.id}`
}

export async function publishAutomation(automation, templates) {
  const workflow = generateN8nWorkflow(automation, templates)

  let workflowId = automation.n8n_workflow_id
  if (workflowId) {
    try {
      await n8nFetch(`/workflows/${workflowId}`, {
        method: 'PUT',
        body: JSON.stringify(workflow)
      })
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
    const created = await n8nFetch('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow)
    })
    workflowId = created?.id
    if (!workflowId) throw new Error('n8n não retornou um workflow id.')
  }

  try {
    await n8nFetch(`/workflows/${workflowId}/activate`, { method: 'POST' })
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
    await n8nFetch(`/workflows/${automation.n8n_workflow_id}/deactivate`, { method: 'POST' })
  } catch (e) {
    const msg = (e?.message || '').toLowerCase()
    if (msg.includes('404') || msg.includes('not found')) return
    throw e
  }
}

export async function deleteN8nWorkflow(automation) {
  if (!automation.n8n_workflow_id) return
  try {
    await n8nFetch(`/workflows/${automation.n8n_workflow_id}`, { method: 'DELETE' })
  } catch (e) {
    const msg = (e?.message || '').toLowerCase()
    if (msg.includes('404') || msg.includes('not found')) return
    throw e
  }
}
