import { Zap, Mail, CircleStop } from 'lucide-react'

export const NODE_TYPES = {
  trigger: {
    label: 'Gatilho',
    description: 'Início da automação (chamado pelo Unnichat)',
    color: '#7c3aed',
    bg: '#faf5ff',
    Icon: Zap,
    unique: true
  },
  send_email: {
    label: 'Enviar e-mail',
    description: 'Dispara um template para o contato',
    color: '#0f766e',
    bg: '#f0fdfa',
    Icon: Mail,
    unique: false
  },
  end: {
    label: 'Fim',
    description: 'Encerra a automação para esse contato',
    color: '#dc2626',
    bg: '#fef2f2',
    Icon: CircleStop,
    unique: false
  }
}

export function defaultDataFor(type, ctx = {}) {
  if (type === 'trigger') return { event_name: ctx.trigger_event || '' }
  if (type === 'send_email') return { template_id: '' }
  if (type === 'end') return {}
  return {}
}
