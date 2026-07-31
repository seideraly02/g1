export type LearningSessionType =
  'guest-diagnostic' | 'daily-plan' | 'topic' | 'mixed' | 'mistakes' | 'trial'

export type LearningSessionStatus =
  'created' | 'in-progress' | 'completed' | 'abandoned' | 'expired'

export type AnswerSyncStatus = 'local' | 'pending' | 'synced' | 'error'

export interface SessionAnswerAttempt {
  id: string
  sessionId: string
  questionId: string
  subjectId: string
  selectedOptionId?: string
  isCorrect?: boolean
  isSkipped: boolean
  answeredAt?: string
  syncStatus: AnswerSyncStatus
}

export interface LearningSession {
  id: string
  type: LearningSessionType
  selectedSubjectIds: readonly string[]
  questionIds: readonly string[]
  currentQuestionIndex: number
  status: LearningSessionStatus
  startedAt: string
  completedAt?: string
  answers: readonly SessionAnswerAttempt[]
}

export interface CreateLearningSessionInput {
  type: LearningSessionType
  selectedSubjectIds: readonly string[]
  questionIds: readonly string[]
  startedAt: string
  currentQuestionIndex?: number
}

export interface SaveSessionAnswerInput {
  sessionId: string
  questionId: string
  subjectId: string
  selectedOptionId?: string
  isCorrect?: boolean
  isSkipped: boolean
  answeredAt: string
}
