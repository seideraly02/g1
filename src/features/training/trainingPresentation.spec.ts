import { describe, expect, it } from 'vitest'
import { createSavedGoalTrainingPresentation } from './trainingPresentation'

describe('saved goal training presentation', () => {
  it('uses the persisted subject and keeps the supported starter count honest', () => {
    const model = createSavedGoalTrainingPresentation({
      selectedSubjectIds: ['math'],
      currentScore: 61,
      targetScore: 90,
      examDate: '2027-06-20',
      dailyQuestionGoal: 20,
      savedAt: '2026-08-23T12:00:00.000Z',
    })

    expect(model).toMatchObject({
      subjectId: 'math',
      subjectName: 'Математика',
      dailyQuestionGoal: 20,
    })
    expect(model?.starterQuestionIds).toHaveLength(5)
  })
})
