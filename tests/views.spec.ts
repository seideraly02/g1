import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'

const viewsDirectory = resolve(process.cwd(), 'src/views')
const referenceViews = [
  'DiagnosticResultView.vue',
  'DiagnosticView.vue',
  'ForecastView.vue',
  'HistorySubjectView.vue',
  'HomeView.vue',
  'MistakesView.vue',
  'MockExamView.vue',
  'NotificationsView.vue',
  'PersonalPlanView.vue',
  'ProfileView.vue',
  'ProgressView.vue',
  'RatingView.vue',
  'RegistrationView.vue',
  'SaveProgressView.vue',
  'StreakView.vue',
  'SubjectSelectView.vue',
  'SubjectsView.vue',
  'TrainingResultView.vue',
  'TrainingView.vue',
]

describe('Qadam mobile screens', () => {
  it('keeps all reference screens and validates every view as a TypeScript script-setup component', () => {
    const files = readdirSync(viewsDirectory)
      .filter((file) => file.endsWith('.vue'))
      .sort()

    for (const referenceView of referenceViews) {
      expect(files, `${referenceView} must remain available`).toContain(referenceView)
    }

    for (const file of files) {
      const source = readFileSync(resolve(viewsDirectory, file), 'utf8')
      const result = parse(source, { filename: file })

      expect(result.errors, file).toEqual([])
      expect(result.descriptor.scriptSetup?.lang, file).toBe('ts')
      expect(source, `${file} must use global styles and Tailwind`).not.toContain('<style')
    }
  })

  it('does not ship the Russian locale from the reference mockup', () => {
    const sources = readdirSync(viewsDirectory)
      .filter((file) => file.endsWith('.vue'))
      .map((file) => readFileSync(resolve(viewsDirectory, file), 'utf8'))
      .join('\n')

    for (const russianCopy of ['Русский', 'Выбери предмет', 'Продолжить', 'Сохранение прогресса']) {
      expect(sources).not.toContain(russianCopy)
    }
  })

  it('starts the mandatory registration flow before subject selection', () => {
    const welcome = readFileSync(resolve(viewsDirectory, 'WelcomeView.vue'), 'utf8')

    expect(welcome).toContain("router.push({ name: 'register' })")
    expect(welcome).toContain('@click="startPreparation"')
  })
})
