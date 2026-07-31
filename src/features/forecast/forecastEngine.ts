import type {
  ForecastAnswer,
  ForecastAssessment,
  ForecastConfiguration,
  ForecastInput,
  ForecastRecencyWeights,
  ForecastScore,
  ForecastSubjectMaximum,
  InvalidForecastReason,
} from './types'

const millisecondsPerDay = 24 * 60 * 60 * 1000

function isPositiveInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0
}

function isUnitIntervalPercentage(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= 1
}

function isValidDate(value: Date): boolean {
  return Number.isFinite(value.getTime())
}

function hasValidConfiguration(config: ForecastConfiguration): boolean {
  const { eligibility, rangePolicy, recencyWeights, subjectMaxima } = config
  const subjectIds = new Set<string>()

  return (
    isPositiveInteger(eligibility.preliminaryAnswerThreshold) &&
    isPositiveInteger(eligibility.stableAnswerThreshold) &&
    isPositiveInteger(eligibility.minimumAnswersPerSelectedSubject) &&
    eligibility.preliminaryAnswerThreshold < eligibility.stableAnswerThreshold &&
    isUnitIntervalPercentage(rangePolicy.preliminaryPercentage) &&
    isUnitIntervalPercentage(rangePolicy.stablePercentage) &&
    rangePolicy.preliminaryPercentage >= rangePolicy.stablePercentage &&
    Object.values(recencyWeights).every(isUnitIntervalPercentage) &&
    subjectMaxima.length > 0 &&
    subjectMaxima.every((subjectMaximum) => {
      if (
        subjectMaximum.subjectId.trim().length === 0 ||
        !isPositiveInteger(subjectMaximum.maxScore) ||
        subjectIds.has(subjectMaximum.subjectId)
      ) {
        return false
      }

      subjectIds.add(subjectMaximum.subjectId)
      return true
    })
  )
}

function getInputError(input: ForecastInput): InvalidForecastReason | null {
  if (input.source !== 'guest-diagnostic' && input.source !== 'training') {
    return 'invalid-source'
  }

  const selectedSubjects = new Set<string>()

  for (const subjectId of input.selectedSubjectIds) {
    if (subjectId.trim().length === 0) return 'invalid-subject'
    if (selectedSubjects.has(subjectId)) return 'duplicate-subject'
    selectedSubjects.add(subjectId)
  }

  const answerIds = new Set<string>()

  for (const answer of input.answers) {
    if (!isValidAnswer(answer)) return 'invalid-answer'
    if (answerIds.has(answer.id)) return 'duplicate-answer'
    if (selectedSubjects.size > 0 && !selectedSubjects.has(answer.subjectId)) {
      return 'answer-without-subject'
    }
    answerIds.add(answer.id)
  }

  return null
}

function isValidAnswer(answer: ForecastAnswer): boolean {
  return (
    answer.id.trim().length > 0 &&
    answer.subjectId.trim().length > 0 &&
    typeof answer.isCorrect === 'boolean' &&
    Number.isFinite(Date.parse(answer.answeredAt))
  )
}

function getSubjectMaximums(
  subjectMaxima: readonly ForecastSubjectMaximum[],
): ReadonlyMap<string, number> {
  return new Map(
    subjectMaxima.map((subjectMaximum) => [subjectMaximum.subjectId, subjectMaximum.maxScore]),
  )
}

function countAnswersBySubject(answers: readonly ForecastAnswer[]): ReadonlyMap<string, number> {
  const answerCounts = new Map<string, number>()

  for (const answer of answers) {
    answerCounts.set(answer.subjectId, (answerCounts.get(answer.subjectId) ?? 0) + 1)
  }

  return answerCounts
}

function hasSubjectAnswerCoverage(
  selectedSubjectIds: readonly string[],
  answerCounts: ReadonlyMap<string, number>,
  minimumAnswersPerSubject: number,
): boolean {
  return selectedSubjectIds.every(
    (subjectId) => (answerCounts.get(subjectId) ?? 0) >= minimumAnswersPerSubject,
  )
}

export function getRecencyWeight(
  answeredAt: string,
  asOf: Date,
  weights: ForecastRecencyWeights,
): number {
  const answeredAtMilliseconds = Date.parse(answeredAt)
  const ageInDays = Math.max(0, (asOf.getTime() - answeredAtMilliseconds) / millisecondsPerDay)

  if (ageInDays <= 30) return weights.within30Days
  if (ageInDays <= 60) return weights.within60Days
  if (ageInDays <= 90) return weights.within90Days
  return weights.olderThan90Days
}

function calculateForecastScore(
  input: ForecastInput,
  config: ForecastConfiguration,
  asOf: Date,
  rangePercentage: number,
  subjectMaximums: ReadonlyMap<string, number>,
): ForecastScore {
  const subjectScores = input.selectedSubjectIds.map((subjectId) => {
    const answers = input.answers.filter((answer) => answer.subjectId === subjectId)
    const weightedAnswers = answers.map((answer) => ({
      answer,
      weight: getRecencyWeight(answer.answeredAt, asOf, config.recencyWeights),
    }))
    const totalWeight = weightedAnswers.reduce((total, entry) => total + entry.weight, 0)
    const correctWeight = weightedAnswers.reduce(
      (total, entry) => total + (entry.answer.isCorrect ? entry.weight : 0),
      0,
    )
    const weightedAccuracy = correctWeight / totalWeight
    const maximumScore = subjectMaximums.get(subjectId) ?? 0

    return {
      subjectId,
      answerCount: answers.length,
      weightedAccuracy,
      predictedScore: Math.round(maximumScore * weightedAccuracy),
      maximumScore,
    }
  })
  const totalMaximumScore = subjectScores.reduce(
    (total, subjectScore) => total + subjectScore.maximumScore,
    0,
  )
  const predictedScore = subjectScores.reduce(
    (total, subjectScore) => total + subjectScore.predictedScore,
    0,
  )
  const rangeDelta = Math.round(totalMaximumScore * rangePercentage)

  return {
    predictedScore,
    totalMaximumScore,
    lowerBound: Math.max(0, predictedScore - rangeDelta),
    upperBound: Math.min(totalMaximumScore, predictedScore + rangeDelta),
    rangePercentage,
    subjectScores,
  }
}

export function evaluateForecastEligibility(
  input: ForecastInput,
  config: ForecastConfiguration,
  asOf: Date = new Date(),
): ForecastAssessment {
  if (!hasValidConfiguration(config)) {
    return { status: 'invalid-input', reason: 'invalid-configuration' }
  }

  if (!isValidDate(asOf)) {
    return { status: 'invalid-input', reason: 'invalid-as-of' }
  }

  const inputError = getInputError(input)
  if (inputError) {
    return { status: 'invalid-input', reason: inputError }
  }

  const subjectMaximums = getSubjectMaximums(config.subjectMaxima)
  if (input.selectedSubjectIds.some((subjectId) => !subjectMaximums.has(subjectId))) {
    return { status: 'invalid-input', reason: 'missing-subject-maximum' }
  }

  const answerCount = input.answers.length

  if (input.source === 'guest-diagnostic') {
    return {
      status: 'insufficient-data',
      reason: 'guest-diagnostic',
      answerCount,
      requiredAnswerCount: config.eligibility.preliminaryAnswerThreshold,
    }
  }

  if (answerCount < config.eligibility.preliminaryAnswerThreshold) {
    return {
      status: 'insufficient-data',
      reason: 'answer-count',
      answerCount,
      requiredAnswerCount: config.eligibility.preliminaryAnswerThreshold,
    }
  }

  if (input.selectedSubjectIds.length === 0) {
    return {
      status: 'insufficient-data',
      reason: 'subject-selection',
      answerCount,
      requiredAnswerCount: config.eligibility.preliminaryAnswerThreshold,
    }
  }

  const answerCounts = countAnswersBySubject(input.answers)
  const hasScoreCoverage = hasSubjectAnswerCoverage(input.selectedSubjectIds, answerCounts, 1)
  const hasStableCoverage = hasSubjectAnswerCoverage(
    input.selectedSubjectIds,
    answerCounts,
    config.eligibility.minimumAnswersPerSelectedSubject,
  )

  if (answerCount < config.eligibility.stableAnswerThreshold || !hasStableCoverage) {
    return {
      status: 'preliminary',
      reason:
        answerCount < config.eligibility.stableAnswerThreshold
          ? 'answer-count'
          : 'subject-coverage',
      answerCount,
      ...(hasScoreCoverage
        ? {
            score: calculateForecastScore(
              input,
              config,
              asOf,
              config.rangePolicy.preliminaryPercentage,
              subjectMaximums,
            ),
          }
        : {}),
    }
  }

  return {
    status: 'stable',
    answerCount,
    score: calculateForecastScore(
      input,
      config,
      asOf,
      config.rangePolicy.stablePercentage,
      subjectMaximums,
    ),
  }
}
