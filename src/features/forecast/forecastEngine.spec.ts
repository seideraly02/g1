import { describe, expect, it } from 'vitest'
import { mockForecastConfiguration } from './forecastConfig'
import { evaluateForecastEligibility, getRecencyWeight } from './forecastEngine'
import type { ForecastAnswer, ForecastConfiguration, ForecastInput } from './types'

const asOf = new Date('2026-07-31T12:00:00.000Z')

function dateDaysAgo(daysAgo: number): string {
  return new Date(asOf.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
}

function createAnswers(count: number, subjectIds: readonly string[]): ForecastAnswer[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `answer-${index}`,
    subjectId: subjectIds[index % subjectIds.length] ?? 'history',
    isCorrect: index % 2 === 0,
    answeredAt: dateDaysAgo(0),
  }))
}

function createTrainingInput(
  answerCount: number,
  selectedSubjectIds: readonly string[] = ['history'],
): ForecastInput {
  return {
    source: 'training',
    selectedSubjectIds,
    answers: createAnswers(answerCount, selectedSubjectIds),
  }
}

describe('evaluateForecastEligibility', () => {
  it('keeps a five-question guest diagnostic out of forecast eligibility', () => {
    const result = evaluateForecastEligibility(
      {
        source: 'guest-diagnostic',
        selectedSubjectIds: ['history'],
        answers: createAnswers(5, ['history']),
      },
      mockForecastConfiguration,
    )

    expect(result).toMatchObject({
      status: 'insufficient-data',
      reason: 'guest-diagnostic',
      answerCount: 5,
    })
  })

  it('returns a preliminary assessment at 20 valid training answers', () => {
    const result = evaluateForecastEligibility(
      createTrainingInput(20),
      mockForecastConfiguration,
      asOf,
    )

    expect(result).toMatchObject({ status: 'preliminary', reason: 'answer-count', answerCount: 20 })
    if (result.status !== 'preliminary' || !result.score) {
      throw new Error('Expected a preliminary forecast score')
    }

    expect(result.score).toMatchObject({
      predictedScore: 10,
      totalMaximumScore: 20,
      lowerBound: 7,
      upperBound: 13,
      rangePercentage: 0.15,
    })
  })

  it('applies documented recency weights at their boundaries', () => {
    expect(getRecencyWeight(dateDaysAgo(30), asOf, mockForecastConfiguration.recencyWeights)).toBe(
      1,
    )
    expect(getRecencyWeight(dateDaysAgo(31), asOf, mockForecastConfiguration.recencyWeights)).toBe(
      0.7,
    )
    expect(getRecencyWeight(dateDaysAgo(61), asOf, mockForecastConfiguration.recencyWeights)).toBe(
      0.4,
    )
    expect(getRecencyWeight(dateDaysAgo(91), asOf, mockForecastConfiguration.recencyWeights)).toBe(
      0.2,
    )

    const configuration: ForecastConfiguration = {
      ...mockForecastConfiguration,
      eligibility: {
        preliminaryAnswerThreshold: 4,
        stableAnswerThreshold: 5,
        minimumAnswersPerSelectedSubject: 1,
      },
      subjectMaxima: [{ subjectId: 'history', maxScore: 100 }],
    }
    const result = evaluateForecastEligibility(
      {
        source: 'training',
        selectedSubjectIds: ['history'],
        answers: [
          { id: 'recent', subjectId: 'history', isCorrect: true, answeredAt: dateDaysAgo(30) },
          { id: 'month', subjectId: 'history', isCorrect: false, answeredAt: dateDaysAgo(31) },
          { id: 'older', subjectId: 'history', isCorrect: true, answeredAt: dateDaysAgo(61) },
          { id: 'oldest', subjectId: 'history', isCorrect: false, answeredAt: dateDaysAgo(91) },
        ],
      },
      configuration,
      asOf,
    )

    if (result.status !== 'preliminary' || !result.score) {
      throw new Error('Expected a weighted preliminary score')
    }

    expect(result.score.subjectScores[0]?.weightedAccuracy).toBeCloseTo(1.4 / 2.3)
    expect(result.score).toMatchObject({ predictedScore: 61, lowerBound: 46, upperBound: 76 })
  })

  it('returns a stable assessment at 100 qualifying answers across selected subjects', () => {
    const result = evaluateForecastEligibility(
      createTrainingInput(100, ['history', 'math']),
      mockForecastConfiguration,
    )

    expect(result).toMatchObject({ status: 'stable', answerCount: 100 })
  })

  it('covers thresholds, missing subject coverage, and invalid input', () => {
    expect(
      evaluateForecastEligibility(createTrainingInput(19), mockForecastConfiguration),
    ).toMatchObject({ status: 'insufficient-data', reason: 'answer-count', answerCount: 19 })

    expect(
      evaluateForecastEligibility(createTrainingInput(99), mockForecastConfiguration),
    ).toMatchObject({ status: 'preliminary', reason: 'answer-count', answerCount: 99 })

    const unevenAnswers = [
      ...createAnswers(14, ['history']),
      ...createAnswers(86, ['math']).map((answer, index) => ({
        ...answer,
        id: `math-${index}`,
      })),
    ]

    expect(
      evaluateForecastEligibility(
        { source: 'training', selectedSubjectIds: ['history', 'math'], answers: unevenAnswers },
        mockForecastConfiguration,
      ),
    ).toMatchObject({ status: 'preliminary', reason: 'subject-coverage', answerCount: 100 })

    expect(
      evaluateForecastEligibility(
        {
          source: 'training',
          selectedSubjectIds: ['history'],
          answers: [
            { id: 'duplicate', subjectId: 'history', isCorrect: true, answeredAt: dateDaysAgo(0) },
            { id: 'duplicate', subjectId: 'history', isCorrect: false, answeredAt: dateDaysAgo(0) },
          ],
        },
        mockForecastConfiguration,
      ),
    ).toEqual({ status: 'invalid-input', reason: 'duplicate-answer' })

    expect(
      evaluateForecastEligibility(createTrainingInput(20), {
        ...mockForecastConfiguration,
        eligibility: { ...mockForecastConfiguration.eligibility, preliminaryAnswerThreshold: 0 },
      }),
    ).toEqual({ status: 'invalid-input', reason: 'invalid-configuration' })

    expect(
      evaluateForecastEligibility(
        {
          source: 'training',
          selectedSubjectIds: ['unknown'],
          answers: createAnswers(20, ['unknown']),
        },
        mockForecastConfiguration,
        asOf,
      ),
    ).toEqual({ status: 'invalid-input', reason: 'missing-subject-maximum' })

    const partialCoverage = evaluateForecastEligibility(
      {
        source: 'training',
        selectedSubjectIds: ['history', 'math'],
        answers: createAnswers(20, ['history']),
      },
      mockForecastConfiguration,
      asOf,
    )
    expect(partialCoverage).toEqual({
      status: 'preliminary',
      reason: 'answer-count',
      answerCount: 20,
    })
  })
})
