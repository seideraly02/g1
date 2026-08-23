import { describe, expect, it } from 'vitest'
import { validateStudyPlan, type DailyQuestionGoal } from './studyPlanApplication'

const now = new Date('2026-08-23T00:00:00.000Z')

describe('study plan validation', () => {
  it('accepts configured goals and does not require target growth', () => {
    expect(
      validateStudyPlan(
        {
          subjectId: 'math',
          currentScore: '60',
          targetScore: '40',
          examDate: '2027-06-18',
          dailyQuestionGoal: 20,
        },
        now,
      ),
    ).toEqual({})
  })

  it('rejects missing subjects, negative targets, and non-future dates', () => {
    const errors = validateStudyPlan(
      {
        subjectId: '',
        currentScore: '80',
        targetScore: '-1',
        examDate: '2026-08-23',
        dailyQuestionGoal: 10,
      },
      now,
    )
    expect(errors.subjectId).toBeDefined()
    expect(errors.targetScore).toBeDefined()
    expect(errors.examDate).toBeDefined()
  })

  it('rejects a daily goal outside the configured set', () => {
    const errors = validateStudyPlan(
      {
        subjectId: 'math',
        currentScore: '60',
        targetScore: '90',
        examDate: '2027-06-18',
        dailyQuestionGoal: 25 as DailyQuestionGoal,
      },
      now,
    )
    expect(errors.dailyQuestionGoal).toBeDefined()
  })
})
