export const postRegistrationRouteName = 'home' as const

export function resolvePostLoginDestination(_redirect: unknown): { name: 'home' } {
  return { name: 'home' }
}
