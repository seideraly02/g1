export const postRegistrationRouteName = 'subjects-onboarding' as const

export function resolvePostLoginDestination(redirect: unknown): string | { name: 'home' } {
  if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect
  }
  return { name: 'home' }
}
