import { useState } from 'react'
import FoldersPanel from './FoldersPanel'
import TemplateCard from './TemplateCard'

export default function TemplateList({
  folders,
  templates,
  activeFolder,
  setActiveFolder,
  onAddFolder,
  onDeleteFolder,
  onOpenTemplate,
  onCreateTemplate,
  onDeleteTemplate
}) {
  const [copiedId, setCopiedId] = useState(null)

  const copyId = (id) => {
    navigator.clipboard?.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  const activeFolderName = folders.find(f => f.id === activeFolder)?.name

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      <FoldersPanel
        folders={folders}
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
        onAddFolder={onAddFolder}
        onDeleteFolder={onDeleteFolder}
      />

      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
          {activeFolderName ? `Pasta: ${activeFolderName}` : 'Todos os templates'} · {templates.length} template{templates.length !== 1 ? 's' : ''}
        </p>

        {templates.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>✉️</div>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>Nenhum template ainda.</p>
            <button
              onClick={onCreateTemplate}
              style={{ background: 'none', border: 'none', color: '#0f766e', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
            >
              Criar o primeiro →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {templates.map(t => (
              <TemplateCard
                key={t.id}
                template={t}
                onOpen={onOpenTemplate}
                onDelete={onDeleteTemplate}
                onCopyId={copyId}
                copiedId={copiedId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
