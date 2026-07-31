import { beforeEach, describe, expect, it } from 'vitest'
import { PersistenceService, type StorageAdapter } from '../../services/persistenceService'
import {
  getTrialTrainingSession,
  resetDefaultSessionRepository,
  saveTrialTrainingAnswer,
  startTrialTraining,
} from '../session/sessionApplication'
import { signOutAccount } from './accountSession'

class MemoryStorage implements StorageAdapter {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }
}

describe('signOutAccount', () => {
  let persistence: PersistenceService

  beforeEach(() => {
    persistence = new PersistenceService(new MemoryStorage())
    resetDefaultSessionRepository(persistence)
  })

  it('removes persisted and in-memory learning sessions', () => {
    const session = startTrialTraining(['math'], ['question-1'], 0)
    saveTrialTrainingAnswer({
      sessionId: session.id,
      questionId: 'question-1',
      subjectId: 'math',
      selectedOptionId: 'A',
      isSkipped: false,
      answeredAt: '2026-07-31T12:01:00.000Z',
    })

    signOutAccount(persistence)

    expect(getTrialTrainingSession()).toBeNull()
  })
})
