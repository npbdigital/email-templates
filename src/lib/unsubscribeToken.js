const SECRET = import.meta.env.VITE_UNSUBSCRIBE_SECRET || ''

function bytesToHex(bytes) {
  let s = ''
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, '0')
  }
  return s
}

export async function generateToken(email) {
  if (!SECRET) throw new Error('VITE_UNSUBSCRIBE_SECRET não configurado')
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(email.toLowerCase()))
  return bytesToHex(new Uint8Array(sig)).slice(0, 32)
}

export async function validateToken(email, token) {
  if (!email || !token) return false
  try {
    const expected = await generateToken(email)
    if (expected.length !== token.length) return false
    let diff = 0
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ token.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}
