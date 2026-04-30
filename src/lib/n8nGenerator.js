const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const SECRET = import.meta.env.VITE_UNSUBSCRIBE_SECRET || ''
const BREVO_KEY = import.meta.env.VITE_BREVO_API_KEY || ''

const TRIGGER_NODE_NAME = 'Receber Trigger'

function supabaseHeaders() {
  return [
    { name: 'apikey', value: SUPABASE_KEY },
    { name: 'Authorization', value: 'Bearer ' + SUPABASE_KEY }
  ]
}

function makeNodeId() {
  return 'n8n_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36)
}

function shortId(id) {
  return (id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6)
}

// ───────────────────────────────────────────────────────────────────────
// Validation
// ───────────────────────────────────────────────────────────────────────

export function validateFlowForPublish(flowData, templates) {
  const issues = []
  const nodes = flowData?.nodes || []
  const edges = flowData?.edges || []

  const triggers = nodes.filter(n => n.type === 'trigger')
  if (triggers.length === 0) issues.push('falta o nó de gatilho')
  if (triggers.length > 1) issues.push('só pode haver um gatilho')

  const trigger = triggers[0]
  if (trigger && !trigger.data?.event_name) issues.push('o gatilho precisa de um nome de evento')

  const trigOutgoing = trigger ? edges.filter(e => e.source === trigger.id) : []
  if (trigger && trigOutgoing.length === 0) issues.push('o gatilho precisa estar conectado a algum nó')

  // Per-node validation
  for (const n of nodes) {
    if (n.type === 'send_email') {
      if (!n.data?.template_id) {
        issues.push('um nó "Enviar e-mail" está sem template')
        continue
      }
      const exists = (templates || []).some(t => t.id === n.data.template_id)
      if (!exists) issues.push('um nó "Enviar e-mail" usa um template que não existe mais')
    }
    if (n.type === 'wait_duration') {
      if (!n.data?.amount || n.data.amount <= 0) issues.push('um nó "Aguardar duração" precisa de quantidade > 0')
      if (!['minutes', 'hours', 'days'].includes(n.data?.unit)) issues.push('um nó "Aguardar duração" tem unidade inválida')
    }
    if (n.type === 'wait_until_time') {
      if (!n.data?.time || !/^\d{2}:\d{2}$/.test(n.data.time)) issues.push('um nó "Aguardar até horário" precisa de horário HH:MM válido')
      const days = Array.isArray(n.data?.days_allowed) ? n.data.days_allowed : []
      if (days.length === 0) issues.push('um nó "Aguardar até horário" precisa de pelo menos 1 dia permitido')
    }
    if (n.type === 'condition_opened' || n.type === 'condition_clicked') {
      if (!n.data?.reference_node_id) {
        issues.push('um nó "Abriu/Clicou" precisa do e-mail de referência')
        continue
      }
      const refNode = nodes.find(x => x.id === n.data.reference_node_id)
      if (!refNode || refNode.type !== 'send_email') {
        issues.push('um nó "Abriu/Clicou" referencia um nó que não é "Enviar e-mail"')
      } else if (!refNode.data?.template_id) {
        issues.push('o "Enviar e-mail" referenciado por uma condicional está sem template')
      }
    }
    if (n.type === 'condition_time') {
      const op = n.data?.operator
      if (!['before', 'after', 'between'].includes(op)) issues.push('um nó "Por horário" tem operador inválido')
      if (!n.data?.time1 || !/^\d{2}:\d{2}$/.test(n.data.time1)) issues.push('um nó "Por horário" precisa de horário válido')
      if (op === 'between' && (!n.data?.time2 || !/^\d{2}:\d{2}$/.test(n.data.time2))) {
        issues.push('um nó "Por horário" com "Entre" precisa de horário final')
      }
    }
    if (n.type === 'webhook_out') {
      if (!n.data?.url || !/^https?:\/\//.test(n.data.url)) issues.push('um nó "Webhook externo" precisa de URL HTTP/HTTPS válida')
    }
  }

  // Branching nodes need both Sim and Não branches connected
  for (const n of nodes) {
    if (['condition_opened', 'condition_clicked', 'condition_time'].includes(n.type)) {
      const out = edges.filter(e => e.source === n.id)
      const hasSim = out.some(e => e.sourceHandle === 'true')
      const hasNao = out.some(e => e.sourceHandle === 'false')
      if (!hasSim) issues.push(`uma condicional "${n.type}" não tem o branch "Sim" conectado`)
      if (!hasNao) issues.push(`uma condicional "${n.type}" não tem o branch "Não" conectado`)
    }
  }

  // Orphan nodes (não alcançáveis a partir do trigger)
  if (trigger) {
    const reachable = new Set([trigger.id])
    let changed = true
    while (changed) {
      changed = false
      for (const e of edges) {
        if (reachable.has(e.source) && !reachable.has(e.target)) {
          reachable.add(e.target)
          changed = true
        }
      }
    }
    const orphans = nodes.filter(n => !reachable.has(n.id))
    if (orphans.length > 0) {
      issues.push(`${orphans.length} nó(s) sem conexão a partir do gatilho — remova ou conecte`)
    }
  }

  // Cycles detection (DFS)
  function hasCycle() {
    const adj = new Map()
    for (const e of edges) {
      if (!adj.has(e.source)) adj.set(e.source, [])
      adj.get(e.source).push(e.target)
    }
    const visiting = new Set()
    const visited = new Set()
    function dfs(id) {
      if (visiting.has(id)) return true
      if (visited.has(id)) return false
      visiting.add(id)
      const next = adj.get(id) || []
      for (const t of next) {
        if (dfs(t)) return true
      }
      visiting.delete(id)
      visited.add(id)
      return false
    }
    for (const n of nodes) {
      if (dfs(n.id)) return true
    }
    return false
  }
  if (hasCycle()) issues.push('o fluxo tem um ciclo (loop infinito) — remova a conexão que volta')

  // Secret config
  const hasSendEmail = nodes.some(n => n.type === 'send_email')
  if (hasSendEmail && !BREVO_KEY) issues.push('VITE_BREVO_API_KEY não configurado')
  if (hasSendEmail && !SECRET) issues.push('VITE_UNSUBSCRIBE_SECRET não configurado')

  return issues
}

// ───────────────────────────────────────────────────────────────────────
// Connection helpers
// ───────────────────────────────────────────────────────────────────────

function setConnection(conns, fromName, toName, output = 0) {
  if (!conns[fromName]) conns[fromName] = { main: [] }
  while (conns[fromName].main.length <= output) conns[fromName].main.push([])
  conns[fromName].main[output].push({ node: toName, type: 'main', index: 0 })
}

// ───────────────────────────────────────────────────────────────────────
// Node builders
// ───────────────────────────────────────────────────────────────────────

function buildTriggerNode(automation, position) {
  return {
    id: makeNodeId(),
    name: TRIGGER_NODE_NAME,
    type: 'n8n-nodes-base.webhook',
    typeVersion: 2.1,
    position: [position.x, position.y],
    parameters: {
      httpMethod: 'POST',
      path: 'automation-' + automation.id,
      responseMode: 'onReceived'
    }
  }
}

function buildLogStartNode(automationId, position) {
  const jsCode = [
    "const data = $('" + TRIGGER_NODE_NAME + "').item.json.body || {};",
    "const email = (data.email || '').toString().toLowerCase().trim();",
    "const name = data.name || data.nome || null;",
    "let runId = null;",
    "try {",
    "  const url = '" + SUPABASE_URL + "/rest/v1/automation_runs';",
    "  const res = await fetch(url, {",
    "    method: 'POST',",
    "    headers: {",
    "      apikey: '" + SUPABASE_KEY + "',",
    "      Authorization: 'Bearer " + SUPABASE_KEY + "',",
    "      'Content-Type': 'application/json',",
    "      Prefer: 'return=representation'",
    "    },",
    "    body: JSON.stringify({",
    "      automation_id: '" + automationId + "',",
    "      contact_email: email,",
    "      contact_name: name,",
    "      status: 'running',",
    "      payload: data",
    "    })",
    "  });",
    "  if (res.ok) {",
    "    const arr = await res.json();",
    "    if (Array.isArray(arr) && arr.length > 0) runId = arr[0].id;",
    "  }",
    "} catch (e) { console.log('log start failed:', e?.message); }",
    "return [{ json: { ...$('" + TRIGGER_NODE_NAME + "').item.json, _runId: runId } }];"
  ].join('\n')

  return {
    id: makeNodeId(),
    name: 'Log Start',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [position.x, position.y],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode }
  }
}

function buildLogEndNode(position, suffix) {
  const jsCode = [
    "const runId = $('Log Start').item.json._runId || null;",
    "if (runId) {",
    "  try {",
    "    const url = '" + SUPABASE_URL + "/rest/v1/automation_runs?id=eq.' + runId;",
    "    await fetch(url, {",
    "      method: 'PATCH',",
    "      headers: {",
    "        apikey: '" + SUPABASE_KEY + "',",
    "        Authorization: 'Bearer " + SUPABASE_KEY + "',",
    "        'Content-Type': 'application/json',",
    "        Prefer: 'return=minimal'",
    "      },",
    "      body: JSON.stringify({ status: 'completed', completed_at: new Date().toISOString() })",
    "    });",
    "  } catch (e) { console.log('log end failed:', e?.message); }",
    "}",
    "return [{ json: { status: 'fim', runId } }];"
  ].join('\n')

  return {
    id: makeNodeId(),
    name: 'Log End ' + suffix,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [position.x, position.y],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode }
  }
}

function buildVerificarDescadastroNode(position) {
  const jsCode = [
    "const triggerData = $('" + TRIGGER_NODE_NAME + "').item.json.body || {};",
    "const email = (triggerData.email || '').toString().toLowerCase().trim();",
    "let unsubscribed = false;",
    "if (email) {",
    "  try {",
    "    const url = '" + SUPABASE_URL + "/rest/v1/email_unsubscribed?email=eq.' + encodeURIComponent(email) + '&select=email';",
    "    const res = await fetch(url, { headers: { apikey: '" + SUPABASE_KEY + "', Authorization: 'Bearer " + SUPABASE_KEY + "' } });",
    "    if (res.ok) {",
    "      const arr = await res.json();",
    "      unsubscribed = Array.isArray(arr) && arr.length > 0;",
    "    }",
    "  } catch (e) {",
    "    console.log('verificar descadastro falhou:', e?.message);",
    "  }",
    "}",
    "if (unsubscribed) {",
    "  console.log('Lead descadastrado, fluxo encerrado para:', email);",
    "  return [];",
    "}",
    "return [{ json: $('" + TRIGGER_NODE_NAME + "').item.json }];"
  ].join('\n')

  return {
    id: makeNodeId(),
    name: 'Verificar Descadastro',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [position.x, position.y],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode }
  }
}

function buildBuscarTemplateNode(templateId, position) {
  return {
    id: makeNodeId(),
    name: 'Buscar Template ' + templateId.slice(0, 8),
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.4,
    position: [position.x, position.y],
    parameters: {
      method: 'GET',
      url: SUPABASE_URL + '/rest/v1/email_templates?id=eq.' + templateId + '&select=name,subject,body_html',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: { parameters: supabaseHeaders() }
    }
  }
}

function buildSubstituirNode(templateId, position, suffix) {
  const jsCode = [
    "const data = $('" + TRIGGER_NODE_NAME + "').item.json.body || {};",
    "const template = $input.first().json;",
    "const template_id = '" + templateId + "';",
    "",
    "const nome = data.name || data.nome || '';",
    "const email = (data.email || '').toString();",
    "let telefone = (data.phoneNumber || data.telefone || '').toString().trim();",
    "if (telefone.startsWith('55') && telefone.length > 11) {",
    "  telefone = telefone.slice(2);",
    "}",
    "",
    "const link_registro = 'https://event.webinarjam.com/0qgq75/register/wqlq17ix/1click'",
    "  + '?first_name=' + encodeURIComponent(nome)",
    "  + '&email=' + encodeURIComponent(email)",
    "  + '&phone_country_code=55'",
    "  + '&phone_number=' + encodeURIComponent(telefone)",
    "  + '&timezone=GMT-3'",
    "  + '&schedule_id=1';",
    "",
    "const crypto = require('crypto');",
    "const SECRET = '" + SECRET + "';",
    "const token = crypto.createHmac('sha256', SECRET)",
    "  .update((email || '').toLowerCase())",
    "  .digest('hex')",
    "  .slice(0, 32);",
    "const unsubscribeUrl = 'https://templates.felipesempe.com.br/unsubscribe?email='",
    "  + encodeURIComponent(email) + '&token=' + token;",
    "",
    "const subject = (template.subject || '')",
    "  .replace(/\\{\\{nome\\}\\}/g, nome)",
    "  .replace(/\\{\\{email\\}\\}/g, email)",
    "  .replace(/\\{\\{telefone\\}\\}/g, telefone)",
    "  .replace(/\\{\\{link_registro\\}\\}/g, link_registro);",
    "",
    "let body_html = (template.body_html || '')",
    "  .replace(/\\{\\{nome\\}\\}/g, nome)",
    "  .replace(/\\{\\{email\\}\\}/g, email)",
    "  .replace(/\\{\\{telefone\\}\\}/g, telefone)",
    "  .replace(/\\{\\{link_registro\\}\\}/g, link_registro);",
    "",
    "const footer = '<div style=\"margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;font-family:-apple-system,BlinkMacSystemFont,sans-serif;\">'",
    "  + '<p style=\"margin:0 0 8px;\">Voce esta recebendo este e-mail porque se cadastrou em nossa lista.</p>'",
    "  + '<p style=\"margin:0;\"><a href=\"' + unsubscribeUrl + '\" style=\"color:#94a3b8;text-decoration:underline;\">Nao quero mais receber e-mails</a></p>'",
    "  + '</div>';",
    "body_html += footer;",
    "",
    "return [{ json: {",
    "  to: [{ email, name: nome }],",
    "  sender: { email: 'marketing@felipesempe.com.br', name: 'Felipe Sempe' },",
    "  subject,",
    "  htmlContent: body_html,",
    "  tags: [template_id, template.name || 'sem-nome']",
    "} }];"
  ].join('\n')

  return {
    id: makeNodeId(),
    name: 'Substituir Vars ' + suffix,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [position.x, position.y],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode }
  }
}

function buildEnviarBrevoNode(position, suffix) {
  return {
    id: makeNodeId(),
    name: 'Enviar Brevo ' + suffix,
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.4,
    position: [position.x, position.y],
    parameters: {
      method: 'POST',
      url: 'https://api.brevo.com/v3/smtp/email',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'api-key', value: BREVO_KEY },
          { name: 'content-type', value: 'application/json' },
          { name: 'accept', value: 'application/json' }
        ]
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: '={{ $json }}'
    }
  }
}

function buildPassThroughNode(name, position) {
  // Code node que apenas repassa o trigger data — útil pra que o próximo nó
  // tenha contexto consistente após Wait/Brevo, sem perder o body original.
  return {
    id: makeNodeId(),
    name,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [position.x, position.y],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "return [{ json: $('" + TRIGGER_NODE_NAME + "').item.json }];"
    }
  }
}

function buildWaitNode(position, name, amount, unit) {
  return {
    id: makeNodeId(),
    name,
    type: 'n8n-nodes-base.wait',
    typeVersion: 1.1,
    position: [position.x, position.y],
    parameters: {
      amount,
      unit
    }
  }
}

function buildWaitExpressionNode(position, name, amountExpr, unit) {
  return {
    id: makeNodeId(),
    name,
    type: 'n8n-nodes-base.wait',
    typeVersion: 1.1,
    position: [position.x, position.y],
    parameters: {
      amount: amountExpr,
      unit
    }
  }
}

function buildCalcWaitUntilNode(position, time, behavior, daysAllowed) {
  const [hh, mm] = (time || '00:00').split(':').map(s => parseInt(s, 10) || 0)
  const days = JSON.stringify(daysAllowed || [])

  const jsCode = [
    "const targetH = " + hh + ";",
    "const targetM = " + mm + ";",
    "const behavior = '" + behavior + "';",
    "const allowedDays = " + days + ";",
    "const dayNames = ['sun','mon','tue','wed','thu','fri','sat'];",
    "",
    "// SP = UTC-3 (sem horário de verão desde 2019)",
    "const SP_OFFSET_MIN = -180;",
    "const nowMs = Date.now();",
    "const nowSpMs = nowMs + SP_OFFSET_MIN * 60000;",
    "",
    "function spDate(ms) { return new Date(ms); }",
    "",
    "let target = new Date(nowSpMs);",
    "target.setUTCHours(targetH, targetM, 0, 0);",
    "let targetMs = target.getTime();",
    "",
    "let waitMs = 0;",
    "if (targetMs > nowSpMs) {",
    "  const dayName = dayNames[target.getUTCDay()];",
    "  if (allowedDays.includes(dayName)) {",
    "    waitMs = targetMs - nowSpMs;",
    "  } else {",
    "    // hoje não é dia válido — avança até o próximo",
    "    for (let i = 1; i <= 7; i++) {",
    "      const next = new Date(targetMs);",
    "      next.setUTCDate(next.getUTCDate() + i);",
    "      const dn = dayNames[next.getUTCDay()];",
    "      if (allowedDays.includes(dn)) { waitMs = next.getTime() - nowSpMs; break; }",
    "    }",
    "  }",
    "} else if (behavior === 'send_now') {",
    "  waitMs = 0;",
    "} else {",
    "  // já passou hoje, avança",
    "  for (let i = 1; i <= 7; i++) {",
    "    const next = new Date(targetMs);",
    "    next.setUTCDate(next.getUTCDate() + i);",
    "    const dn = dayNames[next.getUTCDay()];",
    "    if (allowedDays.includes(dn)) { waitMs = next.getTime() - nowSpMs; break; }",
    "  }",
    "}",
    "if (!waitMs || waitMs < 0) waitMs = 0;",
    "const waitSeconds = Math.max(0, Math.ceil(waitMs / 1000));",
    "return [{ json: { waitSeconds, ...$('" + TRIGGER_NODE_NAME + "').item.json } }];"
  ].join('\n')

  return {
    id: makeNodeId(),
    name: 'Calc Espera ' + (time || '').replace(':', 'h'),
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [position.x, position.y],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode }
  }
}

function buildVerifyEmailEventNode(position, eventType, refTemplateId, suffix) {
  // eventType: 'opened' | 'clicked'
  const jsCode = [
    "const triggerData = $('" + TRIGGER_NODE_NAME + "').item.json.body || {};",
    "const email = (triggerData.email || '').toString().toLowerCase().trim();",
    "const templateId = '" + refTemplateId + "';",
    "const eventType = '" + eventType + "';",
    "",
    "let matched = false;",
    "if (email && templateId) {",
    "  try {",
    "    const startedAt = $execution.startedAt && $execution.startedAt.toISO ? $execution.startedAt.toISO() : new Date(Date.now() - 86400000).toISOString();",
    "    const url = '" + SUPABASE_URL + "/rest/v1/email_events' +",
    "      '?email=eq.' + encodeURIComponent(email) +",
    "      '&template_id=eq.' + templateId +",
    "      '&event_type=eq.' + eventType +",
    "      '&event_date=gt.' + encodeURIComponent(startedAt) +",
    "      '&select=email&limit=1';",
    "    const res = await fetch(url, { headers: { apikey: '" + SUPABASE_KEY + "', Authorization: 'Bearer " + SUPABASE_KEY + "' } });",
    "    if (res.ok) {",
    "      const arr = await res.json();",
    "      matched = Array.isArray(arr) && arr.length > 0;",
    "    }",
    "  } catch (e) { console.log('check ' + eventType + ' failed:', e?.message); }",
    "}",
    "return [{ json: { ...$('" + TRIGGER_NODE_NAME + "').item.json, _matched: matched } }];"
  ].join('\n')

  return {
    id: makeNodeId(),
    name: 'Verifica ' + eventType + ' ' + suffix,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [position.x, position.y],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode }
  }
}

function buildVerifyTimeNode(position, operator, time1, time2, suffix) {
  const [h1, m1] = (time1 || '00:00').split(':').map(s => parseInt(s, 10) || 0)
  const [h2, m2] = (time2 || '00:00').split(':').map(s => parseInt(s, 10) || 0)

  const jsCode = [
    "const SP_OFFSET_MIN = -180;",
    "const nowSpMs = Date.now() + SP_OFFSET_MIN * 60000;",
    "const sp = new Date(nowSpMs);",
    "const nowH = sp.getUTCHours();",
    "const nowM = sp.getUTCMinutes();",
    "const nowMin = nowH * 60 + nowM;",
    "const t1Min = " + h1 + " * 60 + " + m1 + ";",
    "const t2Min = " + h2 + " * 60 + " + m2 + ";",
    "const op = '" + operator + "';",
    "",
    "let matched = false;",
    "if (op === 'before') matched = nowMin < t1Min;",
    "else if (op === 'after') matched = nowMin > t1Min;",
    "else if (op === 'between') matched = nowMin >= t1Min && nowMin <= t2Min;",
    "",
    "return [{ json: { ...$('" + TRIGGER_NODE_NAME + "').item.json, _matched: matched } }];"
  ].join('\n')

  return {
    id: makeNodeId(),
    name: 'Verifica horario ' + suffix,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [position.x, position.y],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode }
  }
}

function buildFilterMatchedNode(position, name, expectMatch) {
  const jsCode = "const items = $input.all();\n"
    + "return items.filter(it => " + (expectMatch ? '!!it.json?._matched' : '!it.json?._matched') + ");"

  return {
    id: makeNodeId(),
    name,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [position.x, position.y],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode }
  }
}

function buildWebhookOutNode(position, suffix, params) {
  const { url, method, headers, body_json } = params

  const headerParameters = {
    parameters: (headers || []).filter(h => h?.name).map(h => ({
      name: h.name,
      value: h.value || ''
    }))
  }

  const config = {
    method: method || 'POST',
    url,
    sendHeaders: headerParameters.parameters.length > 0,
    specifyHeaders: 'keypair',
    headerParameters
  }

  if (method !== 'GET' && body_json) {
    // Body com substituição de variáveis: vamos usar Code node antes pra interpolar
    config.sendBody = true
    config.contentType = 'json'
    config.specifyBody = 'json'
    config.jsonBody = '={{ $json._webhookBody }}'
  }

  return {
    id: makeNodeId(),
    name: 'Webhook Out ' + suffix,
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.4,
    position: [position.x, position.y],
    parameters: config
  }
}

function buildWebhookBodyPrepNode(position, suffix, bodyJsonTemplate) {
  // Substitui {{nome}}, {{email}}, {{telefone}} e tenta parsear como JSON
  const jsCode = [
    "const data = $('" + TRIGGER_NODE_NAME + "').item.json.body || {};",
    "const nome = data.name || data.nome || '';",
    "const email = (data.email || '').toString();",
    "let telefone = (data.phoneNumber || data.telefone || '').toString().trim();",
    "if (telefone.startsWith('55') && telefone.length > 11) telefone = telefone.slice(2);",
    "",
    "const tpl = " + JSON.stringify(bodyJsonTemplate || '{}') + ";",
    "const interpolated = tpl",
    "  .replace(/\\{\\{nome\\}\\}/g, JSON.stringify(nome).slice(1, -1))",
    "  .replace(/\\{\\{email\\}\\}/g, JSON.stringify(email).slice(1, -1))",
    "  .replace(/\\{\\{telefone\\}\\}/g, JSON.stringify(telefone).slice(1, -1));",
    "let parsed;",
    "try { parsed = JSON.parse(interpolated); } catch (e) { parsed = { _raw: interpolated }; }",
    "return [{ json: { ...$('" + TRIGGER_NODE_NAME + "').item.json, _webhookBody: parsed } }];"
  ].join('\n')

  return {
    id: makeNodeId(),
    name: 'Prep Webhook ' + suffix,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [position.x, position.y],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode }
  }
}

// ───────────────────────────────────────────────────────────────────────
// Main generator
// ───────────────────────────────────────────────────────────────────────

export function generateN8nWorkflow(automation, templates) {
  const flow = automation.flow_data || { nodes: [], edges: [] }
  const flowNodes = flow.nodes || []
  const flowEdges = flow.edges || []

  const triggerFlow = flowNodes.find(n => n.type === 'trigger')
  if (!triggerFlow) throw new Error('Fluxo sem nó de gatilho.')

  const n8nNodes = []
  const connections = {}

  // Trigger + Verificar Descadastro fixos no início
  const triggerN8n = buildTriggerNode(automation, { x: 240, y: 280 })
  n8nNodes.push(triggerN8n)

  const verificarN8n = buildVerificarDescadastroNode({ x: 460, y: 280 })
  n8nNodes.push(verificarN8n)
  setConnection(connections, triggerN8n.name, verificarN8n.name)

  const logStartN8n = buildLogStartNode(automation.id, { x: 660, y: 280 })
  n8nNodes.push(logStartN8n)
  setConnection(connections, verificarN8n.name, logStartN8n.name)

  // Walk no flow_data a partir do trigger
  const flowNodeMap = new Map(flowNodes.map(n => [n.id, n]))
  const memo = new Map() // flowNodeId -> { entries: [{name, output}], exits: [{name, output, handle?}] }

  let cursorX = 880
  const STEP_X = 240
  const STEP_Y = 180

  function nextPos(yOffset = 0) {
    const pos = { x: cursorX, y: 280 + yOffset }
    cursorX += STEP_X
    return pos
  }

  // expandNode: gera os nós n8n para um flow node, retorna { exits: [{name, output, handle?}] }
  // exits são os pontos onde se pode "continuar" o fluxo. Para nós branching, há 2 exits (handles 'true' e 'false').
  function expandNode(flowNode) {
    const t = flowNode.type
    const sx = shortId(flowNode.id)

    if (t === 'send_email') {
      const tplId = flowNode.data?.template_id
      const buscar = buildBuscarTemplateNode(tplId, nextPos())
      const subst = buildSubstituirNode(tplId, nextPos(), sx)
      const enviar = buildEnviarBrevoNode(nextPos(), sx)
      n8nNodes.push(buscar, subst, enviar)
      setConnection(connections, buscar.name, subst.name)
      setConnection(connections, subst.name, enviar.name)
      return { entry: buscar.name, exits: [{ name: enviar.name, output: 0 }] }
    }

    if (t === 'wait_duration') {
      const wait = buildWaitNode(nextPos(), 'Aguardar ' + sx, flowNode.data?.amount || 30, flowNode.data?.unit || 'minutes')
      n8nNodes.push(wait)
      return { entry: wait.name, exits: [{ name: wait.name, output: 0 }] }
    }

    if (t === 'wait_until_time') {
      const calc = buildCalcWaitUntilNode(nextPos(), flowNode.data?.time, flowNode.data?.behavior || 'send_now', flowNode.data?.days_allowed || [])
      const wait = buildWaitExpressionNode(nextPos(), 'Aguardar ate ' + sx, '={{ $json.waitSeconds }}', 'seconds')
      n8nNodes.push(calc, wait)
      setConnection(connections, calc.name, wait.name)
      return { entry: calc.name, exits: [{ name: wait.name, output: 0 }] }
    }

    if (t === 'condition_opened' || t === 'condition_clicked') {
      const eventType = t === 'condition_opened' ? 'opened' : 'clicked'
      const refNode = flowNodeMap.get(flowNode.data?.reference_node_id)
      const refTemplateId = refNode?.data?.template_id || ''
      const wait = buildWaitNode(nextPos(), 'Aguardar verificacao ' + sx, flowNode.data?.wait_minutes || 0, 'minutes')
      const verify = buildVerifyEmailEventNode(nextPos(), eventType, refTemplateId, sx)
      const filterSim = buildFilterMatchedNode({ x: cursorX, y: 280 - STEP_Y / 2 }, 'Sim ' + sx, true)
      cursorX += STEP_X
      const filterNao = buildFilterMatchedNode({ x: cursorX, y: 280 + STEP_Y / 2 }, 'Nao ' + sx, false)
      cursorX += STEP_X
      n8nNodes.push(wait, verify, filterSim, filterNao)
      setConnection(connections, wait.name, verify.name)
      // Verify -> ambos os filters (mesma saída 0 fanouts pra dois nós)
      setConnection(connections, verify.name, filterSim.name)
      setConnection(connections, verify.name, filterNao.name)
      return {
        entry: wait.name,
        exits: [
          { name: filterSim.name, output: 0, handle: 'true' },
          { name: filterNao.name, output: 0, handle: 'false' }
        ]
      }
    }

    if (t === 'condition_time') {
      const verify = buildVerifyTimeNode(nextPos(), flowNode.data?.operator || 'before', flowNode.data?.time1, flowNode.data?.time2, sx)
      const filterSim = buildFilterMatchedNode({ x: cursorX, y: 280 - STEP_Y / 2 }, 'Sim ' + sx, true)
      cursorX += STEP_X
      const filterNao = buildFilterMatchedNode({ x: cursorX, y: 280 + STEP_Y / 2 }, 'Nao ' + sx, false)
      cursorX += STEP_X
      n8nNodes.push(verify, filterSim, filterNao)
      setConnection(connections, verify.name, filterSim.name)
      setConnection(connections, verify.name, filterNao.name)
      return {
        entry: verify.name,
        exits: [
          { name: filterSim.name, output: 0, handle: 'true' },
          { name: filterNao.name, output: 0, handle: 'false' }
        ]
      }
    }

    if (t === 'webhook_out') {
      const params = flowNode.data || {}
      const needsBody = params.method && params.method !== 'GET' && params.body_json
      if (needsBody) {
        const prep = buildWebhookBodyPrepNode(nextPos(), sx, params.body_json)
        const wh = buildWebhookOutNode(nextPos(), sx, params)
        n8nNodes.push(prep, wh)
        setConnection(connections, prep.name, wh.name)
        return { entry: prep.name, exits: [{ name: wh.name, output: 0 }] }
      } else {
        const wh = buildWebhookOutNode(nextPos(), sx, params)
        n8nNodes.push(wh)
        return { entry: wh.name, exits: [{ name: wh.name, output: 0 }] }
      }
    }

    if (t === 'end') {
      const logEnd = buildLogEndNode(nextPos(), sx)
      n8nNodes.push(logEnd)
      return { entry: logEnd.name, exits: [{ name: logEnd.name, output: 0 }] }
    }

    if (t === 'trigger') {
      // não deveria ser chamado
      return { entry: null, exits: [] }
    }

    return { entry: null, exits: [] }
  }

  // appendChain: percorre flow_data e gera + conecta n8n nodes
  function appendChain(flowNodeId, parentName, parentOutput) {
    const flowNode = flowNodeMap.get(flowNodeId)
    if (!flowNode) return

    let block = memo.get(flowNodeId)
    if (!block) {
      block = expandNode(flowNode)
      memo.set(flowNodeId, block)

      // Conectar entry à parente (única vez — primeira visita)
      if (block.entry && parentName) {
        setConnection(connections, parentName, block.entry, parentOutput)
      }

      // Recurse: para cada exit, segue as edges
      for (const exit of block.exits) {
        const outgoing = flowEdges.filter(e => e.source === flowNodeId && (!exit.handle || e.sourceHandle === exit.handle))
        for (const edge of outgoing) {
          appendChain(edge.target, exit.name, exit.output)
        }
      }
    } else {
      // Já existe — conecta o parent ao entry deste bloco (evita ciclos seguidores via memo)
      if (block.entry && parentName) {
        setConnection(connections, parentName, block.entry, parentOutput)
      }
    }
  }

  // Ponto de partida: primeiro nó depois do trigger conecta após Log Start
  const trigOutgoing = flowEdges.filter(e => e.source === triggerFlow.id)
  for (const edge of trigOutgoing) {
    appendChain(edge.target, logStartN8n.name, 0)
  }

  return {
    name: 'ET | ' + automation.name,
    nodes: n8nNodes,
    connections,
    settings: { executionOrder: 'v1', availableInMCP: true }
  }
}
