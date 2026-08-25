import { getConnectionString } from '@netlify/database'
import pg from 'pg'
import { ApiError, QadamApi, readConfig } from './lib/qadam-api.mjs'

const { Pool } = pg
const SESSION_COOKIE = 'qadam_session'
const MAX_BODY_BYTES = 16 * 1024
let productionApi

function getProductionApi() {
  if (productionApi) return productionApi
  const pool = new Pool({
    connectionString: getConnectionString(),
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  })
  productionApi = new QadamApi(pool, readConfig())
  return productionApi
}

export function createHandler({ getApi = getProductionApi, env = process.env } = {}) {
  return async function apiHandler(event) {
    if (!sameOriginRequest(event)) return json(403, 'ORIGIN_NOT_ALLOWED')
    const method = event.httpMethod ?? 'GET'
    const path = normalizePath(event.queryStringParameters?.path ?? '')

    try {
      const api = getApi()
      if (method === 'GET' && path === 'health') {
        await api.subjects()
        return response(200, { status: 'ok', database: 'ok' })
      }
      if (method === 'POST' && path === 'auth/register') {
        const result = await api.register(parseBody(event), clientAddress(event))
        return authenticated(result, cookieOptions(env, api.config.sessionTtlDays))
      }
      if (method === 'POST' && path === 'auth/login') {
        const result = await api.login(parseBody(event), clientAddress(event))
        return authenticated(result, cookieOptions(env, api.config.sessionTtlDays))
      }

      const token = readCookie(event.headers?.cookie, SESSION_COOKIE)
      if (method === 'DELETE' && path === 'auth/session') {
        await api.logout(token)
        return {
          statusCode: 204,
          headers: { 'cache-control': 'no-store' },
          multiValueHeaders: {
            'set-cookie': [serializeSessionCookie('', { ...cookieOptions(env, 0), maxAge: 0 })],
          },
          body: '',
        }
      }
      const user = await api.session(token)
      if (!user) return json(401, 'UNAUTHENTICATED')

      if (method === 'GET' && path === 'auth/session') {
        return response(200, user, { 'cache-control': 'no-store' })
      }
      if (method === 'GET' && path === 'subjects') {
        return response(200, await api.subjects())
      }

      const diagnosticMatch = /^diagnostic\/([a-z0-9-]{1,50})(\/(?:check|submit))?$/.exec(path)
      if (diagnosticMatch && method === 'GET' && !diagnosticMatch[2]) {
        return response(200, await api.questions(diagnosticMatch[1]))
      }
      if (diagnosticMatch && method === 'POST' && diagnosticMatch[2]) {
        if (diagnosticMatch[2] === '/check') {
          return response(
            200,
            await api.checkDiagnosticAnswer(diagnosticMatch[1], parseBody(event), user.id),
          )
        }
        return response(
          200,
          await api.submitDiagnostic(diagnosticMatch[1], parseBody(event), user.id),
        )
      }
      return json(404, 'NOT_FOUND')
    } catch (error) {
      if (error instanceof ApiError) return json(error.statusCode, error.code)
      return json(503, 'SERVICE_UNAVAILABLE')
    }
  }
}

export const handler = createHandler()

function authenticated(result, options) {
  return {
    ...response(200, result.user, { 'cache-control': 'no-store' }),
    multiValueHeaders: {
      'set-cookie': [serializeSessionCookie(result.sessionToken, options)],
    },
  }
}

function parseBody(event) {
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body ?? '', 'base64').toString('utf8')
    : (event.body ?? '')
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) throw new ApiError(400, 'VALIDATION_ERROR')
  try {
    const value = JSON.parse(raw)
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error('object required')
    return value
  } catch {
    throw new ApiError(400, 'VALIDATION_ERROR')
  }
}

function response(statusCode, value, headers = {}) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
    body: JSON.stringify(value),
  }
}

function json(statusCode, code) {
  return response(statusCode, { code }, { 'cache-control': 'no-store' })
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

function clientAddress(event) {
  return (
    event.headers?.['x-nf-client-connection-ip'] ??
    event.requestContext?.identity?.sourceIp ??
    event.requestContext?.http?.sourceIp ??
    'unknown'
  )
}

function normalizePath(value) {
  return value.replace(/^\/+|\/+$/g, '')
}

function readCookie(header, name) {
  if (!header) return null
  for (const part of header.split(';')) {
    const separator = part.indexOf('=')
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue
    try {
      return decodeURIComponent(part.slice(separator + 1).trim())
    } catch {
      return null
    }
  }
  return null
}

function cookieOptions(env, sessionTtlDays) {
  const localDevelopment = env.CONTEXT === 'dev' || env.NETLIFY_DEV === 'true'
  return { secure: !localDevelopment, maxAge: sessionTtlDays * 86_400 }
}

function serializeSessionCookie(value, { secure, maxAge }) {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}
