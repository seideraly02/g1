export const postRegistrationRouteName = 'profile' as const

export function resolvePostLoginDestination(_redirect: unknown): { name: 'profile' } {
  return { name: 'profile' }
}
