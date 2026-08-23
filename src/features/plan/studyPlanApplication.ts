import { PersistenceService } from '../../services/persistenceService'

const studyPlanStorageKey = 'qadam.plan.v1'
const persistence = new PersistenceService()
const allowedDailyGoals = [10, 20, 30, 50] as const

export type DailyQuestionGoal = (typeof allowedDailyGoals)[number]

export interface StudyPlanDraft {
  subjectId: string
  currentScore: string
  targetScore: string
  examDate: string
  dailyQuestionGoal: DailyQuestionGoal
}

export interface StudyPlan {
  selectedSubjectIds: readonly string[]
  currentScore: number
  targetScore: number
  examDate: string
  dailyQuestionGoal: DailyQuestionGoal
  savedAt: string
}

export type StudyPlanErrors = Partial<Record<keyof StudyPlanDraft, string>>

function isDailyQuestionGoal(value: unknown): value is DailyQuestionGoal {
  return typeof value === 'number' && allowedDailyGoals.includes(value as DailyQuestionGoal)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function dateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function validateStudyPlan(draft: StudyPlanDraft, now = new Date()): StudyPlanErrors {
  const errors: StudyPlanErrors = {}
  const currentScore = Number(draft.currentScore)
  const targetScore = Number(draft.targetScore)

  if (!draft.subjectId.trim()) errors.subjectId = 'Пәнді таңда.'
  if (!draft.currentScore.trim() || !Number.isFinite(currentScore) || currentScore < 0)
    errors.currentScore = 'Қазіргі нәтижеңді санмен жаз.'
  if (!draft.targetScore.trim() || !Number.isFinite(targetScore) || targetScore < 0)
    errors.targetScore = 'Мақсат теріс болмауы керек.'
  if (
    !draft.examDate ||
    !Number.isFinite(Date.parse(draft.examDate)) ||
    draft.examDate <= dateOnly(now)
  )
    errors.examDate = 'Болашақтағы ҰБТ күнін таңда.'
  if (!isDailyQuestionGoal(draft.dailyQuestionGoal))
    errors.dailyQuestionGoal = '10, 20, 30 немесе 50 сұрақты таңда.'

  return errors
}

export function saveStudyPlan(draft: StudyPlanDraft, now = new Date()): StudyPlan | null {
  if (Object.keys(validateStudyPlan(draft, now)).length > 0) return null

  const plan: StudyPlan = {
    selectedSubjectIds: [draft.subjectId],
    currentScore: Number(draft.currentScore),
    targetScore: Number(draft.targetScore),
    examDate: draft.examDate,
    dailyQuestionGoal: draft.dailyQuestionGoal,
    savedAt: now.toISOString(),
  }

  return persistence.write(studyPlanStorageKey, { version: 1, plan }) ? plan : null
}

export function getStudyPlan(): StudyPlan | null {
  const payload = persistence.read(studyPlanStorageKey, (value) => value)
  if (!isRecord(payload) || payload.version !== 1 || !isRecord(payload.plan)) return null

  const candidate = payload.plan
  if (
    !Array.isArray(candidate.selectedSubjectIds) ||
    candidate.selectedSubjectIds.length === 0 ||
    !candidate.selectedSubjectIds.every(
      (subjectId) => typeof subjectId === 'string' && subjectId.length > 0,
    ) ||
    typeof candidate.currentScore !== 'number' ||
    candidate.currentScore < 0 ||
    typeof candidate.targetScore !== 'number' ||
    candidate.targetScore < 0 ||
    typeof candidate.examDate !== 'string' ||
    !Number.isFinite(Date.parse(candidate.examDate)) ||
    !isDailyQuestionGoal(candidate.dailyQuestionGoal) ||
    typeof candidate.savedAt !== 'string' ||
    !Number.isFinite(Date.parse(candidate.savedAt))
  ) {
    return null
  }

  return {
    selectedSubjectIds: [...candidate.selectedSubjectIds] as string[],
    currentScore: candidate.currentScore,
    targetScore: candidate.targetScore,
    examDate: candidate.examDate,
    dailyQuestionGoal: candidate.dailyQuestionGoal,
    savedAt: candidate.savedAt,
  }
}
