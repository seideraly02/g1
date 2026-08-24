import { describe, expect, it } from 'vitest'
import {
  REQUIRE_AUTHENTICATION,
  resolveAuthenticationRequirement,
  shouldCheckAuthentication,
} from './authAccess'

describe('authentication access policy', () => {
  it('protects learning routes by default', () => {
    expect(REQUIRE_AUTHENTICATION).toBe(true)
    expect(shouldCheckAuthentication(false)).toBe(true)
  })

  it('never asks for authentication on public routes', () => {
    expect(shouldCheckAuthentication(true)).toBe(false)
  })

  it('restores the session gate through the release setting', () => {
    expect(resolveAuthenticationRequirement('true')).toBe(true)
    expect(resolveAuthenticationRequirement('false')).toBe(false)
    expect(resolveAuthenticationRequirement(undefined)).toBe(true)
  })
})
