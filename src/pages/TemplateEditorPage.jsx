import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TemplateEditor from '../components/Templates/TemplateEditor'
import { useFolders } from '../hooks/useFolders'
import { useTemplates } from '../hooks/useTemplates'

export default function TemplateEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const { folders } = useFolders()
  const { templates, saveTemplate } = useTemplates(null)

  const [editing, setEditing] = useState(null)
  const [resolved, setResolved] = useState(isNew)

  useEffect(() => {
    if (isNew) { setEditing(null); setResolved(true); return }
    if (!templates || templates.length === 0) return
    const found = templates.find(t => t.id === id) || null
    setEditing(found)
    setResolved(true)
  }, [id, isNew, templates])

  const handleSave = async (payload) => {
    await saveTemplate(payload)
    navigate('/templates')
  }

  if (!resolved) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Carregando template...</div>
  }

  if (!isNew && !editing) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        Template não encontrado.{' '}
        <button onClick={() => navigate('/templates')} style={{ background: 'none', border: 'none', color: '#0f766e', cursor: 'pointer', fontWeight: 600 }}>
          Voltar
        </button>
      </div>
    )
  }

  return (
    <TemplateEditor
      editing={editing}
      folders={folders}
      onSave={handleSave}
      onCancel={() => navigate('/templates')}
    />
  )
}
