import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './components/Auth/Login'
import Header from './components/Layout/Header'
import TemplateList from './components/Templates/TemplateList'
import TemplateEditor from './components/Templates/TemplateEditor'
import MetricsTab from './components/Metrics/MetricsTab'
import { useFolders } from './hooks/useFolders'
import { useTemplates } from './hooks/useTemplates'

export default function App() {
  const [session, setSession] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  const [tab, setTab] = useState('templates')
  const [activeFolder, setActiveFolder] = useState(null)
  const [page, setPage] = useState('list')
  const [editing, setEditing] = useState(null)

  const [metricDays, setMetricDays] = useState(7)
  const [metricTemplate, setMetricTemplate] = useState('')

  const { folders, addFolder, deleteFolder } = useFolders()
  const { templates, saveTemplate, deleteTemplate } = useTemplates(activeFolder)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthChecked(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!authChecked) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>Carregando...</div>
  }

  if (!session) return <Login />

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setEditing(null)
    setPage('list')
  }

  const openCreate = () => {
    setEditing(null)
    setPage('edit')
  }

  const openEdit = (template) => {
    setEditing(template)
    setPage('edit')
  }

  const goBack = () => {
    setEditing(null)
    setPage('list')
  }

  const handleSave = async (payload) => {
    await saveTemplate(payload)
    goBack()
  }

  if (page === 'edit') {
    return (
      <div style={{ padding: 24 }}>
        <TemplateEditor
          editing={editing}
          folders={folders}
          onSave={handleSave}
          onCancel={goBack}
        />
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Header
        tab={tab}
        setTab={setTab}
        onNewTemplate={openCreate}
        onLogout={handleLogout}
        userEmail={session.user?.email}
      />

      {tab === 'metrics' ? (
        <MetricsTab
          templates={templates}
          days={metricDays}
          setDays={setMetricDays}
          templateId={metricTemplate}
          setTemplateId={setMetricTemplate}
        />
      ) : (
        <TemplateList
          folders={folders}
          templates={templates}
          activeFolder={activeFolder}
          setActiveFolder={setActiveFolder}
          onAddFolder={addFolder}
          onDeleteFolder={deleteFolder}
          onOpenTemplate={openEdit}
          onCreateTemplate={openCreate}
          onDeleteTemplate={deleteTemplate}
        />
      )}
    </div>
  )
}
