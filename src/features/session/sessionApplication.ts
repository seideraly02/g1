import { PersistenceService } from '../../services/persistenceService'
import { createLocalSessionRepository } from './localSessionRepository'
import type { SessionRepository } from './sessionRepository'
import type { LearningSession, SaveSessionAnswerInput } from './types'

const defaultSessionRepository = createLocalSessionRepository(new PersistenceService())

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

export function startGuestDiagnostic(
  selectedSubjectIds: readonly string[],
  questionIds: readonly string[],
): LearningSession {
  return getOrCreateSession(
    defaultSessionRepository,
    'guest-diagnostic',
    selectedSubjectIds,
    questionIds,
  )
}

export function getGuestDiagnosticSession(): LearningSession | null {
  return defaultSessionRepository.getActiveSession('guest-diagnostic')
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
