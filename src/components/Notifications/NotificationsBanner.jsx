import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import NotificationItem from './NotificationItem'

export default function NotificationsBanner() {
  const navigate = useNavigate()
  const { notifications, dismiss, loading } = useNotifications({ statusFilter: 'active', limit: 4 })

  if (loading || notifications.length === 0) return null

  const visible = notifications.slice(0, 3)
  const overflow = notifications.length > 3

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1e293b' }}>
          <Bell size={15} />
          <p style={{ fontSize: 13, fontWeight: 600 }}>Notificações</p>
        </div>
        <button
          onClick={() => navigate('/notifications')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f766e', fontSize: 12, fontWeight: 600 }}
        >
          Ver todas →
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map(n => (
          <NotificationItem key={n.id} notification={n} onDismiss={dismiss} compact />
        ))}
      </div>

      {overflow && (
        <button
          onClick={() => navigate('/notifications')}
          style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 12 }}
        >
          + mais notificações ativas
        </button>
      )}
    </div>
  )
}
