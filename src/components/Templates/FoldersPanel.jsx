import { useState } from 'react'

export default function FoldersPanel({ folders, activeFolder, setActiveFolder, onAddFolder, onDeleteFolder }) {
  const [newFolderName, setNewFolderName] = useState('')
  const [showFolderInput, setShowFolderInput] = useState(false)
  const [hoveredId, setHoveredId] = useState(null)

  const submitFolder = async () => {
    if (!newFolderName.trim()) return
    await onAddFolder(newFolderName)
    setNewFolderName('')
    setShowFolderInput(false)
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Apagar esta pasta?')) return
    await onDeleteFolder(id)
    if (activeFolder === id) setActiveFolder(null)
  }

  return (
    <div style={{ width: 200, flexShrink: 0, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 8 }}>
      <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 10px 4px' }}>Filtrar</p>
      <button
        onClick={() => setActiveFolder(null)}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          padding: '7px 10px',
          borderRadius: 7,
          fontSize: 13,
          border: 'none',
          cursor: 'pointer',
          background: activeFolder === null ? '#f0fdfa' : 'transparent',
          color: activeFolder === null ? '#0f766e' : '#475569',
          fontWeight: activeFolder === null ? 600 : 400
        }}
      >
        Todos
      </button>

      {folders.length > 0 && (
        <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 10px 4px' }}>Pastas</p>
      )}

      {folders.map(f => (
        <div
          key={f.id}
          style={{ display: 'flex', alignItems: 'center' }}
          onMouseEnter={() => setHoveredId(f.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <button
            onClick={() => setActiveFolder(f.id)}
            style={{
              flex: 1,
              textAlign: 'left',
              padding: '7px 10px',
              borderRadius: 7,
              fontSize: 13,
              border: 'none',
              cursor: 'pointer',
              background: activeFolder === f.id ? '#f0fdfa' : 'transparent',
              color: activeFolder === f.id ? '#0f766e' : '#475569',
              fontWeight: activeFolder === f.id ? 600 : 400
            }}
          >
            {f.name}
          </button>
          {hoveredId === f.id && (
            <button
              onClick={(e) => handleDelete(f.id, e)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', fontSize: 12, padding: '2px 5px' }}
            >
              ✕
            </button>
          )}
        </div>
      ))}

      {showFolderInput ? (
        <div style={{ padding: '4px 6px' }}>
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitFolder()
              if (e.key === 'Escape') setShowFolderInput(false)
            }}
            placeholder="Nome da pasta"
            style={{ width: '100%', border: '1px solid #99f6e4', borderRadius: 6, padding: '5px 8px', fontSize: 12, outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
            <button
              onClick={submitFolder}
              style={{ background: '#0f766e', color: 'white', border: 'none', borderRadius: 5, padding: '3px 10px', fontSize: 11, cursor: 'pointer' }}
            >
              OK
            </button>
            <button
              onClick={() => setShowFolderInput(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowFolderInput(true)}
          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', fontSize: 12, border: 'none', cursor: 'pointer', background: 'transparent', color: '#94a3b8' }}
        >
          + Nova pasta
        </button>
      )}
    </div>
  )
}
