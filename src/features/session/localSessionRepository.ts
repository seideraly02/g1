import type { PersistenceService } from '../../services/persistenceService'
import type { SessionRepository } from './sessionRepository'
import type {
  CreateLearningSessionInput,
  LearningSession,
  LearningSessionStatus,
  LearningSessionType,
  SaveSessionAnswerInput,
  SessionAnswerAttempt,
} from './types'

const sessionsStorageKey = 'qadam.sessions.v1'
const sessionStorageVersion = 1

interface SessionStoragePayload {
  version: number
  sessions: readonly LearningSession[]
}

type SessionIdFactory = () => string

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `session-${crypto.randomUUID()}`
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isDateString(value: unknown): value is string {
  return isNonEmptyString(value) && Number.isFinite(Date.parse(value))
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every(isNonEmptyString)
}

function hasUniqueValues(values: readonly string[]): boolean {
  return new Set(values).size === values.length
}

function isSessionType(value: unknown): value is LearningSessionType {
  return (
    value === 'guest-diagnostic' ||
    value === 'daily-plan' ||
    value === 'topic' ||
    value === 'mixed' ||
    value === 'mistakes' ||
    value === 'trial'
  )
}

function isSessionStatus(value: unknown): value is LearningSessionStatus {
  return (
    value === 'created' ||
    value === 'in-progress' ||
    value === 'completed' ||
    value === 'abandoned' ||
    value === 'expired'
  )
}

function isAnswerSyncStatus(value: unknown): value is SessionAnswerAttempt['syncStatus'] {
  return value === 'local' || value === 'pending' || value === 'synced' || value === 'error'
}

function cloneAnswer(answer: SessionAnswerAttempt): SessionAnswerAttempt {
  return { ...answer }
}

function cloneSession(session: LearningSession): LearningSession {
  return {
    ...session,
    selectedSubjectIds: [...session.selectedSubjectIds],
    questionIds: [...session.questionIds],
    answers: session.answers.map(cloneAnswer),
  }
}

function decodeAnswer(
  value: unknown,
  sessionId: string,
  selectedSubjectIds: readonly string[],
  questionIds: readonly string[],
): SessionAnswerAttempt | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    !isNonEmptyString(value.id) ||
    value.sessionId !== sessionId ||
    !isNonEmptyString(value.questionId) ||
    !questionIds.includes(value.questionId) ||
    !isNonEmptyString(value.subjectId) ||
    !selectedSubjectIds.includes(value.subjectId) ||
    typeof value.isSkipped !== 'boolean' ||
    !isAnswerSyncStatus(value.syncStatus)
  ) {
    return null
  }

  if (value.selectedOptionId !== undefined && !isNonEmptyString(value.selectedOptionId)) {
    return null
  }

  if (value.isCorrect !== undefined && typeof value.isCorrect !== 'boolean') {
    return null
  }

  if (value.answeredAt !== undefined && !isDateString(value.answeredAt)) {
    return null
  }

  return {
    id: value.id,
    sessionId,
    questionId: value.questionId,
    subjectId: value.subjectId,
    ...(isNonEmptyString(value.selectedOptionId)
      ? { selectedOptionId: value.selectedOptionId }
      : {}),
    ...(typeof value.isCorrect === 'boolean' ? { isCorrect: value.isCorrect } : {}),
    isSkipped: value.isSkipped,
    ...(isDateString(value.answeredAt) ? { answeredAt: value.answeredAt } : {}),
    syncStatus: value.syncStatus,
  }
}

function decodeSession(value: unknown): LearningSession | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    !isNonEmptyString(value.id) ||
    !isSessionType(value.type) ||
    !isStringArray(value.selectedSubjectIds) ||
    !hasUniqueValues(value.selectedSubjectIds) ||
    !isStringArray(value.questionIds) ||
    !hasUniqueValues(value.questionIds) ||
    typeof value.currentQuestionIndex !== 'number' ||
    !Number.isInteger(value.currentQuestionIndex) ||
    value.currentQuestionIndex < 0 ||
    value.currentQuestionIndex >= value.questionIds.length ||
    !isSessionStatus(value.status) ||
    !isDateString(value.startedAt) ||
    !Array.isArray(value.answers)
  ) {
    return null
  }

  if (value.completedAt !== undefined && !isDateString(value.completedAt)) {
    return null
  }

  const answers: SessionAnswerAttempt[] = []
  const answerIds = new Set<string>()
  const answerQuestionIds = new Set<string>()

  for (const answerValue of value.answers) {
    const answer = decodeAnswer(answerValue, value.id, value.selectedSubjectIds, value.questionIds)
    if (!answer || answerIds.has(answer.id) || answerQuestionIds.has(answer.questionId)) {
      return null
    }

    answerIds.add(answer.id)
    answerQuestionIds.add(answer.questionId)
    answers.push(answer)
  }

  return {
    id: value.id,
    type: value.type,
    selectedSubjectIds: [...value.selectedSubjectIds],
    questionIds: [...value.questionIds],
    currentQuestionIndex: value.currentQuestionIndex,
    status: value.status,
    startedAt: value.startedAt,
    ...(isDateString(value.completedAt) ? { completedAt: value.completedAt } : {}),
    answers,
  }
}

function decodeSessionsPayload(value: unknown): SessionStoragePayload | null {
  if (
    !isRecord(value) ||
    value.version !== sessionStorageVersion ||
    !Array.isArray(value.sessions)
  ) {
    return null
  }

  const sessions: LearningSession[] = []
  const sessionIds = new Set<string>()

  for (const sessionValue of value.sessions) {
    const session = decodeSession(sessionValue)
    if (!session || sessionIds.has(session.id)) {
      return null
    }

    sessionIds.add(session.id)
    sessions.push(session)
  }

  return { version: sessionStorageVersion, sessions }
}

function hasValidSessionInput(input: CreateLearningSessionInput): boolean {
  return (
    isDateString(input.startedAt) &&
    input.selectedSubjectIds.length > 0 &&
    input.selectedSubjectIds.every((subjectId) => subjectId.trim().length > 0) &&
    hasUniqueValues(input.selectedSubjectIds) &&
    input.questionIds.length > 0 &&
    input.questionIds.every((questionId) => questionId.trim().length > 0) &&
    hasUniqueValues(input.questionIds) &&
    (input.currentQuestionIndex === undefined ||
      (Number.isInteger(input.currentQuestionIndex) &&
        input.currentQuestionIndex >= 0 &&
        input.currentQuestionIndex < input.questionIds.length))
  )
}

function isActive(session: LearningSession): boolean {
  return session.status === 'created' || session.status === 'in-progress'
}

export class LocalSessionRepository implements SessionRepository {
  private volatileSessions: readonly LearningSession[] | null = null

  constructor(
    private readonly persistence: PersistenceService,
    private readonly createId: SessionIdFactory = createSessionId,
  ) {}

  createSession(input: CreateLearningSessionInput): LearningSession {
    if (!hasValidSessionInput(input)) {
      throw new Error('Invalid learning session input')
    }

    const session: LearningSession = {
      id: this.createId(),
      type: input.type,
      selectedSubjectIds: [...input.selectedSubjectIds],
      questionIds: [...input.questionIds],
      currentQuestionIndex: input.currentQuestionIndex ?? 0,
      status: 'in-progress',
      startedAt: input.startedAt,
      answers: [],
    }

    this.writeSessions([...this.readSessions(), session])
    return cloneSession(session)
  }

  getSession(sessionId: string): LearningSession | null {
    const session = this.readSessions().find((candidate) => candidate.id === sessionId)
    return session ? cloneSession(session) : null
  }

  getSessions(): readonly LearningSession[] {
    return this.readSessions().map(cloneSession)
  }

  getActiveSession(type: LearningSessionType): LearningSession | null {
    const sessions = this.readSessions()
    const session = [...sessions]
      .reverse()
      .find((candidate) => candidate.type === type && isActive(candidate))
    return session ? cloneSession(session) : null
  }

  saveAnswer(input: SaveSessionAnswerInput): LearningSession | null {
    if (
      !isNonEmptyString(input.sessionId) ||
      !isNonEmptyString(input.questionId) ||
      !isNonEmptyString(input.subjectId) ||
      !isDateString(input.answeredAt) ||
      typeof input.isSkipped !== 'boolean' ||
      (input.selectedOptionId !== undefined && !isNonEmptyString(input.selectedOptionId)) ||
      (input.isCorrect !== undefined && typeof input.isCorrect !== 'boolean')
    ) {
      return null
    }

    const session = this.getSession(input.sessionId)
    if (
      !session ||
      !isActive(session) ||
      !session.questionIds.includes(input.questionId) ||
      !session.selectedSubjectIds.includes(input.subjectId)
    ) {
      return null
    }

    const existingAnswer = session.answers.find((answer) => answer.questionId === input.questionId)
    if (existingAnswer && session.type !== 'trial') {
      return session
    }

    const answer: SessionAnswerAttempt = {
      id: existingAnswer?.id ?? `${session.id}:${input.questionId}`,
      sessionId: session.id,
      questionId: input.questionId,
      subjectId: input.subjectId,
      ...(input.selectedOptionId ? { selectedOptionId: input.selectedOptionId } : {}),
      ...(typeof input.isCorrect === 'boolean' ? { isCorrect: input.isCorrect } : {}),
      isSkipped: input.isSkipped,
      answeredAt: input.answeredAt,
      syncStatus: 'local',
    }

    const answers = existingAnswer
      ? session.answers.map((candidate) =>
          candidate.questionId === input.questionId ? answer : candidate,
        )
      : [...session.answers, answer]
    const updatedSession: LearningSession = { ...session, status: 'in-progress', answers }

    this.replaceSession(updatedSession)
    return cloneSession(updatedSession)
  }

  setCurrentQuestionIndex(sessionId: string, questionIndex: number): LearningSession | null {
    const session = this.getSession(sessionId)
    if (
      !session ||
      !isActive(session) ||
      !Number.isInteger(questionIndex) ||
      questionIndex < 0 ||
      questionIndex >= session.questionIds.length
    ) {
      return null
    }

    const updatedSession: LearningSession = { ...session, currentQuestionIndex: questionIndex }
    this.replaceSession(updatedSession)
    return cloneSession(updatedSession)
  }

  completeSession(sessionId: string, completedAt: string): LearningSession | null {
    const session = this.getSession(sessionId)
    if (!session || !isDateString(completedAt)) {
      return null
    }

    if (session.status === 'completed') {
      return session
    }

    if (!isActive(session)) {
      return null
    }

    const updatedSession: LearningSession = {
      ...session,
      status: 'completed',
      completedAt,
    }
    this.replaceSession(updatedSession)
    return cloneSession(updatedSession)
  }

  deleteSession(sessionId: string): boolean {
    const sessions = this.readSessions()
    const remainingSessions = sessions.filter((session) => session.id !== sessionId)
    if (remainingSessions.length === sessions.length) {
      return false
    }

    this.writeSessions(remainingSessions)
    return true
  }

  private readSessions(): readonly LearningSession[] {
    const payload = this.persistence.read(sessionsStorageKey, decodeSessionsPayload)
    if (payload) {
      this.volatileSessions = payload.sessions.map(cloneSession)
      return this.volatileSessions
    }

    return this.volatileSessions ?? []
  }

  private writeSessions(sessions: readonly LearningSession[]): void {
    const nextSessions = sessions.map(cloneSession)
    this.volatileSessions = nextSessions
    this.persistence.write(sessionsStorageKey, {
      version: sessionStorageVersion,
      sessions: nextSessions,
    } satisfies SessionStoragePayload)
  }

  private replaceSession(session: LearningSession): void {
    const sessions = this.readSessions().map((candidate) =>
      candidate.id === session.id ? session : candidate,
    )
    this.writeSessions(sessions)
  }
}

export function createLocalSessionRepository(
  persistence: PersistenceService,
  createId?: SessionIdFactory,
): SessionRepository {
  return new LocalSessionRepository(persistence, createId)
}
