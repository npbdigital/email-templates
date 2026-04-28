import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Workflow } from 'lucide-react'
import StatusBadge from '../components/Automations/StatusBadge'
import { fetchAutomation, updateAutomation } from '../hooks/useAutomations'

export default function AutomationBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [automation, setAutomation] = useState(null)
  const [name, setName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setErr('')
    fetchAutomation(id)
      .then(a => {
        if (cancelled) return
        setAutomation(a)
        setName(a.name)
      })
      .catch(e => { if (!cancelled) setErr(e?.message || 'Falha ao carregar.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const persistName = async () => {
    setEditingName(false)
    if (!automation || !name.trim() || name.trim() === automation.name) return
    try {
      setSaving(true)
      const next = await updateAutomation(automation.id, { name: name.trim() })
      setAutomation(next)
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
    setSaving(true)
    try {
      const next = await updateAutomation(automation.id, {
        name: name.trim() || automation.name,
        flow_data: automation.flow_data
      })
      setAutomation(next)
      setSavedAt(Date.now())
    } catch (e) {
      setErr(e?.message || 'Falha ao salvar.')
    } finally {
      setSaving(false)
    }
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
            disabled={saving}
            style={{
              background: saving ? '#94a3b8' : '#0f766e', color: 'white',
              border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500,
              cursor: saving ? 'default' : 'pointer'
            }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            disabled
            title="Disponível na Fase 4"
            style={{
              background: 'white', color: '#94a3b8', border: '1px solid #e2e8f0',
              borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'not-allowed'
            }}
          >
            Publicar
          </button>
        </div>
      </div>

      {err && (
        <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 12 }}>
          {err}
        </div>
      )}

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', marginBottom: 16, fontSize: 12, color: '#64748b' }}>
        Gatilho:{' '}
        <code style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>
          {automation.trigger_event}
        </code>
      </div>

      <div style={{
        background: 'white',
        border: '1px dashed #cbd5e1',
        borderRadius: 12,
        minHeight: 360,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 10, color: '#94a3b8', textAlign: 'center', padding: 24
      }}>
        <Workflow size={32} />
        <p style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Canvas em construção</p>
        <p style={{ fontSize: 12, maxWidth: 360 }}>
          O construtor visual com React Flow chega na Fase 3. Aqui você arrastará nós (gatilho, e-mail, aguardar, condicionais) e os conectará para montar o fluxo.
        </p>
      </div>
    </>
  )
}
