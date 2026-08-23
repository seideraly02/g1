import { describe, expect, it } from 'vitest'
import {
  REQUIRE_AUTHENTICATION,
  resolveAuthenticationRequirement,
  shouldCheckAuthentication,
} from './authAccess'

describe('temporary authentication access policy', () => {
  it('keeps every learning route open while authentication is disabled', () => {
    expect(REQUIRE_AUTHENTICATION).toBe(false)
    expect(shouldCheckAuthentication(false)).toBe(false)
  })

  it('never asks for authentication on public routes', () => {
    expect(shouldCheckAuthentication(true)).toBe(false)
  })

  it('restores the session gate through the release setting', () => {
    expect(resolveAuthenticationRequirement('true')).toBe(true)
    expect(resolveAuthenticationRequirement('false')).toBe(false)
    expect(resolveAuthenticationRequirement(undefined)).toBe(false)
  })
})
