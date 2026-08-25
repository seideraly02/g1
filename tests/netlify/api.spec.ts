import { describe, expect, it, vi } from 'vitest'
import { createHandler } from '../../netlify/functions/api.mjs'
import { ApiError, readConfig } from '../../netlify/functions/lib/qadam-api.mjs'

const user = {
  id: '8d92d2c7-42aa-4b76-bd68-8a955097f9ec',
  firstName: 'Аян',
  lastName: 'Серікұлы',
  city: 'Алматы',
  phone: '+77015550101',
  role: 'student',
  createdAt: '2026-08-25T12:00:00.000Z',
}

function event(path: string, init: Record<string, unknown> = {}) {
  return {
    httpMethod: 'GET',
    headers: { host: 'qadam.netlify.app', 'x-nf-client-connection-ip': '203.0.113.1' },
    queryStringParameters: { path },
    ...init,
  }
}

function fakeApi() {
  return {
    config: { sessionTtlDays: 30 },
    register: vi.fn(async () => ({ sessionToken: 'register-token', user })),
    login: vi.fn(async () => ({ sessionToken: 'login-token', user })),
    session: vi.fn(async (token: string | null) => (token === 'valid-token' ? user : null)),
    logout: vi.fn(async () => undefined),
    subjects: vi.fn(async () => [{ id: 'history-kz', name: 'Қазақстан тарихы' }]),
    adminOverview: vi.fn(async (currentUser: typeof user) => {
      if (currentUser.role !== 'admin') throw new ApiError(403, 'FORBIDDEN')
      return { totalUsers: 1, onlineUsers: 1, offlineUsers: 0 }
    }),
    adminUsers: vi.fn(async (currentUser: typeof user) => {
      if (currentUser.role !== 'admin') throw new ApiError(403, 'FORBIDDEN')
      return { users: [], page: 1, limit: 20, total: 0 }
    }),
    createAdminQuestion: vi.fn(async (currentUser: typeof user) => {
      if (currentUser.role !== 'admin') throw new ApiError(403, 'FORBIDDEN')
      return { id: 'question-1' }
    }),
    questions: vi.fn(async () => [{ id: 'history-1' }]),
    checkDiagnosticAnswer: vi.fn(async () => ({
      questionId: 'history-1',
      selectedIndex: 0,
      isCorrect: true,
      correctIndex: 0,
      explanation: 'Түсіндірме',
    })),
    submitDiagnostic: vi.fn(async () => ({ attemptId: 'attempt-1', total: 5, correct: 5 })),
  }
}

describe('Netlify API function', () => {
  it('registers with the existing contract and emits a production HttpOnly cookie', async () => {
    const api = fakeApi()
    const handler = createHandler({ getApi: () => api, env: { CONTEXT: 'production' } })
    const body = {
      firstName: 'Аян',
      lastName: 'Серікұлы',
      city: 'Алматы',
      phone: '+77015550101',
      password: 'strong-password',
    }
    const result = await handler(
      event('auth/register', { httpMethod: 'POST', body: JSON.stringify(body) }),
    )

    expect(result.statusCode).toBe(200)
    expect(JSON.parse(result.body)).toEqual(user)
    expect(api.register).toHaveBeenCalledWith(body, '203.0.113.1')
    expect(result.multiValueHeaders['set-cookie'][0]).toContain('HttpOnly')
    expect(result.multiValueHeaders['set-cookie'][0]).toContain('Secure')
    expect(result.multiValueHeaders['set-cookie'][0]).toContain('SameSite=Lax')
    expect(result.multiValueHeaders['set-cookie'][0]).not.toContain('strong-password')
  })

  it('keeps login failures generic and rejects cross-origin mutations', async () => {
    const api = fakeApi()
    api.login.mockRejectedValue(new ApiError(401, 'INVALID_CREDENTIALS'))
    const handler = createHandler({ getApi: () => api })
    const failed = await handler(
      event('auth/login', { httpMethod: 'POST', body: '{"phone":"bad","password":"bad"}' }),
    )
    expect(failed.statusCode).toBe(401)
    expect(JSON.parse(failed.body)).toEqual({ code: 'INVALID_CREDENTIALS' })

    const crossOrigin = await handler(
      event('auth/login', {
        httpMethod: 'POST',
        body: '{}',
        headers: { host: 'qadam.netlify.app', origin: 'https://evil.example' },
      }),
    )
    expect(crossOrigin.statusCode).toBe(403)
  })

  it('protects session, subjects, and diagnostic routes with the cookie session', async () => {
    const api = fakeApi()
    const handler = createHandler({ getApi: () => api })
    expect((await handler(event('subjects'))).statusCode).toBe(401)

    const headers = { host: 'qadam.netlify.app', cookie: 'qadam_session=valid-token' }
    expect((await handler(event('auth/session', { headers }))).statusCode).toBe(200)
    expect((await handler(event('subjects', { headers }))).statusCode).toBe(200)
    expect((await handler(event('diagnostic/history-kz', { headers }))).statusCode).toBe(200)
    const checked = await handler(
      event('diagnostic/history-kz/check', {
        httpMethod: 'POST',
        headers,
        body: JSON.stringify({
          operationId: 'session-handler-test',
          questionId: 'history-1',
          selectedIndex: 0,
        }),
      }),
    )
    expect(checked.statusCode).toBe(200)
    expect(JSON.parse(checked.body)).toMatchObject({ questionId: 'history-1', isCorrect: true })
    expect(api.checkDiagnosticAnswer).toHaveBeenCalledWith(
      'history-kz',
      {
        operationId: 'session-handler-test',
        questionId: 'history-1',
        selectedIndex: 0,
      },
      user.id,
    )
    expect(
      (
        await handler(
          event('diagnostic/history-kz/submit', {
            httpMethod: 'POST',
            headers,
            body: JSON.stringify({ answers: [] }),
          }),
        )
      ).statusCode,
    ).toBe(200)
  })

  it('revokes logout and expires the session cookie', async () => {
    const api = fakeApi()
    const handler = createHandler({ getApi: () => api, env: { CONTEXT: 'production' } })
    const result = await handler(
      event('auth/session', {
        httpMethod: 'DELETE',
        headers: { host: 'qadam.netlify.app', cookie: 'qadam_session=valid-token' },
      }),
    )
    expect(result.statusCode).toBe(204)
    expect(api.logout).toHaveBeenCalledWith('valid-token')
    expect(result.multiValueHeaders['set-cookie'][0]).toContain('Max-Age=0')

    const repeated = await handler(event('auth/session', { httpMethod: 'DELETE' }))
    expect(repeated.statusCode).toBe(204)
  })

  it('enforces admin role for overview and question creation routes', async () => {
    const api = fakeApi()
    const handler = createHandler({ getApi: () => api })
    const headers = { host: 'qadam.netlify.app', cookie: 'qadam_session=valid-token' }
    expect((await handler(event('admin/overview', { headers }))).statusCode).toBe(403)

    api.session.mockResolvedValue({ ...user, role: 'admin' })
    const overview = await handler(event('admin/overview', { headers }))
    expect(overview.statusCode).toBe(200)
    const created = await handler(
      event('admin/questions', {
        httpMethod: 'POST',
        headers,
        body: JSON.stringify({ subjectId: 'history-kz' }),
      }),
    )
    expect(created.statusCode).toBe(201)
    expect(api.createAdminQuestion).toHaveBeenCalledWith(
      { ...user, role: 'admin' },
      { subjectId: 'history-kz' },
    )
  })
})

describe('Netlify API production configuration', () => {
  it('fails closed for weak secrets and unsafe BCrypt cost', () => {
    expect(() => readConfig({ QADAM_SECURITY_PEPPER: 'short' })).toThrow()
    expect(() =>
      readConfig({ QADAM_SECURITY_PEPPER: 'x'.repeat(32), PASSWORD_BCRYPT_STRENGTH: '9' }),
    ).toThrow()
  })
})
