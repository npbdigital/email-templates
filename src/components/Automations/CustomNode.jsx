import { Handle, Position } from 'reactflow'
import { NODE_TYPES } from './nodeTypes'

function summary(node, templates) {
  if (node.type === 'trigger') return node.data?.event_name ? `evento: ${node.data.event_name}` : 'sem evento'
  if (node.type === 'send_email') {
    if (!node.data?.template_id) return 'template não escolhido'
    const t = templates?.find(x => x.id === node.data.template_id)
    return t ? t.name : 'template removido'
  }
  if (node.type === 'wait_duration') {
    const a = node.data?.amount ?? '?'
    const u = node.data?.unit || ''
    const labels = { minutes: 'min', hours: 'h', days: 'd' }
    return `aguarda ${a} ${labels[u] || u}`
  }
  if (node.type === 'wait_until_time') {
    return `às ${node.data?.time || '--:--'}`
  }
  if (node.type === 'condition_opened') return 'verifica abertura'
  if (node.type === 'condition_clicked') return 'verifica clique'
  if (node.type === 'condition_time') {
    const op = node.data?.operator || '?'
    const t1 = node.data?.time1 || '--:--'
    const t2 = node.data?.time2 || '--:--'
    if (op === 'between') return `entre ${t1} e ${t2}`
    if (op === 'before') return `antes de ${t1}`
    if (op === 'after') return `depois de ${t1}`
    return op
  }
  if (node.type === 'webhook_out') {
    const url = node.data?.url || ''
    return url ? `${node.data?.method || 'POST'} ${url.slice(0, 30)}...` : 'sem URL'
  }
  if (node.type === 'end') return 'fluxo termina aqui'
  return ''
}

export function makeCustomNode(templates) {
  return function CustomNode({ data, type, selected }) {
    const meta = NODE_TYPES[type] || NODE_TYPES.end
    const Icon = meta.Icon
    const sum = summary({ type, data }, templates)
    const isBranching = !!meta.branching

    return (
      <div style={{
        background: 'white',
        borderRadius: 10,
        borderLeft: `4px solid ${meta.color}`,
        boxShadow: selected
          ? `0 0 0 2px ${meta.color}, 0 4px 12px rgba(15,23,42,0.10)`
          : '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        padding: '10px 14px',
        minWidth: 220,
        maxWidth: 280,
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        position: 'relative'
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

        {type === 'end' ? null : isBranching ? (
          <>
            <Handle
              type="source"
              position={Position.Bottom}
              id="true"
              style={{ background: '#10b981', width: 9, height: 9, border: '2px solid white', left: '30%' }}
            />
            <Handle
              type="source"
              position={Position.Bottom}
              id="false"
              style={{ background: '#ef4444', width: 9, height: 9, border: '2px solid white', left: '70%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '0 4px', fontSize: 9, fontWeight: 600 }}>
              <span style={{ color: '#10b981' }}>Sim</span>
              <span style={{ color: '#ef4444' }}>Não</span>
            </div>
          </>
        ) : (
          <Handle type="source" position={Position.Bottom} style={{ background: meta.color, width: 8, height: 8, border: 'none' }} />
        )}
      </div>
    )
  }
}
