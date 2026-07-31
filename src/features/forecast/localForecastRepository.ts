import type { SessionRepository } from '../session/sessionRepository'
import type { LearningSession, SessionAnswerAttempt } from '../session/types'
import type { ForecastRepository } from './forecastRepository'
import type { ForecastAnswer, ForecastInput } from './types'

function uniqueSubjectIds(sessions: readonly LearningSession[]): readonly string[] {
  return [...new Set(sessions.flatMap((session) => session.selectedSubjectIds))]
}

function isScoredAnswer(answer: SessionAnswerAttempt): answer is SessionAnswerAttempt & {
  isCorrect: boolean
  answeredAt: string
} {
  return (
    !answer.isSkipped &&
    typeof answer.isCorrect === 'boolean' &&
    typeof answer.answeredAt === 'string'
  )
}

function toForecastAnswer(
  answer: SessionAnswerAttempt & {
    isCorrect: boolean
    answeredAt: string
  },
): ForecastAnswer {
  return {
    id: answer.id,
    subjectId: answer.subjectId,
    isCorrect: answer.isCorrect,
    answeredAt: answer.answeredAt,
  }
}

function getScoredAnswers(sessions: readonly LearningSession[]): readonly ForecastAnswer[] {
  return sessions.flatMap((session) => session.answers.filter(isScoredAnswer).map(toForecastAnswer))
}

export class LocalForecastRepository implements ForecastRepository {
  constructor(private readonly sessionRepository: SessionRepository) {}

  getForecastInput(): ForecastInput {
    const sessions = this.sessionRepository.getSessions()
    const trainingSessions = sessions.filter((session) => session.type !== 'guest-diagnostic')

    if (trainingSessions.length > 0) {
      return {
        source: 'training',
        selectedSubjectIds: uniqueSubjectIds(trainingSessions),
        answers: getScoredAnswers(trainingSessions),
      }
    }

    const guestDiagnostic = [...sessions]
      .reverse()
      .find((session) => session.type === 'guest-diagnostic')

    if (guestDiagnostic) {
      return {
        source: 'guest-diagnostic',
        selectedSubjectIds: [...guestDiagnostic.selectedSubjectIds],
        answers: getScoredAnswers([guestDiagnostic]),
      }
    }

    return {
      source: 'training',
      selectedSubjectIds: [],
      answers: [],
    }
  }
}

export function createLocalForecastRepository(
  sessionRepository: SessionRepository,
): ForecastRepository {
  return new LocalForecastRepository(sessionRepository)
}
