/**
 * Temporary product switch. Set to true to restore the normal session gate.
 * The auth store and repositories remain intact while public learning access is enabled.
 */
export function resolveAuthenticationRequirement(configuredValue: string | undefined): boolean {
  return configuredValue === 'true'
}

export const REQUIRE_AUTHENTICATION = resolveAuthenticationRequirement(
  import.meta.env.VITE_REQUIRE_AUTHENTICATION,
)

export function shouldCheckAuthentication(isPublicRoute: boolean): boolean {
  return REQUIRE_AUTHENTICATION && !isPublicRoute
}
