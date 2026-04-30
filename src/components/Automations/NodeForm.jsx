import { Trash2, Plus, X } from 'lucide-react'
import { NODE_TYPES, DAYS_OPTIONS } from './nodeTypes'

const inp = { width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', background: 'white' }
const lbl = { fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }
const help = { fontSize: 11, color: '#94a3b8', marginTop: 6, lineHeight: 1.5 }

function Section({ children }) {
  return <div style={{ marginBottom: 14 }}>{children}</div>
}

export default function NodeForm({ node, templates, allNodes, onChange, onDelete }) {
  if (!node) return null
  const meta = NODE_TYPES[node.type] || {}
  const Icon = meta.Icon
  const data = node.data || {}

  const setData = (patch) => onChange(node.id, { ...data, ...patch })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        {Icon && (
          <span style={{ display: 'inline-flex', padding: 6, borderRadius: 7, background: meta.bg, color: meta.color }}>
            <Icon size={16} />
          </span>
        )}
        <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{meta.label}</p>
      </div>

      {node.type === 'trigger' && <TriggerForm data={data} setData={setData} />}
      {node.type === 'send_email' && <SendEmailForm data={data} setData={setData} templates={templates} />}
      {node.type === 'wait_duration' && <WaitDurationForm data={data} setData={setData} />}
      {node.type === 'wait_until_time' && <WaitUntilTimeForm data={data} setData={setData} />}
      {node.type === 'condition_opened' && <ConditionEmailEventForm data={data} setData={setData} allNodes={allNodes} templates={templates} verb="abriu" />}
      {node.type === 'condition_clicked' && <ConditionEmailEventForm data={data} setData={setData} allNodes={allNodes} templates={templates} verb="clicou em" />}
      {node.type === 'condition_time' && <ConditionTimeForm data={data} setData={setData} />}
      {node.type === 'webhook_out' && <WebhookOutForm data={data} setData={setData} />}
      {node.type === 'end' && (
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
          Esse nó encerra o fluxo para o contato. Sem configuração necessária.
        </p>
      )}

      {node.type !== 'trigger' && (
        <button
          onClick={() => onDelete(node.id)}
          style={{
            marginTop: 24, width: '100%', background: 'white', color: '#dc2626',
            border: '1px solid #fecaca', borderRadius: 8, padding: '8px 14px',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}
        >
          <Trash2 size={14} />
          Remover nó
        </button>
      )}
    </div>
  )
}

function TriggerForm({ data, setData }) {
  return (
    <Section>
      <label style={lbl}>Nome do evento (gatilho)</label>
      <input
        value={data.event_name || ''}
        onChange={(e) => setData({ event_name: e.target.value })}
        placeholder="webnario_confirmado"
        style={inp}
      />
      <p style={help}>Identifica o gatilho. Use minúsculas, números e underline.</p>
    </Section>
  )
}

function SendEmailForm({ data, setData, templates }) {
  return (
    <Section>
      <label style={lbl}>Template</label>
      <select
        value={data.template_id || ''}
        onChange={(e) => setData({ template_id: e.target.value })}
        style={{ ...inp, cursor: 'pointer' }}
      >
        <option value="">Escolha um template</option>
        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      {!data.template_id && <p style={{ ...help, color: '#dc2626' }}>Sem template, esse nó não pode ser publicado.</p>}
    </Section>
  )
}

function WaitDurationForm({ data, setData }) {
  return (
    <>
      <Section>
        <label style={lbl}>Quantidade</label>
        <input
          type="number"
          min="1"
          value={data.amount ?? ''}
          onChange={(e) => setData({ amount: Number(e.target.value) || 0 })}
          style={inp}
        />
      </Section>
      <Section>
        <label style={lbl}>Unidade</label>
        <select
          value={data.unit || 'minutes'}
          onChange={(e) => setData({ unit: e.target.value })}
          style={{ ...inp, cursor: 'pointer' }}
        >
          <option value="minutes">Minutos</option>
          <option value="hours">Horas</option>
          <option value="days">Dias</option>
        </select>
      </Section>
      <p style={help}>O fluxo pausa essa duração antes de seguir.</p>
    </>
  )
}

function WaitUntilTimeForm({ data, setData }) {
  const days = Array.isArray(data.days_allowed) ? data.days_allowed : []
  const toggleDay = (d) => {
    if (days.includes(d)) setData({ days_allowed: days.filter(x => x !== d) })
    else setData({ days_allowed: [...days, d] })
  }

  return (
    <>
      <Section>
        <label style={lbl}>Horário alvo (BRT)</label>
        <input
          type="time"
          value={data.time || ''}
          onChange={(e) => setData({ time: e.target.value })}
          style={inp}
        />
      </Section>
      <Section>
        <label style={lbl}>Se já passou hoje</label>
        <select
          value={data.behavior || 'send_now'}
          onChange={(e) => setData({ behavior: e.target.value })}
          style={{ ...inp, cursor: 'pointer' }}
        >
          <option value="send_now">Continuar imediatamente</option>
          <option value="wait_tomorrow">Esperar próximo dia válido</option>
        </select>
      </Section>
      <Section>
        <label style={lbl}>Dias permitidos</label>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {DAYS_OPTIONS.map(d => {
            const on = days.includes(d.value)
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                style={{
                  background: on ? '#0f766e' : 'white',
                  color: on ? 'white' : '#64748b',
                  border: '1px solid ' + (on ? '#0f766e' : '#e2e8f0'),
                  borderRadius: 6, padding: '5px 9px', fontSize: 12,
                  fontWeight: 500, cursor: 'pointer'
                }}
              >
                {d.label}
              </button>
            )
          })}
        </div>
      </Section>
    </>
  )
}

function ConditionEmailEventForm({ data, setData, allNodes, templates, verb }) {
  const sendEmailNodes = (allNodes || []).filter(n => n.type === 'send_email')

  return (
    <>
      <Section>
        <label style={lbl}>E-mail de referência (envio anterior)</label>
        <select
          value={data.reference_node_id || ''}
          onChange={(e) => setData({ reference_node_id: e.target.value })}
          style={{ ...inp, cursor: 'pointer' }}
        >
          <option value="">Escolha um nó "Enviar e-mail"</option>
          {sendEmailNodes.map(n => {
            const tpl = templates?.find(t => t.id === n.data?.template_id)
            return <option key={n.id} value={n.id}>{tpl?.name || n.id}</option>
          })}
        </select>
        {sendEmailNodes.length === 0 && (
          <p style={{ ...help, color: '#dc2626' }}>Adicione um nó "Enviar e-mail" antes desse na automação.</p>
        )}
      </Section>
      <Section>
        <label style={lbl}>Tempo de espera antes de verificar (minutos)</label>
        <input
          type="number"
          min="0"
          value={data.wait_minutes ?? ''}
          onChange={(e) => setData({ wait_minutes: Number(e.target.value) || 0 })}
          style={inp}
        />
        <p style={help}>Espera esse tempo após o envio anterior antes de checar se o lead {verb}.</p>
      </Section>
      <p style={{ ...help, marginTop: 14 }}>
        <strong style={{ color: '#10b981' }}>Sim</strong> = lead {verb} no período.
        <strong style={{ color: '#ef4444', marginLeft: 8 }}>Não</strong> = lead não {verb}.
      </p>
    </>
  )
}

function ConditionTimeForm({ data, setData }) {
  const op = data.operator || 'before'
  return (
    <>
      <Section>
        <label style={lbl}>Operador</label>
        <select
          value={op}
          onChange={(e) => setData({ operator: e.target.value })}
          style={{ ...inp, cursor: 'pointer' }}
        >
          <option value="before">Antes de</option>
          <option value="after">Depois de</option>
          <option value="between">Entre</option>
        </select>
      </Section>
      <Section>
        <label style={lbl}>Horário {op === 'between' ? '(início)' : ''}</label>
        <input
          type="time"
          value={data.time1 || ''}
          onChange={(e) => setData({ time1: e.target.value })}
          style={inp}
        />
      </Section>
      {op === 'between' && (
        <Section>
          <label style={lbl}>Horário (fim)</label>
          <input
            type="time"
            value={data.time2 || ''}
            onChange={(e) => setData({ time2: e.target.value })}
            style={inp}
          />
        </Section>
      )}
      <p style={help}>Avalia o horário atual em São Paulo (BRT).</p>
    </>
  )
}

function WebhookOutForm({ data, setData }) {
  const headers = Array.isArray(data.headers) ? data.headers : []
  const updateHeader = (i, patch) => {
    const next = headers.map((h, idx) => idx === i ? { ...h, ...patch } : h)
    setData({ headers: next })
  }
  const addHeader = () => setData({ headers: [...headers, { name: '', value: '' }] })
  const removeHeader = (i) => setData({ headers: headers.filter((_, idx) => idx !== i) })

  return (
    <>
      <Section>
        <label style={lbl}>URL</label>
        <input
          type="url"
          value={data.url || ''}
          onChange={(e) => setData({ url: e.target.value })}
          placeholder="https://api.exemplo.com/webhook"
          style={inp}
        />
      </Section>
      <Section>
        <label style={lbl}>Method</label>
        <select
          value={data.method || 'POST'}
          onChange={(e) => setData({ method: e.target.value })}
          style={{ ...inp, cursor: 'pointer' }}
        >
          <option value="POST">POST</option>
          <option value="GET">GET</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </Section>
      <Section>
        <label style={lbl}>Headers</label>
        {headers.map((h, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input
              value={h.name || ''}
              onChange={(e) => updateHeader(i, { name: e.target.value })}
              placeholder="Nome"
              style={{ ...inp, flex: 1 }}
            />
            <input
              value={h.value || ''}
              onChange={(e) => updateHeader(i, { value: e.target.value })}
              placeholder="Valor"
              style={{ ...inp, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => removeHeader(i)}
              style={{ background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '0 8px', cursor: 'pointer' }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addHeader}
          style={{ background: 'white', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <Plus size={12} />
          Adicionar header
        </button>
      </Section>
      {(data.method || 'POST') !== 'GET' && (
        <Section>
          <label style={lbl}>Body (JSON)</label>
          <textarea
            value={data.body_json || ''}
            onChange={(e) => setData({ body_json: e.target.value })}
            rows={6}
            style={{ ...inp, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
            placeholder='{"name":"{{nome}}"}'
          />
          <p style={help}>Variáveis disponíveis: <code>{'{{nome}}'}</code>, <code>{'{{email}}'}</code>, <code>{'{{telefone}}'}</code>.</p>
        </Section>
      )}
    </>
  )
}
