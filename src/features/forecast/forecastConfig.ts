import type { ForecastConfiguration } from './types'

export const mockForecastConfiguration = {
  eligibility: {
    preliminaryAnswerThreshold: 20,
    stableAnswerThreshold: 100,
    minimumAnswersPerSelectedSubject: 15,
  },
  subjectMaxima: [
    { subjectId: 'history', maxScore: 20 },
    { subjectId: 'reading', maxScore: 10 },
    { subjectId: 'math-literacy', maxScore: 10 },
    { subjectId: 'math', maxScore: 50 },
    { subjectId: 'physics', maxScore: 50 },
  ],
  recencyWeights: {
    within30Days: 1,
    within60Days: 0.7,
    within90Days: 0.4,
    olderThan90Days: 0.2,
  },
  rangePolicy: {
    preliminaryPercentage: 0.15,
    stablePercentage: 0.07,
  },
} satisfies ForecastConfiguration
