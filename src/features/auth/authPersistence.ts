import { PersistenceService } from '../../services/persistenceService'
import type { AuthenticatedUser } from './types'

export const authStorageKey = 'qadam.auth.v1'

function decodeUser(value: unknown): AuthenticatedUser | null {
  if (!value || typeof value !== 'object') return null
  const payload = value as Record<string, unknown>
  const user = payload.user
  if (payload.version !== 1 || !user || typeof user !== 'object') return null
  const fields = user as Record<string, unknown>
  return ['id', 'fullName', 'city', 'phone', 'verifiedAt'].every(
    (key) => typeof fields[key] === 'string' && fields[key].length > 0,
  )
    ? (fields as unknown as AuthenticatedUser)
    : null
}

export function readAuthenticatedUser(persistence = new PersistenceService()) {
  return persistence.read(authStorageKey, decodeUser)
}

export function persistAuthenticatedUser(
  user: AuthenticatedUser,
  persistence = new PersistenceService(),
) {
  return persistence.write(authStorageKey, { version: 1, user })
}

export function clearAuthenticatedUser(persistence = new PersistenceService()) {
  persistence.remove(authStorageKey)
}
