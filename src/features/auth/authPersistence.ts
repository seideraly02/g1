import { PersistenceService } from '../../services/persistenceService'
export const authStorageKey = 'qadam.auth.v1'

export function clearAuthenticatedUser(persistence = new PersistenceService()) {
  persistence.remove(authStorageKey)
}
