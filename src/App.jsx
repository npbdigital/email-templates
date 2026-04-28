import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './components/Auth/Login'
import AppShell from './components/Layout/AppShell'
import TemplatesPage from './pages/TemplatesPage'
import TemplateEditorPage from './pages/TemplateEditorPage'
import MetricsPage from './pages/MetricsPage'
import AutomationsListPage from './pages/AutomationsListPage'
import AutomationBuilderPage from './pages/AutomationBuilderPage'
import UnsubscribePage from './pages/UnsubscribePage'
import NotificationsPage from './pages/NotificationsPage'
import UnsubscribedPage from './pages/UnsubscribedPage'

function AuthedApp() {
  const [session, setSession] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthChecked(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
        Carregando...
      </div>
    )
  }

  if (!session) return <Login />

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AppShell userEmail={session.user?.email} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/templates" replace />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/templates/:id" element={<TemplateEditorPage />} />
        <Route path="/metrics" element={<MetricsPage />} />
        <Route path="/automations" element={<AutomationsListPage />} />
        <Route path="/automations/:id" element={<AutomationBuilderPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/unsubscribed" element={<UnsubscribedPage />} />
        <Route path="*" element={<Navigate to="/templates" replace />} />
      </Routes>
    </AppShell>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/unsubscribe" element={<UnsubscribePage />} />
        <Route path="*" element={<AuthedApp />} />
      </Routes>
    </BrowserRouter>
  )
}
