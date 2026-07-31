import type { RegistrationProfile } from './types'

export type RegistrationField = keyof RegistrationProfile
export type RegistrationErrors = Partial<Record<RegistrationField, string>>

export function normalizeKazakhstanPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  const normalized = digits.startsWith('8') ? `7${digits.slice(1)}` : digits
  return normalized.startsWith('7') ? `+${normalized.slice(0, 11)}` : `+${normalized.slice(0, 11)}`
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

export function validateRegistration(input: RegistrationProfile): RegistrationErrors {
  const errors: RegistrationErrors = {}
  const fullName = input.fullName.trim().replace(/\s+/g, ' ')
  const city = input.city.trim()

  if (!fullName) {
    errors.fullName = 'Аты-жөніңді енгіз'
  } else if (fullName.split(' ').length < 2 || fullName.length < 5) {
    errors.fullName = 'Аты-жөніңді толық енгіз'
  }

  if (!city) {
    errors.city = 'Қалаңды енгіз'
  } else if (city.length < 2) {
    errors.city = 'Қала атауын дұрыс енгіз'
  }

  if (!/^\+77\d{9}$/.test(normalizeKazakhstanPhone(input.phone))) {
    errors.phone = 'Нөмірді +7 (7XX) - XXX - XX - XX түрінде енгіз'
  }

  return errors
}

export function normalizeRegistration(input: RegistrationProfile): RegistrationProfile {
  return {
    fullName: input.fullName.trim().replace(/\s+/g, ' '),
    city: input.city.trim().replace(/\s+/g, ' '),
    phone: normalizeKazakhstanPhone(input.phone),
  }
}

export function isVerificationCode(value: string): boolean {
  return /^\d{6}$/.test(value)
}
