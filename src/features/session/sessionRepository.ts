import type {
  CreateLearningSessionInput,
  LearningSession,
  LearningSessionType,
  SaveSessionAnswerInput,
} from './types'

export interface SessionRepository {
  createSession(input: CreateLearningSessionInput): LearningSession
  getSession(sessionId: string): LearningSession | null
  getSessions(): readonly LearningSession[]
  getActiveSession(type: LearningSessionType): LearningSession | null
  saveAnswer(input: SaveSessionAnswerInput): LearningSession | null
  setCurrentQuestionIndex(sessionId: string, questionIndex: number): LearningSession | null
  completeSession(sessionId: string, completedAt: string): LearningSession | null
}
