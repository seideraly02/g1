import type { StudyPlan } from '../plan/studyPlanApplication'
import { guestDiagnosticQuestionIds } from '../diagnostic/diagnosticSession'

const subjectNames: Record<string, string> = {
  history: 'Қазақстан тарихы',
  reading: 'Оқу сауаттылығы',
  'math-literacy': 'Математикалық сауаттылық',
  math: 'Математика',
  physics: 'Физика',
}

export interface SavedGoalTrainingPresentation {
  subjectId: string
  subjectName: string
  dailyQuestionGoal: number
  starterQuestionIds: readonly string[]
}

export function createSavedGoalTrainingPresentation(
  plan: StudyPlan | null,
): SavedGoalTrainingPresentation | null {
  const subjectId = plan?.selectedSubjectIds[0]
  if (!plan || !subjectId) return null

  return {
    subjectId,
    subjectName: subjectNames[subjectId] ?? 'Таңдалған пән',
    dailyQuestionGoal: plan.dailyQuestionGoal,
    starterQuestionIds: guestDiagnosticQuestionIds,
  }
}
