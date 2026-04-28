import { useState } from 'react'
import { Bell, Trash2 } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import NotificationItem from '../components/Notifications/NotificationItem'

const TYPE_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'spam_complaint', label: 'Spam' },
  { value: 'unsubscribe', label: 'Descadastro' },
  { value: 'hard_bounce', label: 'Hard bounce' },
  { value: 'high_bounce_rate', label: 'Alta taxa de bounce' }
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativas' },
  { value: 'unread', label: 'Não lidas' },
  { value: 'dismissed', label: 'Dispensadas' },
  { value: 'all', label: 'Todas' }
]

export default function NotificationsPage() {
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const { notifications, loading, dismiss, dismissAll } = useNotifications({ typeFilter, statusFilter })

  const dismissable = notifications.filter(n => !n.dismissed)
  const canBulkDismiss = dismissable.length > 0

  const handleDismissAll = async () => {
    if (!canBulkDismiss) return
    if (!confirm(`Dispensar ${dismissable.length} notificação(ões) visíveis?`)) return
    await dismissAll(dismissable.map(n => n.id))
  }

  const sel = { border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: 13, outline: 'none', background: 'white', cursor: 'pointer' }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Notificações</h1>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Sinais negativos do sistema (spam, descadastros, bounces)</p>
        </div>
        <button
          onClick={handleDismissAll}
          disabled={!canBulkDismiss}
          style={{
            background: canBulkDismiss ? '#0f766e' : '#cbd5e1',
            color: 'white', border: 'none', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, fontWeight: 500,
            cursor: canBulkDismiss ? 'pointer' : 'default',
            display: 'inline-flex', alignItems: 'center', gap: 6
          }}
        >
          <Trash2 size={14} />
          Dispensar visíveis
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={sel}>
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={sel}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 13 }}>Carregando notificações...</div>
      ) : notifications.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: 14, borderRadius: '50%', background: '#f0fdfa', color: '#0f766e', marginBottom: 12 }}>
            <Bell size={28} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>Nenhuma notificação</p>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Tudo limpo por aqui.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map(n => (
            <NotificationItem
              key={n.id}
              notification={n}
              onDismiss={n.dismissed ? null : dismiss}
            />
          ))}
        </div>
      )}
    </>
  )
}
