import { describe, expect, it } from 'vitest'
import { postRegistrationRouteName, resolvePostLoginDestination } from './authNavigation'

describe('post-auth navigation', () => {
  it('sends both registration and direct login to the personal account', () => {
    expect(postRegistrationRouteName).toBe('profile')
    expect(resolvePostLoginDestination(undefined)).toEqual({ name: 'profile' })
  })

  it('always opens the personal account after login', () => {
    expect(resolvePostLoginDestination('/training?resume=1')).toEqual({ name: 'profile' })
    expect(resolvePostLoginDestination('//evil.example')).toEqual({ name: 'profile' })
    expect(resolvePostLoginDestination('https://evil.example')).toEqual({ name: 'profile' })
  })
})
