export type ForecastSource = 'guest-diagnostic' | 'training'

export type ForecastStatus = 'invalid-input' | 'insufficient-data' | 'preliminary' | 'stable'

export interface ForecastAnswer {
  id: string
  subjectId: string
  isCorrect: boolean
  answeredAt: string
}

export interface ForecastInput {
  source: ForecastSource
  selectedSubjectIds: readonly string[]
  answers: readonly ForecastAnswer[]
}

export interface ForecastEligibilityConfig {
  preliminaryAnswerThreshold: number
  stableAnswerThreshold: number
  minimumAnswersPerSelectedSubject: number
}

export interface ForecastSubjectMaximum {
  subjectId: string
  maxScore: number
}

export interface ForecastRecencyWeights {
  within30Days: number
  within60Days: number
  within90Days: number
  olderThan90Days: number
}

export interface ForecastRangePolicy {
  preliminaryPercentage: number
  stablePercentage: number
}

export interface ForecastConfiguration {
  eligibility: ForecastEligibilityConfig
  subjectMaxima: readonly ForecastSubjectMaximum[]
  recencyWeights: ForecastRecencyWeights
  rangePolicy: ForecastRangePolicy
}

export type InvalidForecastReason =
  | 'invalid-configuration'
  | 'invalid-as-of'
  | 'invalid-source'
  | 'duplicate-answer'
  | 'duplicate-subject'
  | 'invalid-answer'
  | 'invalid-subject'
  | 'answer-without-subject'
  | 'missing-subject-maximum'

export type InsufficientForecastReason = 'guest-diagnostic' | 'answer-count' | 'subject-selection'

export type PreliminaryForecastReason = 'answer-count' | 'subject-coverage'

export interface ForecastSubjectScore {
  subjectId: string
  answerCount: number
  weightedAccuracy: number
  predictedScore: number
  maximumScore: number
}

export interface ForecastScore {
  predictedScore: number
  totalMaximumScore: number
  lowerBound: number
  upperBound: number
  rangePercentage: number
  subjectScores: readonly ForecastSubjectScore[]
}

export interface InvalidForecastAssessment {
  status: 'invalid-input'
  reason: InvalidForecastReason
}

export interface InsufficientForecastAssessment {
  status: 'insufficient-data'
  reason: InsufficientForecastReason
  answerCount: number
  requiredAnswerCount: number
}

export interface PreliminaryForecastAssessment {
  status: 'preliminary'
  reason: PreliminaryForecastReason
  answerCount: number
  score?: ForecastScore
}

export interface StableForecastAssessment {
  status: 'stable'
  answerCount: number
  score: ForecastScore
}

export type ForecastAssessment =
  | InvalidForecastAssessment
  | InsufficientForecastAssessment
  | PreliminaryForecastAssessment
  | StableForecastAssessment

export interface ForecastScoreDisplay {
  label: string
  value: string
  detail: string
}

export interface ForecastScreenModel {
  status: ForecastStatus
  eyebrow: string
  title: string
  description: string
  note: string
  actionLabel: string
  score?: ForecastScoreDisplay
}
