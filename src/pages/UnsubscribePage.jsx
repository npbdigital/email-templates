import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Mail, CheckCircle2, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { validateToken } from '../lib/unsubscribeToken'

const STATES = {
  CHECKING: 'checking',
  READY: 'ready',
  INVALID: 'invalid',
  SUBMITTING: 'submitting',
  DONE: 'done',
  ERROR: 'error'
}

export default function UnsubscribePage() {
  const [params] = useSearchParams()
  const email = (params.get('email') || '').trim()
  const token = (params.get('token') || '').trim()

  const [state, setState] = useState(STATES.CHECKING)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    async function check() {
      if (!email || !token) {
        if (!cancelled) setState(STATES.INVALID)
        return
      }
      const ok = await validateToken(email, token)
      if (cancelled) return
      setState(ok ? STATES.READY : STATES.INVALID)
    }
    check()
    return () => { cancelled = true }
  }, [email, token])

  const handleConfirm = async () => {
    setState(STATES.SUBMITTING)
    setErrorMsg('')
    const lowered = email.toLowerCase()

    const { error: e1 } = await supabase
      .from('email_unsubscribed')
      .upsert(
        { email: lowered, source: 'link_email', reason: 'user_requested_via_link' },
        { onConflict: 'email', ignoreDuplicates: true }
      )

    if (e1) {
      setErrorMsg(e1.message || 'Falha ao registrar descadastro.')
      setState(STATES.ERROR)
      return
    }

    await supabase.from('notifications').insert({
      type: 'unsubscribe',
      email: lowered,
      message: lowered + ' clicou no link de descadastro do e-mail',
      severity: 'info'
    })

    setState(STATES.DONE)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 460,
        background: 'white',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        padding: 36,
        textAlign: 'center'
      }}>
        <div style={{ display: 'inline-flex', padding: 14, borderRadius: '50%', background: '#f0fdfa', color: '#0f766e', marginBottom: 14 }}>
          <Mail size={28} />
        </div>

        {state === STATES.CHECKING && (
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Verificando link...</p>
        )}

        {state === STATES.INVALID && (
          <>
            <div style={{ display: 'inline-flex', padding: 12, borderRadius: '50%', background: '#fef2f2', color: '#dc2626', marginBottom: 12 }}>
              <AlertTriangle size={22} />
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Link inválido ou expirado</h1>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
              Não conseguimos validar este link. Entre em contato pelo nosso suporte se você ainda quiser ser descadastrado.
            </p>
          </>
        )}

        {(state === STATES.READY || state === STATES.SUBMITTING || state === STATES.ERROR) && (
          <>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
              Não quer mais receber e-mails?
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 18 }}>
              Confirme o descadastro do e-mail:
            </p>
            <p style={{
              fontSize: 14, fontWeight: 600, color: '#0f766e',
              background: '#f0fdfa', borderRadius: 8, padding: '10px 14px',
              marginBottom: 22, wordBreak: 'break-all'
            }}>
              {email}
            </p>

            {state === STATES.ERROR && errorMsg && (
              <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 12px', fontSize: 12, marginBottom: 14, textAlign: 'left' }}>
                {errorMsg}
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={state === STATES.SUBMITTING}
              style={{
                width: '100%',
                background: state === STATES.SUBMITTING ? '#94a3b8' : '#0f766e',
                color: 'white', border: 'none', borderRadius: 8,
                padding: '12px 18px', fontSize: 14, fontWeight: 500,
                cursor: state === STATES.SUBMITTING ? 'default' : 'pointer',
                marginBottom: 10
              }}
            >
              {state === STATES.SUBMITTING ? 'Processando...' : 'Confirmar descadastro'}
            </button>

            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
              Mudou de ideia? É só fechar esta página — nada será alterado.
            </p>
          </>
        )}

        {state === STATES.DONE && (
          <>
            <div style={{ display: 'inline-flex', padding: 12, borderRadius: '50%', background: '#ecfdf5', color: '#047857', marginBottom: 12 }}>
              <CheckCircle2 size={22} />
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Descadastro confirmado</h1>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
              <strong style={{ color: '#1e293b' }}>{email}</strong> não receberá mais e-mails nossos.
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 14 }}>
              Você pode fechar esta página.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
