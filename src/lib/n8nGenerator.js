const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const SECRET = import.meta.env.VITE_UNSUBSCRIBE_SECRET || ''
const BREVO_KEY = import.meta.env.VITE_BREVO_API_KEY || ''

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

  for (const n of nodes) {
    if (n.type === 'send_email') {
      if (!n.data?.template_id) {
        issues.push(`um nó "Enviar e-mail" está sem template`)
        continue
      }
      const exists = (templates || []).some(t => t.id === n.data.template_id)
      if (!exists) issues.push(`um nó "Enviar e-mail" usa um template que não existe mais`)
    }
  }

  const hasSendEmail = nodes.some(n => n.type === 'send_email')
  if (hasSendEmail && !BREVO_KEY) issues.push('VITE_BREVO_API_KEY não configurado')

  return issues
}

function buildSendEmailJsCode(templateId) {
  return [
    "const data = $('Receber Trigger').item.json.body || {};",
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
    "  .update(email.toLowerCase())",
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
}

function supabaseHeaders() {
  return [
    { name: 'apikey', value: SUPABASE_KEY },
    { name: 'Authorization', value: 'Bearer ' + SUPABASE_KEY }
  ]
}

function makeNodeId() {
  return 'n8n_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36)
}

function buildTriggerNode(automation, position) {
  return {
    id: makeNodeId(),
    name: 'Receber Trigger',
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

function buildVerificarDescadastroNode(position) {
  const jsCode = [
    "const triggerData = $('Receber Trigger').item.json.body || {};",
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
    "    console.log('verificar descadastro falhou, tratando como nao descadastrado:', e?.message);",
    "  }",
    "}",
    "return [{ json: { email, unsubscribed } }];"
  ].join('\n')

  return {
    id: makeNodeId(),
    name: 'Verificar Descadastro',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [position.x, position.y],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode
    }
  }
}

function buildEstaDescadastradoIf(position) {
  return {
    id: makeNodeId(),
    name: 'Esta Descadastrado?',
    type: 'n8n-nodes-base.if',
    typeVersion: 2.3,
    position: [position.x, position.y],
    parameters: {
      conditions: {
        conditions: [{
          leftValue: '={{ $json.unsubscribed }}',
          operator: { type: 'boolean', operation: 'true', singleValue: true }
        }]
      },
      looseTypeValidation: true
    }
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
  return {
    id: makeNodeId(),
    name: 'Substituir Vars ' + suffix,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [position.x, position.y],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: buildSendEmailJsCode(templateId)
    }
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

function buildLeadDescadastradoNode(position) {
  return {
    id: makeNodeId(),
    name: 'Lead Descadastrado Ignorar',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [position.x, position.y],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "const email = $('Receber Trigger').item.json.body?.email || '';\nconsole.log('Lead descadastrado, ignorado:', email);\nreturn [{ json: { status: 'ignorado', motivo: 'descadastrado', email } }];"
    }
  }
}

function setConnection(conns, fromName, toName, output = 0) {
  if (!conns[fromName]) conns[fromName] = { main: [] }
  while (conns[fromName].main.length <= output) conns[fromName].main.push([])
  conns[fromName].main[output].push({ node: toName, type: 'main', index: 0 })
}

export function generateN8nWorkflow(automation, templates) {
  const flow = automation.flow_data || { nodes: [], edges: [] }
  const flowNodes = flow.nodes || []
  const flowEdges = flow.edges || []

  const triggerFlow = flowNodes.find(n => n.type === 'trigger')
  if (!triggerFlow) throw new Error('Fluxo sem nó de gatilho.')

  const n8nNodes = []
  const connections = {}

  const triggerN8n = buildTriggerNode(automation, { x: 240, y: 280 })
  n8nNodes.push(triggerN8n)

  const verificarN8n = buildVerificarDescadastroNode({ x: 460, y: 280 })
  n8nNodes.push(verificarN8n)
  setConnection(connections, triggerN8n.name, verificarN8n.name)

  const estaDescIf = buildEstaDescadastradoIf({ x: 680, y: 280 })
  n8nNodes.push(estaDescIf)
  setConnection(connections, verificarN8n.name, estaDescIf.name)

  const leadDesc = buildLeadDescadastradoNode({ x: 900, y: 120 })
  n8nNodes.push(leadDesc)
  setConnection(connections, estaDescIf.name, leadDesc.name, 0)

  // Connection point para o "false" branch (não descadastrado): será o último nó da cadeia descendente
  const lastInDescPath = { name: estaDescIf.name, output: 1 }

  // Walk no flow_data a partir do trigger, gerando nós n8n
  const visited = new Set()
  const flowNodeMap = new Map(flowNodes.map(n => [n.id, n]))

  let cursorX = 900
  let cursorY = 360
  const STEP_X = 260
  const STEP_Y = 0

  let prevName = null

  function appendChain(flowNodeId, parentN8nName, parentOutput) {
    if (visited.has(flowNodeId)) return
    visited.add(flowNodeId)
    const flowNode = flowNodeMap.get(flowNodeId)
    if (!flowNode) return

    if (flowNode.type === 'send_email') {
      const tplId = flowNode.data?.template_id
      const suffix = (tplId || 'unknown').slice(0, 6)

      const buscar = buildBuscarTemplateNode(tplId, { x: cursorX, y: cursorY })
      n8nNodes.push(buscar)
      setConnection(connections, parentN8nName, buscar.name, parentOutput)
      cursorX += STEP_X

      const subst = buildSubstituirNode(tplId, { x: cursorX, y: cursorY }, suffix)
      n8nNodes.push(subst)
      setConnection(connections, buscar.name, subst.name)
      cursorX += STEP_X

      const enviar = buildEnviarBrevoNode({ x: cursorX, y: cursorY }, suffix)
      n8nNodes.push(enviar)
      setConnection(connections, subst.name, enviar.name)
      cursorX += STEP_X
      cursorY += STEP_Y

      prevName = enviar.name

      const nextEdges = flowEdges.filter(e => e.source === flowNodeId)
      for (const edge of nextEdges) {
        appendChain(edge.target, enviar.name, 0)
      }
    } else if (flowNode.type === 'end') {
      // nada — termina a cadeia
      prevName = parentN8nName
    } else if (flowNode.type === 'trigger') {
      // não deveria cair aqui (trigger é raiz)
    }
  }

  // Pega o que sai do trigger (no flow visual) e inicia a cadeia partindo do "false" do IF de descadastro
  const trigOutgoing = flowEdges.filter(e => e.source === triggerFlow.id)
  for (const edge of trigOutgoing) {
    appendChain(edge.target, lastInDescPath.name, lastInDescPath.output)
  }

  return {
    name: 'ET | ' + automation.name,
    nodes: n8nNodes,
    connections,
    settings: { executionOrder: 'v1' }
  }
}
