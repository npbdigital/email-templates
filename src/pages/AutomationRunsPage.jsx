import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fetchAutomation } from '../hooks/useAutomations'

const STATUS_STYLES = {
  running:   { label: 'Em execução', bg: '#f0f9ff', fg: '#0369a1' },
  completed: { label: 'Concluída',   bg: '#ecfdf5', fg: '#047857' },
  failed:    { label: 'Falhou',      bg: '#fef2f2', fg: '#b91c1c' },
  cancelled: { label: 'Cancelada',   bg: '#f1f5f9', fg: '#475569' }
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  })
}

function fmtDuration(start, end) {
  if (!start || !end) return '—'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  if (ms < 3600000) return `${Math.round(ms / 60000)}min`
  return `${Math.round(ms / 3600000)}h`
}

export default function AutomationRunsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [automation, setAutomation] = useState(null)
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      fetchAutomation(id),
      supabase.from('automation_runs')
        .select('*')
        .eq('automation_id', id)
        .order('started_at', { ascending: false })
        .limit(200)
    ]).then(([a, runsRes]) => {
      if (cancelled) return
      setAutomation(a)
      setRuns(runsRes.data || [])
      setLoading(false)
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Carregando...</div>
  }

  if (!automation) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        Automação não encontrada.{' '}
        <button onClick={() => navigate('/automations')} style={{ background: 'none', border: 'none', color: '#0f766e', cursor: 'pointer', fontWeight: 600 }}>
          Voltar
        </button>
      </div>
    )
  }

  const n8nLink = automation.n8n_workflow_id
    ? `${import.meta.env.VITE_N8N_BASE_URL}/workflow/${automation.n8n_workflow_id}`
    : null

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/automations')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4, display: 'inline-flex' }}
            title="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{automation.name} · Histórico</h1>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{runs.length} execuçã{runs.length === 1 ? 'o' : 'ões'} registrada{runs.length === 1 ? '' : 's'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate(`/automations/${id}`)}
            style={{ background: 'white', color: '#0f766e', border: '1px solid #99f6e4', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            Editar fluxo
          </button>
          {n8nLink && (
            <a
              href={n8nLink}
              target="_blank"
              rel="noreferrer"
              style={{ background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <ExternalLink size={13} />
              Ver no n8n
            </a>
          )}
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14, lineHeight: 1.5 }}>
        Cada disparo do webhook gera uma linha. <strong>"Em execução"</strong> = entrou no fluxo mas ainda não chegou em um nó <em>Fim</em>.
        Pra logar o término, adicione nós <em>Fim</em> em todas as pontas do fluxo.
      </p>

      {runs.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>Sem execuções registradas</p>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>
            Quando o webhook for disparado e o workflow gravar em <code>automation_runs</code>, aparecerá aqui.
          </p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Contato', 'Status', 'Iniciado', 'Duração', 'Passo atual'].map((h, i) => (
                  <th key={i} style={{ textAlign: 'left', padding: '10px 14px', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map(r => {
                const s = STATUS_STYLES[r.status] || STATUS_STYLES.running
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <p style={{ color: '#1e293b', fontWeight: 500 }}>{r.contact_email}</p>
                      {r.contact_name && <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{r.contact_name}</p>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: s.bg, color: s.fg, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20 }}>{s.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 12 }}>{fmtDate(r.started_at)}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 12 }}>{fmtDuration(r.started_at, r.completed_at)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <code style={{ fontSize: 11, color: '#64748b' }}>{r.current_step_id || '—'}</code>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
