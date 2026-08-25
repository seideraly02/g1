import { describe, expect, it, vi } from 'vitest'
import { AdminApiError, ApiAdminRepository } from './apiAdminRepository'

describe('ApiAdminRepository', () => {
  it('invokes a browser fetch client without rebinding its receiver', async () => {
    const client = vi.fn(function (this: unknown) {
      expect(this).toBeUndefined()
      return Promise.resolve(
        new Response(
          JSON.stringify({
            totalUsers: 1,
            onlineUsers: 1,
            offlineUsers: 0,
            recentRegistrations: 1,
            diagnosticAttempts: 0,
            recentDiagnosticAttempts: 0,
          }),
          { status: 200 },
        ),
      )
    }) as unknown as typeof fetch

    await expect(new ApiAdminRepository('/api', client).getOverview()).resolves.toMatchObject({
      totalUsers: 1,
    })
  })

  it('loads validated overview and paginated users with cookie credentials', async () => {
    const client = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            totalUsers: 10,
            onlineUsers: 2,
            offlineUsers: 8,
            recentRegistrations: 3,
            diagnosticAttempts: 7,
            recentDiagnosticAttempts: 4,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            users: [
              {
                id: 'user-1',
                firstName: 'Аян',
                lastName: 'Серікұлы',
                city: 'Алматы',
                phone: '+77011234567',
                role: 'student',
                createdAt: '2026-08-25T10:00:00.000Z',
              },
            ],
            page: 2,
            limit: 20,
            total: 21,
          }),
          { status: 200 },
        ),
      )
    const repository = new ApiAdminRepository('/api', client)

    await expect(repository.getOverview()).resolves.toMatchObject({
      totalUsers: 10,
      onlineUsers: 2,
    })
    await expect(repository.getUsers('Аян', 2, 20)).resolves.toMatchObject({ page: 2, total: 21 })
    expect(client).toHaveBeenNthCalledWith(1, '/api/admin/overview', { credentials: 'include' })
    expect(client.mock.calls[1]?.[0]).toBe(
      '/api/admin/users?query=%D0%90%D1%8F%D0%BD&page=2&limit=20',
    )
  })

  it('creates a question and keeps the answer key only in the admin contract', async () => {
    const created = {
      id: 'question-1',
      subjectId: 'history-kz',
      topic: 'Тақырып',
      text: 'Сұрақ мәтіні жеткілікті',
      options: ['Бір', 'Екі'],
      correctIndex: 1,
      explanation: 'Толық түсіндірме',
      createdAt: '2026-08-25T10:00:00.000Z',
    }
    const client = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify(created), { status: 201 }))
    const repository = new ApiAdminRepository('/api', client)
    const input = {
      subjectId: created.subjectId,
      topic: created.topic,
      text: created.text,
      options: created.options,
      correctIndex: created.correctIndex,
      explanation: created.explanation,
    }

    await expect(repository.createQuestion(input)).resolves.toEqual(created)
    expect(client.mock.calls[0]?.[1]).toMatchObject({ method: 'POST', credentials: 'include' })
    expect(JSON.parse(String(client.mock.calls[0]?.[1]?.body))).toEqual(input)
  })

  it('distinguishes forbidden access from an invalid response', async () => {
    const forbidden = new ApiAdminRepository(
      '/api',
      vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 403 })),
    )
    await expect(forbidden.getOverview()).rejects.toEqual(new AdminApiError('forbidden'))
  })
})
