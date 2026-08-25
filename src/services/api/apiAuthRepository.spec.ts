import { describe, expect, it, vi } from 'vitest'
import { ApiAuthRepository } from './apiAuthRepository'

const user = {
  id: 'user-1',
  firstName: 'Аян',
  lastName: 'Серікұлы',
  city: 'Алматы',
  phone: '+77011234567',
  role: 'student',
  createdAt: '2026-08-25T10:00:00Z',
}

describe('ApiAuthRepository', () => {
  it('registers with credentials and decodes the safe user DTO', async () => {
    let capturedInit: RequestInit | undefined
    const client = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedInit = init
      return new Response(JSON.stringify(user), { status: 200 })
    }) as unknown as typeof fetch
    const repository = new ApiAuthRepository('https://api.example.test/', client)

    await expect(
      repository.register({
        firstName: 'Аян',
        lastName: 'Серікұлы',
        city: 'Алматы',
        phone: '+77011234567',
        password: 'strong-pass',
      }),
    ).resolves.toEqual(user)

    expect(capturedInit?.credentials).toBe('include')
    expect(JSON.parse(String(capturedInit?.body))).toEqual({
      firstName: 'Аян',
      lastName: 'Серікұлы',
      city: 'Алматы',
      phone: '+77011234567',
      password: 'strong-pass',
    })
  })

  it('maps every credential failure to one generic Kazakh error', async () => {
    const client = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ code: 'INVALID_CREDENTIALS' }), { status: 401 }),
    ) as unknown as typeof fetch
    const repository = new ApiAuthRepository('https://api.example.test', client)

    await expect(
      repository.login({ phone: '+77010000000', password: 'wrong-password' }),
    ).rejects.toMatchObject({
      code: 'invalid-credentials',
      message: 'Телефон нөмірі немесе құпиясөз қате',
    })
  })
})
