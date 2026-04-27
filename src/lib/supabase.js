import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true }
})

export const EVENT_LABELS = {
  sent: 'Enviado',
  delivered: 'Entregue',
  opened: 'Aberto',
  clicked: 'Clicou',
  hardBounce: 'Hard Bounce',
  softBounce: 'Soft Bounce',
  unsubscribed: 'Descadastro',
  spam: 'Spam'
}

export const EVENT_COLORS = {
  sent: '#64748b',
  delivered: '#0f766e',
  opened: '#0284c7',
  clicked: '#7c3aed',
  hardBounce: '#dc2626',
  softBounce: '#f59e0b',
  unsubscribed: '#94a3b8',
  spam: '#ef4444'
}
