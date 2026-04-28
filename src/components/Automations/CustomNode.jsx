import { Handle, Position } from 'reactflow'
import { NODE_TYPES } from './nodeTypes'

function summary(node, templates) {
  if (node.type === 'trigger') return node.data?.event_name ? `evento: ${node.data.event_name}` : 'sem evento'
  if (node.type === 'send_email') {
    if (!node.data?.template_id) return 'template não escolhido'
    const t = templates?.find(x => x.id === node.data.template_id)
    return t ? t.name : 'template removido'
  }
  if (node.type === 'end') return 'fluxo termina aqui'
  return ''
}

export function makeCustomNode(templates) {
  return function CustomNode({ data, type, selected }) {
    const meta = NODE_TYPES[type] || NODE_TYPES.end
    const Icon = meta.Icon
    const sum = summary({ type, data }, templates)

    return (
      <div style={{
        background: 'white',
        borderRadius: 10,
        borderLeft: `4px solid ${meta.color}`,
        boxShadow: selected
          ? `0 0 0 2px ${meta.color}, 0 4px 12px rgba(15,23,42,0.10)`
          : '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        padding: '10px 14px',
        minWidth: 200,
        maxWidth: 260,
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        {type !== 'trigger' && (
          <Handle type="target" position={Position.Top} style={{ background: meta.color, width: 8, height: 8, border: 'none' }} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', padding: 5, borderRadius: 6, background: meta.bg, color: meta.color }}>
            <Icon size={14} />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>{meta.label}</p>
            <p style={{ fontSize: 11, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sum}</p>
          </div>
        </div>

        {type !== 'end' && (
          <Handle type="source" position={Position.Bottom} style={{ background: meta.color, width: 8, height: 8, border: 'none' }} />
        )}
      </div>
    )
  }
}
