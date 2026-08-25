import { describe, expect, it } from 'vitest'
import {
  formatKazakhstanPhone,
  normalizeLogin,
  normalizeRegistration,
  validateLogin,
  validateRegistration,
} from './registrationValidation'

describe('password authentication validation', () => {
  it('requires all registration fields and password confirmation', () => {
    expect(
      validateRegistration({
        firstName: '',
        lastName: '',
        city: '',
        phone: '',
        password: '',
        confirmPassword: '',
      }),
    ).toEqual({
      firstName: 'Атыңды толық енгіз',
      lastName: 'Тегіңді толық енгіз',
      city: 'Қалаңды дұрыс енгіз',
      phone: 'Нөмірді +7 (7XX) - XXX - XX - XX түрінде енгіз',
      password: 'Құпиясөзді енгіз',
      confirmPassword: 'Құпиясөзді қайтала',
    })
  })

  it('normalizes registration data without sending confirmation', () => {
    expect(
      normalizeRegistration({
        firstName: '  Аян ',
        lastName: ' Серікұлы ',
        city: ' Алматы ',
        phone: '8 701 123 45 67',
        password: 'strong-pass',
        confirmPassword: 'strong-pass',
      }),
    ).toEqual({
      firstName: 'Аян',
      lastName: 'Серікұлы',
      city: 'Алматы',
      phone: '+77011234567',
      password: 'strong-pass',
    })
  })

  it('validates matching passwords and the BCrypt byte boundary', () => {
    const base = {
      firstName: 'Аян',
      lastName: 'Серікұлы',
      city: 'Алматы',
      phone: '+7 (701) - 123 - 45 - 67',
      password: 'құпиясөз',
      confirmPassword: 'басқа-сөз',
    }
    expect(validateRegistration(base).confirmPassword).toBe('Құпиясөздер сәйкес емес')
    expect(
      validateRegistration({ ...base, password: 'ө'.repeat(40), confirmPassword: 'ө'.repeat(40) })
        .password,
    ).toBe('Құпиясөз 72 байттан аспауы керек')
  })

  it('formats phones and validates login', () => {
    expect(formatKazakhstanPhone('87011234567')).toBe('+7 (701) - 123 - 45 - 67')
    expect(normalizeLogin({ phone: '8 701 123 45 67', password: 'secret' })).toEqual({
      phone: '+77011234567',
      password: 'secret',
    })
    expect(validateLogin({ phone: '+7 701', password: '' })).toEqual({
      phone: 'Телефон нөмірін толық енгіз',
      password: 'Құпиясөзді енгіз',
    })
  })
})
