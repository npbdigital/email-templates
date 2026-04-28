import { Trash2 } from 'lucide-react'
import { NODE_TYPES } from './nodeTypes'

const inp = { width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', background: 'white' }
const lbl = { fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }

export default function NodeForm({ node, templates, onChange, onDelete }) {
  if (!node) return null
  const meta = NODE_TYPES[node.type] || {}
  const Icon = meta.Icon
  const data = node.data || {}

  const setData = (patch) => onChange(node.id, { ...data, ...patch })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        {Icon && (
          <span style={{ display: 'inline-flex', padding: 6, borderRadius: 7, background: meta.bg, color: meta.color }}>
            <Icon size={16} />
          </span>
        )}
        <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{meta.label}</p>
      </div>

      {node.type === 'trigger' && (
        <>
          <label style={lbl}>Nome do evento (gatilho)</label>
          <input
            value={data.event_name || ''}
            onChange={(e) => setData({ event_name: e.target.value })}
            placeholder="webnario_confirmado"
            style={inp}
          />
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, lineHeight: 1.5 }}>
            Identifica o gatilho. Use minúsculas, números e underline.
          </p>
        </>
      )}

      {node.type === 'send_email' && (
        <>
          <label style={lbl}>Template</label>
          <select
            value={data.template_id || ''}
            onChange={(e) => setData({ template_id: e.target.value })}
            style={{ ...inp, cursor: 'pointer' }}
          >
            <option value="">Escolha um template</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {!data.template_id && (
            <p style={{ fontSize: 11, color: '#dc2626', marginTop: 6 }}>
              Sem template, esse nó não pode ser publicado.
            </p>
          )}
        </>
      )}

      {node.type === 'end' && (
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
          Esse nó encerra o fluxo para o contato. Sem configuração necessária.
        </p>
      )}

      {node.type !== 'trigger' && (
        <button
          onClick={() => onDelete(node.id)}
          style={{
            marginTop: 24,
            width: '100%',
            background: 'white',
            color: '#dc2626',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          <Trash2 size={14} />
          Remover nó
        </button>
      )}
    </div>
  )
}
