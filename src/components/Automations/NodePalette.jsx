import { NODE_TYPES } from './nodeTypes'

const PALETTE_ORDER = ['send_email', 'end']

export default function NodePalette({ existingNodeTypes = [] }) {
  const onDragStart = (event, type) => {
    event.dataTransfer.setData('application/automation-node-type', type)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        Adicionar nó
      </p>
      <p style={{ fontSize: 12, color: '#64748b', marginBottom: 14, lineHeight: 1.5 }}>
        Arraste para o canvas para adicionar.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PALETTE_ORDER.map(type => {
          const meta = NODE_TYPES[type]
          if (!meta) return null
          const isUniqueAndExists = meta.unique && existingNodeTypes.includes(type)
          if (isUniqueAndExists) return null
          const Icon = meta.Icon

          return (
            <div
              key={type}
              draggable
              onDragStart={(e) => onDragStart(e, type)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'white',
                border: '1px solid #e2e8f0',
                borderLeft: `4px solid ${meta.color}`,
                borderRadius: 8,
                padding: '10px 12px',
                cursor: 'grab'
              }}
            >
              <span style={{ display: 'inline-flex', padding: 5, borderRadius: 6, background: meta.bg, color: meta.color }}>
                <Icon size={14} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{meta.label}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{meta.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
