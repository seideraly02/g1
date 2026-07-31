import { describe, expect, it } from 'vitest'
import {
  formatKazakhstanPhone,
  isVerificationCode,
  normalizeRegistration,
  validateRegistration,
} from './registrationValidation'

describe('registration validation', () => {
  it('requires every registration field', () => {
    expect(validateRegistration({ fullName: '', city: '', phone: '' })).toEqual({
      fullName: 'Аты-жөніңді енгіз',
      city: 'Қалаңды енгіз',
      phone: 'Нөмірді +7 (7XX) - XXX - XX - XX түрінде енгіз',
    })
  })

  it('normalizes a valid Kazakhstan phone and profile whitespace', () => {
    expect(
      normalizeRegistration({
        fullName: '  Аян   Серікұлы ',
        city: ' Алматы ',
        phone: '8 701 123 45 67',
      }),
    ).toEqual({ fullName: 'Аян Серікұлы', city: 'Алматы', phone: '+77011234567' })
  })

  it('masks typed and pasted phones and truncates extra digits', () => {
    expect(formatKazakhstanPhone('+7 701 123 45 67')).toBe('+7 (701) - 123 - 45 - 67')
    expect(formatKazakhstanPhone('87011234567999')).toBe('+7 (701) - 123 - 45 - 67')
    expect(
      normalizeRegistration({
        fullName: 'Аян Серікұлы',
        city: 'Алматы',
        phone: '+7 (701) - 123 - 45 - 67',
      }).phone,
    ).toBe('+77011234567')
  })

  it('keeps the generated country prefix out of sequential typing and deletion', () => {
    let display = ''
    for (const digit of '7011234567') {
      display = formatKazakhstanPhone(display + digit)
    }
    expect(display).toBe('+7 (701) - 123 - 45 - 67')
    expect(formatKazakhstanPhone(display.slice(0, -1))).toBe('+7 (701) - 123 - 45 - 6')
    expect(formatKazakhstanPhone('+7 (')).toBe('')
  })

  it('rejects incomplete profiles and accepts only a six-digit code', () => {
    expect(validateRegistration({ fullName: 'Аян', city: 'А', phone: '+7 701 12' })).toHaveProperty(
      'fullName',
    )
    expect(isVerificationCode('123456')).toBe(true)
    expect(isVerificationCode('12345a')).toBe(false)
  })
})
