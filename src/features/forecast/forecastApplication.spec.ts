import { describe, expect, it } from 'vitest'
import { PersistenceService, type StorageAdapter } from '../../services/persistenceService'
import { createLocalSessionRepository } from '../session/localSessionRepository'
import type { LearningSessionType } from '../session/types'
import { getForecastScreenModel } from './forecastApplication'
import { mockForecastConfiguration } from './forecastConfig'
import { createLocalForecastRepository } from './localForecastRepository'

const asOf = new Date('2026-07-31T12:00:00.000Z')

class MemoryStorage implements StorageAdapter {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

function seedSession(
  storage: StorageAdapter,
  type: LearningSessionType,
  subjectIds: readonly string[],
  answerCount: number,
  isCorrect: (index: number) => boolean = (index) => index % 2 === 0,
) {
  const repository = createLocalSessionRepository(
    new PersistenceService(storage),
    () => 'seed-session',
  )
  const questionIds = Array.from({ length: answerCount }, (_, index) => `question-${index + 1}`)
  const session = repository.createSession({
    type,
    selectedSubjectIds: subjectIds,
    questionIds,
    startedAt: asOf.toISOString(),
  })

  questionIds.forEach((questionId, index) => {
    const subjectId = subjectIds[index % subjectIds.length]
    if (!subjectId) {
      throw new Error('Expected seeded subject')
    }

    repository.saveAnswer({
      sessionId: session.id,
      questionId,
      subjectId,
      isCorrect: isCorrect(index),
      isSkipped: false,
      answeredAt: asOf.toISOString(),
    })
  })
  repository.completeSession(session.id, asOf.toISOString())
}

function getReloadedRouteModels(storage: StorageAdapter) {
  const reloadedRepository = createLocalSessionRepository(
    new PersistenceService(storage),
    () => 'reloaded-session',
  )
  const dependencies = {
    repository: createLocalForecastRepository(reloadedRepository),
    configuration: mockForecastConfiguration,
    asOf,
  }

  return {
    home: getForecastScreenModel(dependencies),
    forecast: getForecastScreenModel(dependencies),
  }
}

describe('getForecastScreenModel', () => {
  it('derives the same insufficient state for both routes after a persisted guest diagnostic reload', () => {
    const storage = new MemoryStorage()
    seedSession(storage, 'guest-diagnostic', ['history'], 5)

    const models = getReloadedRouteModels(storage)

    expect(models.home.status).toBe('insufficient-data')
    expect(models.forecast.status).toBe('insufficient-data')
    expect(models.home.score).toBeUndefined()
    expect(models.forecast.score).toBeUndefined()
  })

  it('derives preliminary and stable score states from re-instantiated persisted training sessions', () => {
    const preliminaryStorage = new MemoryStorage()
    seedSession(preliminaryStorage, 'daily-plan', ['history'], 20)
    const preliminary = getReloadedRouteModels(preliminaryStorage)

    expect(preliminary.home.status).toBe('preliminary')
    expect(preliminary.forecast.status).toBe('preliminary')
    expect(preliminary.home.score?.value).toBe('7–13 / 20 балл')
    expect(preliminary.forecast.score?.value).toBe('7–13 / 20 балл')

    const stableStorage = new MemoryStorage()
    seedSession(stableStorage, 'daily-plan', ['history', 'math'], 100, () => true)
    const stable = getReloadedRouteModels(stableStorage)

    expect(stable.home.status).toBe('stable')
    expect(stable.forecast.status).toBe('stable')
    expect(stable.home.score?.value).toBe('65–70 / 70 балл')
    expect(stable.forecast.score?.value).toBe('65–70 / 70 балл')
  })

  it('keeps a saved answer idempotent through repository re-instantiation', () => {
    const storage = new MemoryStorage()
    const repository = createLocalSessionRepository(
      new PersistenceService(storage),
      () => 'idempotent',
    )
    const session = repository.createSession({
      type: 'daily-plan',
      selectedSubjectIds: ['history'],
      questionIds: ['question-1'],
      startedAt: asOf.toISOString(),
    })

    repository.saveAnswer({
      sessionId: session.id,
      questionId: 'question-1',
      subjectId: 'history',
      isCorrect: true,
      isSkipped: false,
      answeredAt: asOf.toISOString(),
    })
    repository.saveAnswer({
      sessionId: session.id,
      questionId: 'question-1',
      subjectId: 'history',
      isCorrect: false,
      isSkipped: false,
      answeredAt: asOf.toISOString(),
    })

    const reloadedRepository = createLocalSessionRepository(new PersistenceService(storage))
    const reloadedSession = reloadedRepository.getSession(session.id)

    expect(reloadedSession?.answers).toHaveLength(1)
    expect(reloadedSession?.answers[0]?.isCorrect).toBe(true)
  })
})
