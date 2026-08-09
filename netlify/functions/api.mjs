const SKIPPED_REQUEST_HEADERS = new Set([
  'host',
  'content-length',
  'origin',
  'connection',
  'transfer-encoding',
])

const SKIPPED_RESPONSE_HEADERS = new Set([
  'set-cookie',
  'content-length',
  'content-encoding',
  'transfer-encoding',
  'connection',
])

function json(statusCode, code) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ code }),
  }
}

function sameOriginRequest(event) {
  const origin = event.headers?.origin
  const host = event.headers?.host
  if (!origin || !host) return true
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export async function handler(event) {
  const backend = (process.env.BACKEND_API_URL ?? '').replace(/\/+$/, '')
  if (!backend) return json(503, 'BACKEND_NOT_CONFIGURED')

  if (!sameOriginRequest(event)) return json(403, 'ORIGIN_NOT_ALLOWED')

  const path = event.queryStringParameters?.path ?? ''
  const query = new URLSearchParams(event.queryStringParameters ?? {})
  query.delete('path')

  let target = `${backend}/${path.replace(/^\/+/, '')}`
  const queryString = query.toString()
  if (queryString) target += `?${queryString}`

  const headers = new Headers()
  for (const [name, value] of Object.entries(event.headers ?? {})) {
    if (!value || SKIPPED_REQUEST_HEADERS.has(name.toLowerCase())) continue
    headers.set(name, value)
  }
  headers.set('x-forwarded-host', event.headers?.host ?? '')
  headers.set('x-forwarded-proto', 'https')

  const method = event.httpMethod ?? 'GET'
  let body
  if (method !== 'GET' && method !== 'HEAD' && event.body != null) {
    body = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body
  }

  let response
  try {
    response = await fetch(target, { method, headers, body, redirect: 'manual' })
  } catch {
    return json(502, 'BACKEND_UNAVAILABLE')
  }

  const responseHeaders = {}
  response.headers.forEach((value, name) => {
    if (!SKIPPED_RESPONSE_HEADERS.has(name.toLowerCase())) {
      responseHeaders[name] = value
    }
  })

  const setCookies =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : response.headers.get('set-cookie')
        ? [response.headers.get('set-cookie')]
        : []

  return {
    statusCode: response.status,
    headers: responseHeaders,
    multiValueHeaders: setCookies.length ? { 'set-cookie': setCookies } : undefined,
    body: await response.text(),
  }
}
