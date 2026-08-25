import type { LoginInput, RegistrationInput, RegistrationRequest } from './types'

export type RegistrationField = keyof RegistrationInput
export type RegistrationErrors = Partial<Record<RegistrationField, string>>
export type LoginErrors = Partial<Record<keyof LoginInput, string>>

export function normalizeKazakhstanPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  const normalized = digits.startsWith('8') ? `7${digits.slice(1)}` : digits
  return `+${normalized.slice(0, 11)}`
}

export function formatKazakhstanPhone(value: string): string {
  const hasGeneratedPrefix = value.trimStart().startsWith('+7')
  let digits = value.replace(/\D/g, '')
  if (hasGeneratedPrefix || (digits.length > 10 && /^[78]/.test(digits))) {
    digits = digits.slice(1)
  }
  const national = digits.slice(0, 10)
  if (!national) return ''

  let formatted = `+7 (${national.slice(0, 3)}`
  if (national.length >= 3) formatted += ')'
  if (national.length > 3) formatted += ` - ${national.slice(3, 6)}`
  if (national.length > 6) formatted += ` - ${national.slice(6, 8)}`
  if (national.length > 8) formatted += ` - ${national.slice(8, 10)}`
  return formatted
}

function validPhone(value: string) {
  return /^\+77\d{9}$/.test(normalizeKazakhstanPhone(value))
}

function passwordError(value: string): string | undefined {
  if (!value) return 'Құпиясөзді енгіз'
  if (value.length < 8) return 'Кемінде 8 таңба енгіз'
  if (value.length > 72 || new TextEncoder().encode(value).length > 72) {
    return 'Құпиясөз 72 байттан аспауы керек'
  }
  return undefined
}

export function validateRegistration(input: RegistrationInput): RegistrationErrors {
  const errors: RegistrationErrors = {}
  if (input.firstName.trim().length < 2) errors.firstName = 'Атыңды толық енгіз'
  if (input.lastName.trim().length < 2) errors.lastName = 'Тегіңді толық енгіз'
  if (input.city.trim().length < 2) errors.city = 'Қалаңды дұрыс енгіз'
  if (!validPhone(input.phone)) {
    errors.phone = 'Нөмірді +7 (7XX) - XXX - XX - XX түрінде енгіз'
  }
  const passwordValidation = passwordError(input.password)
  if (passwordValidation) errors.password = passwordValidation
  if (!input.confirmPassword) {
    errors.confirmPassword = 'Құпиясөзді қайтала'
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = 'Құпиясөздер сәйкес емес'
  }
  return errors
}

export function validateLogin(input: LoginInput): LoginErrors {
  const errors: LoginErrors = {}
  if (!validPhone(input.phone)) {
    errors.phone = 'Телефон нөмірін толық енгіз'
  }
  if (!input.password) errors.password = 'Құпиясөзді енгіз'
  return errors
}

export function normalizeRegistration(input: RegistrationInput): RegistrationRequest {
  return {
    firstName: input.firstName.trim().replace(/\s+/g, ' '),
    lastName: input.lastName.trim().replace(/\s+/g, ' '),
    city: input.city.trim().replace(/\s+/g, ' '),
    phone: normalizeKazakhstanPhone(input.phone),
    password: input.password,
  }
}

export function normalizeLogin(input: LoginInput): LoginInput {
  return { phone: normalizeKazakhstanPhone(input.phone), password: input.password }
}
