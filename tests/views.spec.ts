import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from '@vue/compiler-sfc'
import { describe, expect, it } from 'vitest'

const viewsDirectory = resolve(process.cwd(), 'src/views')
const referenceViews = [
  'AdminView.vue',
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

  it('formats phone inputs on blur without competing input handlers', () => {
    const registration = readFileSync(resolve(viewsDirectory, 'RegistrationView.vue'), 'utf8')

    expect(registration).toContain('v-model="registration.phone"')
    expect(registration).toContain('@blur="formatPhone(\'registration\')"')
    expect(registration).toContain('v-model="login.phone"')
    expect(registration).toContain('@blur="formatPhone(\'login\')"')
    expect(registration).not.toContain('@input="updatePhone')
  })

  it('renders the authenticated profile and exposes a real logout action', () => {
    const profile = readFileSync(resolve(viewsDirectory, 'ProfileView.vue'), 'utf8')

    expect(profile).toContain('auth.user.firstName')
    expect(profile).toContain('auth.user.lastName')
    expect(profile).toContain('auth.user?.city')
    expect(profile).toContain('auth.user?.phone')
    expect(profile).toContain('await auth.signOut()')
    expect(profile).toContain("router.replace({ name: 'register', query: { mode: 'login' } })")
    expect(profile).toContain('Тіркелгіден шығу')
    expect(profile).not.toContain('Авторизация уақытша өшірулі')
    expect(profile).not.toContain('Қонақ оқушы')
  })

  it('keeps admin access role-gated and admin APIs outside the view', () => {
    const profile = readFileSync(resolve(viewsDirectory, 'ProfileView.vue'), 'utf8')
    const admin = readFileSync(resolve(viewsDirectory, 'AdminView.vue'), 'utf8')

    expect(profile).toContain("auth.user?.role === 'admin'")
    expect(profile).toContain("router.push({ name: 'admin' })")
    expect(admin).toContain('adminRepository.getOverview()')
    expect(admin).toContain('adminRepository.createQuestion')
    expect(admin).toContain('Кіруге рұқсат жоқ')
    expect(admin).not.toContain('fetch(')
  })
})
