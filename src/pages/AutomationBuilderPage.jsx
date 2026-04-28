import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, ExternalLink } from 'lucide-react'
import StatusBadge from '../components/Automations/StatusBadge'
import AutomationCanvas from '../components/Automations/AutomationCanvas'
import { fetchAutomation, updateAutomation } from '../hooks/useAutomations'
import { useTemplates } from '../hooks/useTemplates'
import { publishAutomation, unpublishAutomation } from '../lib/n8nApi'
import { validateFlowForPublish } from '../lib/n8nGenerator'

const TRIGGER_NODE_DEFAULT_POS = { x: 240, y: 80 }

function ensureTriggerNode(flowData, automation) {
  const nodes = Array.isArray(flowData?.nodes) ? [...flowData.nodes] : []
  const edges = Array.isArray(flowData?.edges) ? [...flowData.edges] : []
  const hasTrigger = nodes.some(n => n.type === 'trigger')
  if (!hasTrigger) {
    nodes.unshift({
      id: 'trigger',
      type: 'trigger',
      position: TRIGGER_NODE_DEFAULT_POS,
      data: { event_name: automation?.trigger_event || '' }
    })
  }
  return { nodes, edges }
}

export default function AutomationBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [automation, setAutomation] = useState(null)
  const [name, setName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [err, setErr] = useState('')
  const [copiedField, setCopiedField] = useState('')

  const flowDraftRef = useRef(null)
  const { templates } = useTemplates(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setErr('')
    fetchAutomation(id)
      .then(a => {
        if (cancelled) return
        const seeded = { ...a, flow_data: ensureTriggerNode(a.flow_data, a) }
        setAutomation(seeded)
        setName(seeded.name)
        flowDraftRef.current = seeded.flow_data
      })
      .catch(e => { if (!cancelled) setErr(e?.message || 'Falha ao carregar.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const initialFlow = useMemo(() => automation?.flow_data, [automation])

  const persistName = async () => {
    setEditingName(false)
    if (!automation || !name.trim() || name.trim() === automation.name) return
    try {
      setSaving(true)
      const next = await updateAutomation(automation.id, { name: name.trim() })
      setAutomation(prev => ({ ...prev, ...next }))
      setSavedAt(Date.now())
    } catch (e) {
      setErr(e?.message || 'Falha ao salvar nome.')
      setName(automation.name)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!automation) return
    setErr('')
    setSaving(true)
    try {
      const flow_data = flowDraftRef.current || automation.flow_data
      const next = await updateAutomation(automation.id, {
        name: name.trim() || automation.name,
        flow_data
      })
      setAutomation(prev => ({ ...prev, ...next, flow_data: ensureTriggerNode(next.flow_data, next) }))
      setSavedAt(Date.now())
    } catch (e) {
      setErr(e?.message || 'Falha ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!automation) return
    setErr('')
    const flow = flowDraftRef.current || automation.flow_data
    const issues = validateFlowForPublish(flow, templates)
    if (issues.length > 0) {
      setErr('Não dá pra publicar: ' + issues.join(' • '))
      return
    }

    setPublishing(true)
    try {
      const saved = await updateAutomation(automation.id, {
        name: name.trim() || automation.name,
        flow_data: flow
      })
      const updated = await publishAutomation({ ...saved, flow_data: flow }, templates)
      const final = await updateAutomation(automation.id, {
        n8n_workflow_id: updated.n8n_workflow_id,
        n8n_webhook_url: updated.n8n_webhook_url,
        status: 'active'
      })
      setAutomation(prev => ({ ...prev, ...final, flow_data: ensureTriggerNode(final.flow_data, final) }))
      setSavedAt(Date.now())
    } catch (e) {
      setErr(e?.message || 'Falha ao publicar.')
    } finally {
      setPublishing(false)
    }
  }

  const handlePause = async () => {
    if (!automation || !automation.n8n_workflow_id) return
    setErr('')
    setPublishing(true)
    try {
      await unpublishAutomation(automation)
      const final = await updateAutomation(automation.id, { status: 'paused' })
      setAutomation(prev => ({ ...prev, ...final, flow_data: ensureTriggerNode(final.flow_data, final) }))
    } catch (e) {
      setErr(e?.message || 'Falha ao pausar.')
    } finally {
      setPublishing(false)
    }
  }

  const copyToClipboard = (text, field) => {
    navigator.clipboard?.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(''), 1500)
  }

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Carregando automação...</div>
  }

  if (!automation) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        {err || 'Automação não encontrada.'}{' '}
        <button onClick={() => navigate('/automations')} style={{ background: 'none', border: 'none', color: '#0f766e', cursor: 'pointer', fontWeight: 600 }}>
          Voltar
        </button>
      </div>
    )
  }

  const isPublished = automation.status === 'active' && !!automation.n8n_workflow_id
  const isPaused = automation.status === 'paused'
  const savedNote = savedAt ? `Salvo às ${new Date(savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : null

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
          <button
            onClick={() => navigate('/automations')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4, display: 'inline-flex' }}
            title="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          {editingName ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={persistName}
              onKeyDown={(e) => { if (e.key === 'Enter') persistName(); if (e.key === 'Escape') { setName(automation.name); setEditingName(false) } }}
              style={{
                fontSize: 18, fontWeight: 700, color: '#1e293b',
                border: '1px solid #99f6e4', borderRadius: 6, padding: '4px 8px', outline: 'none', minWidth: 240
              }}
            />
          ) : (
            <h1
              onClick={() => setEditingName(true)}
              title="Clique para renomear"
              style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', cursor: 'text', padding: '4px 8px', borderRadius: 6 }}
            >
              {name || automation.name}
            </h1>
          )}
          <StatusBadge status={automation.status} />
          {savedNote && <span style={{ fontSize: 11, color: '#94a3b8' }}>{savedNote}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleSave}
            disabled={saving || publishing}
            style={{
              background: 'white', color: '#0f766e', border: '1px solid #99f6e4',
              borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500,
              cursor: (saving || publishing) ? 'default' : 'pointer'
            }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          {isPublished ? (
            <button
              onClick={handlePause}
              disabled={publishing}
              style={{
                background: '#f59e0b', color: 'white',
                border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500,
                cursor: publishing ? 'default' : 'pointer'
              }}
            >
              {publishing ? '...' : 'Pausar'}
            </button>
          ) : null}
          <button
            onClick={handlePublish}
            disabled={publishing || saving}
            style={{
              background: publishing ? '#94a3b8' : '#0f766e', color: 'white',
              border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500,
              cursor: publishing ? 'default' : 'pointer'
            }}
          >
            {publishing ? 'Publicando...' : (isPublished ? 'Republicar' : (isPaused ? 'Reativar' : 'Publicar'))}
          </button>
        </div>
      </div>

      {err && (
        <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>
          {err}
        </div>
      )}

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', marginBottom: 14, fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span>
          Gatilho:{' '}
          <code style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>
            {automation.trigger_event}
          </code>
        </span>
        {automation.n8n_webhook_url && (
          <>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              Webhook:{' '}
              <code style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 6, fontSize: 11, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', verticalAlign: 'middle' }}>
                {automation.n8n_webhook_url}
              </code>
              <button
                onClick={() => copyToClipboard(automation.n8n_webhook_url, 'url')}
                title="Copiar URL"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f766e', padding: 2, display: 'inline-flex' }}
              >
                <Copy size={13} />
              </button>
              {copiedField === 'url' && <span style={{ color: '#0f766e', fontWeight: 600 }}>copiado!</span>}
              <a
                href={`${import.meta.env.VITE_N8N_BASE_URL}/workflow/${automation.n8n_workflow_id}`}
                target="_blank"
                rel="noreferrer"
                title="Abrir no n8n"
                style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center' }}
              >
                <ExternalLink size={13} />
              </a>
            </span>
          </>
        )}
      </div>

      <AutomationCanvas
        flowData={initialFlow}
        templates={templates}
        automation={automation}
        onChange={(next) => { flowDraftRef.current = next }}
      />
    </>
  )
}
