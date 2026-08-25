import { describe, expect, it } from 'vitest'
import { postRegistrationRouteName, resolvePostLoginDestination } from './authNavigation'

describe('post-auth navigation', () => {
  it('keeps registration on onboarding but sends a direct login home', () => {
    expect(postRegistrationRouteName).toBe('subjects-onboarding')
    expect(resolvePostLoginDestination(undefined)).toEqual({ name: 'home' })
  })

  it('restores an internal intended route after login and rejects external redirects', () => {
    expect(resolvePostLoginDestination('/training?resume=1')).toBe('/training?resume=1')
    expect(resolvePostLoginDestination('//evil.example')).toEqual({ name: 'home' })
    expect(resolvePostLoginDestination('https://evil.example')).toEqual({ name: 'home' })
  })
})
