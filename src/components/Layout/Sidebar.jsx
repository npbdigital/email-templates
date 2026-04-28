import { NavLink } from 'react-router-dom'
import { Mail, BarChart3, Workflow, LogOut, Bell, UserX } from 'lucide-react'
import { useNotificationCount } from '../../hooks/useNotifications'

const NAV = [
  { to: '/templates', label: 'Templates', Icon: Mail },
  { to: '/metrics', label: 'Métricas', Icon: BarChart3 },
  { to: '/automations', label: 'Automações', Icon: Workflow },
  { to: '/notifications', label: 'Notificações', Icon: Bell, badgeKey: 'notifications' },
  { to: '/unsubscribed', label: 'Descadastros', Icon: UserX }
]

const baseItem = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 12px',
  borderRadius: 8,
  fontSize: 13,
  textDecoration: 'none',
  transition: 'background 0.12s, color 0.12s'
}

function itemStyle(isActive) {
  if (isActive) return { ...baseItem, background: '#f0fdfa', color: '#0f766e', fontWeight: 600 }
  return { ...baseItem, background: 'transparent', color: '#475569', fontWeight: 500 }
}

function Badge({ value }) {
  if (!value) return null
  return (
    <span style={{
      background: '#dc2626',
      color: 'white',
      fontSize: 10,
      fontWeight: 700,
      padding: '1px 6px',
      borderRadius: 10,
      minWidth: 18,
      textAlign: 'center',
      lineHeight: '14px'
    }}>
      {value > 99 ? '99+' : value}
    </span>
  )
}

export default function Sidebar({ userEmail, onLogout }) {
  const { count: notifCount } = useNotificationCount({ pollMs: 30000 })

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      background: 'white',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0
    }}>
      <div style={{ padding: '20px 16px 16px' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', lineHeight: 1.1 }}>Email Templates</p>
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>NPB Digital — Felipe Sempe</p>
      </div>

      <nav style={{ flex: 1, padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ to, label, Icon, badgeKey }) => (
          <NavLink key={to} to={to} style={({ isActive }) => itemStyle(isActive)}>
            {({ isActive }) => (
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                <span style={{ flex: 1 }}>{label}</span>
                {badgeKey === 'notifications' && <Badge value={notifCount} />}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid #e2e8f0', padding: '12px 14px' }}>
        {userEmail && (
          <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, wordBreak: 'break-all' }}>{userEmail}</p>
        )}
        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            background: 'none',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '7px 10px',
            fontSize: 12,
            color: '#475569',
            cursor: 'pointer'
          }}
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </aside>
  )
}
