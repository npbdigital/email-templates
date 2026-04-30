import { Zap, Mail, CircleStop, Clock, CalendarClock, MailOpen, MousePointerClick, Webhook } from 'lucide-react'

export const NODE_TYPES = {
  trigger: {
    label: 'Gatilho',
    description: 'Início da automação (chamado pelo Unnichat)',
    color: '#7c3aed',
    bg: '#faf5ff',
    Icon: Zap,
    unique: true,
    branching: false
  },
  send_email: {
    label: 'Enviar e-mail',
    description: 'Dispara um template para o contato',
    color: '#0f766e',
    bg: '#f0fdfa',
    Icon: Mail,
    unique: false,
    branching: false
  },
  wait_duration: {
    label: 'Aguardar duração',
    description: 'Pausa o fluxo por X minutos/horas/dias',
    color: '#f59e0b',
    bg: '#fffbeb',
    Icon: Clock,
    unique: false,
    branching: false
  },
  wait_until_time: {
    label: 'Aguardar até horário',
    description: 'Espera até um horário específico do dia',
    color: '#f59e0b',
    bg: '#fffbeb',
    Icon: CalendarClock,
    unique: false,
    branching: false
  },
  condition_opened: {
    label: 'Abriu e-mail anterior?',
    description: 'Ramifica conforme abertura de envio prévio',
    color: '#0284c7',
    bg: '#f0f9ff',
    Icon: MailOpen,
    unique: false,
    branching: true
  },
  condition_clicked: {
    label: 'Clicou em link?',
    description: 'Ramifica conforme clique em envio prévio',
    color: '#0284c7',
    bg: '#f0f9ff',
    Icon: MousePointerClick,
    unique: false,
    branching: true
  },
  condition_time: {
    label: 'Por horário',
    description: 'Ramifica conforme horário atual (BRT)',
    color: '#0284c7',
    bg: '#f0f9ff',
    Icon: Clock,
    unique: false,
    branching: true
  },
  webhook_out: {
    label: 'Webhook externo',
    description: 'Dispara POST/GET pra URL externa',
    color: '#64748b',
    bg: '#f8fafc',
    Icon: Webhook,
    unique: false,
    branching: false
  },
  end: {
    label: 'Fim',
    description: 'Encerra a automação para esse contato',
    color: '#dc2626',
    bg: '#fef2f2',
    Icon: CircleStop,
    unique: false,
    branching: false
  }
}

const ALL_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function defaultDataFor(type, ctx = {}) {
  if (type === 'trigger') return { event_name: ctx.trigger_event || '' }
  if (type === 'send_email') return { template_id: '' }
  if (type === 'wait_duration') return { amount: 30, unit: 'minutes' }
  if (type === 'wait_until_time') return { time: '17:00', behavior: 'send_now', days_allowed: ALL_DAYS }
  if (type === 'condition_opened') return { wait_minutes: 60, reference_node_id: '' }
  if (type === 'condition_clicked') return { wait_minutes: 60, reference_node_id: '' }
  if (type === 'condition_time') return { operator: 'before', time1: '17:00', time2: '20:00' }
  if (type === 'webhook_out') return { url: '', method: 'POST', headers: [], body_json: '{\n  "name": "{{nome}}",\n  "email": "{{email}}"\n}' }
  if (type === 'end') return {}
  return {}
}

export const DAYS_OPTIONS = [
  { value: 'sun', label: 'Dom' },
  { value: 'mon', label: 'Seg' },
  { value: 'tue', label: 'Ter' },
  { value: 'wed', label: 'Qua' },
  { value: 'thu', label: 'Qui' },
  { value: 'fri', label: 'Sex' },
  { value: 'sat', label: 'Sáb' }
]
