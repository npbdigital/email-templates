import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const N8N_BASE = (Deno.env.get('N8N_BASE_URL') ?? 'https://estruturamais-felipesemp-marketing-n8n.ruvmao.easypanel.host').replace(/\/+$/, '')
const N8N_API_KEY = Deno.env.get('N8N_API_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'method_not_allowed' })
  }

  if (!N8N_API_KEY) {
    return jsonResponse(500, { error: 'n8n_api_key_not_configured' })
  }

  let payload: { method?: string; path?: string; body?: unknown }
  try {
    payload = await req.json()
  } catch {
    return jsonResponse(400, { error: 'invalid_json' })
  }

  const method = (payload.method || 'GET').toUpperCase()
  const path = payload.path || ''
  const body = payload.body

  if (!path.startsWith('/api/v1/')) {
    return jsonResponse(400, { error: 'invalid_path', detail: 'path must start with /api/v1/' })
  }

  const url = `${N8N_BASE}${path}`

  let upstream: Response
  try {
    upstream = await fetch(url, {
      method,
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: body !== undefined && method !== 'GET' && method !== 'DELETE' ? JSON.stringify(body) : undefined
    })
  } catch (e) {
    return jsonResponse(502, { error: 'upstream_unreachable', detail: String(e) })
  }

  const text = await upstream.text()
  const contentType = upstream.headers.get('content-type') || 'application/json'

  return new Response(text || '{}', {
    status: upstream.status,
    headers: { ...corsHeaders, 'Content-Type': contentType }
  })
})
