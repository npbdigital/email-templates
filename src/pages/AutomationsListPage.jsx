import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Workflow, Trash2 } from 'lucide-react'
import { useAutomations } from '../hooks/useAutomations'
import StatusBadge from '../components/Automations/StatusBadge'
import NewAutomationModal from '../components/Automations/NewAutomationModal'

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AutomationsListPage() {
  const navigate = useNavigate()
  const { automations, loading, createAutomation, deleteAutomation } = useAutomations()
  const [showNew, setShowNew] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const handleCreate = async ({ name, trigger_event }) => {
    const created = await createAutomation({ name, trigger_event })
    setShowNew(false)
    if (created?.id) navigate(`/automations/${created.id}`)
  }

  const handleDelete = async (id) => {
    if (!confirm('Apagar esta automação? Esta ação não pode ser desfeita.')) return
    setBusyId(id)
    try {
      await deleteAutomation(id)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Automações</h1>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Construa fluxos visuais que disparam e-mails automaticamente</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          style={{ background: '#0f766e', color: 'white', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          + Nova automação
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 13 }}>Carregando automações...</div>
      ) : automations.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: 14, borderRadius: '50%', background: '#f0fdfa', color: '#0f766e', marginBottom: 12 }}>
            <Workflow size={28} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>Nenhuma automação ainda</p>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>Crie a primeira para começar a disparar e-mails automaticamente.</p>
          <button
            onClick={() => setShowNew(true)}
            style={{ background: '#0f766e', color: 'white', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            + Criar automação
          </button>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Nome', 'Gatilho', 'Status', 'Última edição', ''].map((h, i) => (
                  <th key={i} style={{ textAlign: 'left', padding: '10px 14px', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {automations.map(a => (
                <tr
                  key={a.id}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.1s' }}
                  onClick={() => navigate(`/automations/${a.id}`)}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 14px', color: '#1e293b', fontWeight: 600 }}>{a.name}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <code style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>
                      {a.trigger_event}
                    </code>
                  </td>
                  <td style={{ padding: '12px 14px' }}><StatusBadge status={a.status} /></td>
                  <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>{fmtDate(a.updated_at)}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(a.id) }}
                      disabled={busyId === a.id}
                      title="Apagar"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, display: 'inline-flex' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <NewAutomationModal
          onClose={() => setShowNew(false)}
          onCreate={handleCreate}
        />
      )}
    </>
  )
}
