import { describe, expect, it } from 'vitest'
import { postRegistrationRouteName, resolvePostLoginDestination } from './authNavigation'

describe('post-auth navigation', () => {
  it('sends both registration and direct login to the home page', () => {
    expect(postRegistrationRouteName).toBe('home')
    expect(resolvePostLoginDestination(undefined)).toEqual({ name: 'home' })
  })

  it('always opens the home page after login', () => {
    expect(resolvePostLoginDestination('/training?resume=1')).toEqual({ name: 'home' })
    expect(resolvePostLoginDestination('//evil.example')).toEqual({ name: 'home' })
    expect(resolvePostLoginDestination('https://evil.example')).toEqual({ name: 'home' })
  })
})
