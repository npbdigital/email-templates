import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TemplateList from '../components/Templates/TemplateList'
import { useFolders } from '../hooks/useFolders'
import { useTemplates } from '../hooks/useTemplates'

export default function TemplatesPage() {
  const navigate = useNavigate()
  const [activeFolder, setActiveFolder] = useState(null)
  const { folders, addFolder, deleteFolder } = useFolders()
  const { templates, deleteTemplate } = useTemplates(activeFolder)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Templates</h1>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Crie e organize seus e-mails reutilizáveis</p>
        </div>
        <button
          onClick={() => navigate('/templates/new')}
          style={{ background: '#0f766e', color: 'white', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          + Novo template
        </button>
      </div>

      <TemplateList
        folders={folders}
        templates={templates}
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
        onAddFolder={addFolder}
        onDeleteFolder={deleteFolder}
        onOpenTemplate={(t) => navigate(`/templates/${t.id}`)}
        onCreateTemplate={() => navigate('/templates/new')}
        onDeleteTemplate={deleteTemplate}
      />
    </>
  )
}
