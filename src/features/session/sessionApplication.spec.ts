import { afterEach, describe, expect, it } from 'vitest'
import { PersistenceService, type StorageAdapter } from '../../services/persistenceService'
import {
  completeGuestDiagnostic,
  getGuestDiagnosticRecord,
  getGuestDiagnosticSession,
  resetDefaultSessionRepository,
  startGuestDiagnostic,
} from './sessionApplication'

class MemoryStorage implements StorageAdapter {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

afterEach(() => {
  resetDefaultSessionRepository(new PersistenceService(null))
})

describe('guest diagnostic orchestration', () => {
  it('resumes an unfinished diagnostic for the same subject', () => {
    resetDefaultSessionRepository(new PersistenceService(new MemoryStorage()))
    const first = startGuestDiagnostic(['history'], ['q1', 'q2'])
    const resumed = startGuestDiagnostic(['history'], ['q1', 'q2'])

    expect(resumed.id).toBe(first.id)
  })

  it('starts a fresh diagnostic when the selected subject changes', () => {
    const repository = resetDefaultSessionRepository(new PersistenceService(new MemoryStorage()))
    const history = startGuestDiagnostic(['history'], ['q1', 'q2'])
    const math = startGuestDiagnostic(['math'], ['q1', 'q2'])

    expect(math.id).not.toBe(history.id)
    expect(math.selectedSubjectIds).toEqual(['math'])
    expect(getGuestDiagnosticSession()?.id).toBe(math.id)
    expect(repository.getSession(history.id)?.status).toBe('in-progress')
    expect(startGuestDiagnostic(['history'], ['q1', 'q2']).id).toBe(history.id)
    expect(getGuestDiagnosticSession(history.id)?.id).toBe(history.id)
  })

  it('retrieves the requested completed diagnostic even when a newer session exists', () => {
    resetDefaultSessionRepository(new PersistenceService(new MemoryStorage()))
    const history = startGuestDiagnostic(['history'], ['q1', 'q2'])
    const completedHistory = completeGuestDiagnostic(history.id)
    const math = startGuestDiagnostic(['math'], ['q1', 'q2'])

    expect(completedHistory?.status).toBe('completed')
    expect(getGuestDiagnosticRecord(history.id)?.id).toBe(history.id)
    expect(getGuestDiagnosticRecord(history.id)?.status).toBe('completed')
    expect(getGuestDiagnosticRecord()?.id).toBe(math.id)
  })
})
