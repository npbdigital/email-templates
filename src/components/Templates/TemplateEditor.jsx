import { useState, useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link', 'image'],
  ['clean']
]

const DEFAULT_BODY = '<p>Oi <strong>{{nome}}</strong>,</p><p><br></p><p>Sua mensagem aqui.</p><p><br></p><p>Felipe</p>'

export default function TemplateEditor({ editing, folders, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: editing?.name || '',
    subject: editing?.subject || '',
    folder_id: editing?.folder_id || null
  })
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const editorRef = useRef(null)
  const quillRef = useRef(null)

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return
    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      modules: { toolbar: TOOLBAR },
      placeholder: 'Escreva o corpo do e-mail aqui...'
    })
    quill.root.innerHTML = editing?.body_html || DEFAULT_BODY
    quillRef.current = quill
    return () => { quillRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async () => {
    if (!form.name || !form.subject) return
    const body_html = quillRef.current ? quillRef.current.root.innerHTML : ''
    if (!body_html || body_html === '<p><br></p>') {
      alert('O corpo do e-mail está vazio.')
      return
    }
    setSaving(true)
    try {
      await onSave({
        id: editing?.id,
        name: form.name,
        subject: form.subject,
        body_html,
        folder_id: form.folder_id
      })
    } finally {
      setSaving(false)
    }
  }

  const copyId = () => {
    if (!editing) return
    navigator.clipboard?.writeText(editing.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const inp = { width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }
  const lbl = { fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13 }}>← Voltar</button>
            <span style={{ color: '#e2e8f0' }}>|</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{editing ? 'Editar template' : 'Novo template'}</span>
          </div>
          {editing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <code style={{ fontSize: 11, color: '#94a3b8' }}>{editing.id}</code>
              <button onClick={copyId} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f766e', fontSize: 11, fontWeight: 600 }}>
                {copied ? '✓ Copiado!' : 'Copiar ID'}
              </button>
            </div>
          )}
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Nome interno</label>
              <input
                style={inp}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Webnário — lembrete 30min"
              />
            </div>
            <div>
              <label style={lbl}>Pasta</label>
              <select
                style={{ ...inp, background: 'white' }}
                value={form.folder_id || ''}
                onChange={(e) => setForm({ ...form, folder_id: e.target.value || null })}
              >
                <option value="">Sem pasta</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={lbl}>Assunto do e-mail</label>
            <input
              style={inp}
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder='Ex: {{nome}}, sua aula começa em 30 minutos'
            />
          </div>

          <div>
            <label style={lbl}>Corpo do e-mail</label>
            <div ref={editorRef} />
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
              Use <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>{'{{nome}}'}</code>,{' '}
              <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>{'{{email}}'}</code>,{' '}
              <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>{'{{link_registro}}'}</code>
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button
              onClick={handleSave}
              disabled={!form.name || !form.subject || saving}
              style={{
                background: (!form.name || !form.subject || saving) ? '#94a3b8' : '#0f766e',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '9px 22px',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {saving ? 'Salvando...' : 'Salvar template'}
            </button>
            <button
              onClick={onCancel}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', padding: '9px 12px' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
