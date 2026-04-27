import { useState } from 'react'

export default function TemplateCard({ template, onOpen, onDelete, onCopyId, copiedId }) {
  const [hovered, setHovered] = useState(false)

  const handleDelete = (e) => {
    e.stopPropagation()
    if (!confirm('Apagar este template?')) return
    onDelete(template.id)
  }

  const handleCopy = (e) => {
    e.stopPropagation()
    onCopyId(template.id)
  }

  return (
    <div
      onClick={() => onOpen(template)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'white',
        border: `1px solid ${hovered ? '#99f6e4' : '#e2e8f0'}`,
        borderRadius: 12,
        padding: '14px 18px',
        cursor: 'pointer',
        transition: 'border-color 0.15s'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{template.name}</span>
            {template.email_folders?.name && (
              <span style={{ fontSize: 11, background: '#f0fdfa', color: '#0f766e', padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>
                {template.email_folders.name}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{template.subject}</p>
        </div>
        {hovered && (
          <button
            onClick={handleDelete}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', marginLeft: 10, fontSize: 13 }}
          >
            ✕
          </button>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
        <code style={{ fontSize: 11, color: '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {template.id}
        </code>
        <button
          onClick={handleCopy}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f766e', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          {copiedId === template.id ? '✓ Copiado!' : 'Copiar ID'}
        </button>
      </div>
    </div>
  )
}
