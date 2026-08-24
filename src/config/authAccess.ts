/** Authentication is release-safe by default; only an explicit local `false` bypasses it. */
export function resolveAuthenticationRequirement(configuredValue: string | undefined): boolean {
  return configuredValue !== 'false'
}

export const REQUIRE_AUTHENTICATION = resolveAuthenticationRequirement(
  import.meta.env.VITE_REQUIRE_AUTHENTICATION,
)

export function shouldCheckAuthentication(isPublicRoute: boolean): boolean {
  return REQUIRE_AUTHENTICATION && !isPublicRoute
}
