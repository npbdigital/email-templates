import { AlertTriangle, AlertOctagon, Info, X, Mail } from 'lucide-react'

export const SEVERITY_STYLES = {
  info:     { bg: '#f0f9ff', border: '#bae6fd', fg: '#0369a1', Icon: Info },
  warning:  { bg: '#fffbeb', border: '#fde68a', fg: '#b45309', Icon: AlertTriangle },
  critical: { bg: '#fef2f2', border: '#fecaca', fg: '#b91c1c', Icon: AlertOctagon }
}

const TYPE_ICONS = {
  unsubscribe: Mail
}

export function relativeTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d atrás`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' })
}

export default function NotificationItem({ notification, onDismiss, compact = false }) {
  const s = SEVERITY_STYLES[notification.severity] || SEVERITY_STYLES.warning
  const Icon = TYPE_ICONS[notification.type] || s.Icon

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 10,
      padding: compact ? '10px 12px' : '12px 14px'
    }}>
      <div style={{ color: s.fg, marginTop: 1, flexShrink: 0 }}>
        <Icon size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.4 }}>{notification.message}</p>
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{relativeTime(notification.created_at)}</p>
      </div>
      {onDismiss && (
        <button
          onClick={() => onDismiss(notification.id)}
          title="Dispensar"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: s.fg, opacity: 0.6, padding: 2, display: 'inline-flex', flexShrink: 0
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
          onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
