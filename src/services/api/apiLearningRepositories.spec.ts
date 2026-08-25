import { describe, expect, it, vi } from 'vitest'
import { ApiDiagnosticRepository } from './apiDiagnosticRepository'
import { ApiSubjectRepository } from './apiSubjectRepository'

describe('server-backed learning repositories', () => {
  it('loads canonical subjects and diagnostic questions with cookie credentials', async () => {
    const client = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 'history-kz', name: 'Қазақстан тарихы' }]), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            { id: 'history-1', topic: 'Қазақ хандығы', text: 'Сұрақ', options: ['A', 'B'] },
          ]),
          { status: 200 },
        ),
      )
    const subjects = new ApiSubjectRepository('/api', client)
    const diagnostic = new ApiDiagnosticRepository('/api', client)

    await expect(subjects.getSubjects()).resolves.toEqual([
      { id: 'history-kz', name: 'Қазақстан тарихы' },
    ])
    await expect(diagnostic.getQuestions('history-kz')).resolves.toHaveLength(1)
    expect(client).toHaveBeenNthCalledWith(1, '/api/subjects', { credentials: 'include' })
    expect(client).toHaveBeenNthCalledWith(2, '/api/diagnostic/history-kz', {
      credentials: 'include',
    })
  })

  it('sends a stable operation ID with diagnostic answers', async () => {
    const client = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          attemptId: 'attempt-1',
          total: 5,
          correct: 0,
          insufficientData: true,
          answers: [],
        }),
        { status: 200 },
      ),
    )
    const repository = new ApiDiagnosticRepository('/api', client)
    await repository.submit('history-kz', {
      operationId: 'session-stable-id',
      answers: [{ questionId: 'history-1', selectedIndex: 0 }],
    })
    expect(JSON.parse(String(client.mock.calls[0]?.[1]?.body))).toEqual({
      operationId: 'session-stable-id',
      answers: [{ questionId: 'history-1', selectedIndex: 0 }],
    })
  })

  it('checks one answer on the server without receiving an answer key in the question list', async () => {
    const checked = {
      questionId: 'history-1',
      selectedIndex: 0,
      isCorrect: true,
      correctIndex: 0,
      explanation: 'Түсіндірме',
    }
    const client = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify(checked), { status: 200 }))
    const repository = new ApiDiagnosticRepository('/api', client)

    await expect(
      repository.checkAnswer('history-kz', {
        operationId: 'session-stable-id',
        questionId: 'history-1',
        selectedIndex: 0,
      }),
    ).resolves.toEqual(checked)
    expect(client).toHaveBeenCalledWith('/api/diagnostic/history-kz/check', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operationId: 'session-stable-id',
        questionId: 'history-1',
        selectedIndex: 0,
      }),
    })
  })
})
