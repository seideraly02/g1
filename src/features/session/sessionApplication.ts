import { PersistenceService } from '../../services/persistenceService'
import { createLocalSessionRepository } from './localSessionRepository'
import type { SessionRepository } from './sessionRepository'
import type { LearningSession, LearningSessionType, SaveSessionAnswerInput } from './types'

let defaultSessionRepository = createLocalSessionRepository(new PersistenceService())

function nowAsIso(): string {
  return new Date().toISOString()
}

function getOrCreateSession(
  repository: SessionRepository,
  type: 'guest-diagnostic' | 'trial',
  selectedSubjectIds: readonly string[],
  questionIds: readonly string[],
  currentQuestionIndex = 0,
): LearningSession {
  const activeSession = repository.getActiveSession(type)
  if (activeSession) {
    return activeSession
  }

  return repository.createSession({
    type,
    selectedSubjectIds,
    questionIds,
    currentQuestionIndex,
    startedAt: nowAsIso(),
  })
}

function saveAnswerForSession(
  repository: SessionRepository,
  sessionType: 'guest-diagnostic' | 'trial',
  input: SaveSessionAnswerInput,
): LearningSession | null {
  const session = repository.getSession(input.sessionId)
  if (!session || session.type !== sessionType) {
    return null
  }

  return repository.saveAnswer(input)
}

export function getSessionRepository(): SessionRepository {
  return defaultSessionRepository
}

export function resetDefaultSessionRepository(
  persistence = new PersistenceService(),
): SessionRepository {
  defaultSessionRepository = createLocalSessionRepository(persistence)
  return defaultSessionRepository
}

export function startGuestDiagnostic(
  selectedSubjectIds: readonly string[],
  questionIds: readonly string[],
): LearningSession {
  const matchingSession = [...defaultSessionRepository.getSessions()]
    .reverse()
    .find(
      (candidate) =>
        candidate.type === 'guest-diagnostic' &&
        (candidate.status === 'created' || candidate.status === 'in-progress') &&
        candidate.selectedSubjectIds.length === selectedSubjectIds.length &&
        candidate.selectedSubjectIds.every(
          (subjectId, index) => subjectId === selectedSubjectIds[index],
        ) &&
        candidate.questionIds.length === questionIds.length &&
        candidate.questionIds.every((questionId, index) => questionId === questionIds[index]),
    )

  return (
    matchingSession ??
    defaultSessionRepository.createSession({
      type: 'guest-diagnostic',
      selectedSubjectIds,
      questionIds,
      startedAt: nowAsIso(),
    })
  )
}

export function getGuestDiagnosticSession(sessionId?: string): LearningSession | null {
  if (sessionId) {
    const session = defaultSessionRepository.getSession(sessionId)
    if (
      session?.type === 'guest-diagnostic' &&
      (session.status === 'created' || session.status === 'in-progress')
    ) {
      return session
    }
  }
  return defaultSessionRepository.getActiveSession('guest-diagnostic')
}

export function getGuestDiagnosticRecord(sessionId?: string): LearningSession | null {
  if (sessionId) {
    const session = defaultSessionRepository.getSession(sessionId)
    return session?.type === 'guest-diagnostic' ? session : null
  }

  return getLatestSessionByType(defaultSessionRepository, 'guest-diagnostic')
}

export function getLatestSessionByType(
  repository: SessionRepository,
  type: LearningSessionType,
): LearningSession | null {
  return (
    [...repository.getSessions()].reverse().find((candidate) => candidate.type === type) ?? null
  )
}

export function getLatestGuestDiagnosticSession(): LearningSession | null {
  return getGuestDiagnosticRecord()
}

export function saveGuestDiagnosticAnswer(input: SaveSessionAnswerInput): LearningSession | null {
  return saveAnswerForSession(defaultSessionRepository, 'guest-diagnostic', input)
}

export function setGuestDiagnosticQuestion(
  sessionId: string,
  questionIndex: number,
): LearningSession | null {
  return defaultSessionRepository.setCurrentQuestionIndex(sessionId, questionIndex)
}

export function completeGuestDiagnostic(sessionId: string): LearningSession | null {
  return defaultSessionRepository.completeSession(sessionId, nowAsIso())
}

export function startTrialTraining(
  selectedSubjectIds: readonly string[],
  questionIds: readonly string[],
  currentQuestionIndex: number,
): LearningSession {
  return getOrCreateSession(
    defaultSessionRepository,
    'trial',
    selectedSubjectIds,
    questionIds,
    currentQuestionIndex,
  )
}

export function getTrialTrainingSession(): LearningSession | null {
  return defaultSessionRepository.getActiveSession('trial')
}

export function saveTrialTrainingAnswer(input: SaveSessionAnswerInput): LearningSession | null {
  return saveAnswerForSession(defaultSessionRepository, 'trial', input)
}

export function setTrialTrainingQuestion(
  sessionId: string,
  questionIndex: number,
): LearningSession | null {
  return defaultSessionRepository.setCurrentQuestionIndex(sessionId, questionIndex)
}

export function completeTrialTraining(sessionId: string): LearningSession | null {
  return defaultSessionRepository.completeSession(sessionId, nowAsIso())
}

export function discardTrialSession(repository: SessionRepository, sessionId: string): boolean {
  const session = repository.getSession(sessionId)
  if (!session || session.type !== 'trial' || session.status === 'completed') {
    return false
  }

  return repository.deleteSession(sessionId)
}

export function discardTrialTraining(sessionId: string): boolean {
  return discardTrialSession(defaultSessionRepository, sessionId)
}
