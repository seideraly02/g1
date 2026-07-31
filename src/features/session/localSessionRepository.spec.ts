import { describe, expect, it } from 'vitest'
import { PersistenceService, type StorageAdapter } from '../../services/persistenceService'
import { createLocalSessionRepository } from './localSessionRepository'
import { discardTrialSession } from './sessionApplication'

class MemoryStorage implements StorageAdapter {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

describe('LocalSessionRepository.deleteSession', () => {
  it('permanently removes an unfinished trial and its answers', () => {
    const storage = new MemoryStorage()
    const repository = createLocalSessionRepository(
      new PersistenceService(storage),
      () => 'trial-to-discard',
    )
    const session = repository.createSession({
      type: 'trial',
      selectedSubjectIds: ['math'],
      questionIds: ['question-1'],
      startedAt: '2026-07-31T12:00:00.000Z',
    })

    repository.saveAnswer({
      sessionId: session.id,
      questionId: 'question-1',
      subjectId: 'math',
      selectedOptionId: 'A',
      isSkipped: false,
      answeredAt: '2026-07-31T12:01:00.000Z',
    })

    expect(repository.deleteSession(session.id)).toBe(true)

    const reloadedRepository = createLocalSessionRepository(new PersistenceService(storage))
    expect(reloadedRepository.getSession(session.id)).toBeNull()
    expect(reloadedRepository.getActiveSession('trial')).toBeNull()
    expect(reloadedRepository.getSessions()).toHaveLength(0)
  })

  it('does not change persistence when the session was already removed', () => {
    const repository = createLocalSessionRepository(new PersistenceService(new MemoryStorage()))

    expect(repository.deleteSession('missing-session')).toBe(false)
  })
})

describe('discardTrialSession', () => {
  it('removes only unfinished trial sessions', () => {
    const repository = createLocalSessionRepository(
      new PersistenceService(new MemoryStorage()),
      () => 'trial-session',
    )
    const trial = repository.createSession({
      type: 'trial',
      selectedSubjectIds: ['math'],
      questionIds: ['question-1'],
      startedAt: '2026-07-31T12:00:00.000Z',
    })

    expect(discardTrialSession(repository, trial.id)).toBe(true)
    expect(discardTrialSession(repository, trial.id)).toBe(false)
  })

  it('keeps completed trial results', () => {
    const repository = createLocalSessionRepository(
      new PersistenceService(new MemoryStorage()),
      () => 'completed-trial',
    )
    const trial = repository.createSession({
      type: 'trial',
      selectedSubjectIds: ['math'],
      questionIds: ['question-1'],
      startedAt: '2026-07-31T12:00:00.000Z',
    })
    repository.completeSession(trial.id, '2026-07-31T12:10:00.000Z')

    expect(discardTrialSession(repository, trial.id)).toBe(false)
    expect(repository.getSession(trial.id)?.status).toBe('completed')
  })
})
