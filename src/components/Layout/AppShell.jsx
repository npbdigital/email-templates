import Sidebar from './Sidebar'

export default function AppShell({ userEmail, onLogout, children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      <Sidebar userEmail={userEmail} onLogout={onLogout} />
      <main style={{ flex: 1, minWidth: 0, padding: '28px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
