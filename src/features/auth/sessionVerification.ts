import { PersistenceService } from '../../services/persistenceService'
import type { AuthRepository } from './authRepository'
import { clearAuthenticatedUser, persistAuthenticatedUser } from './authPersistence'

export async function verifyServerSession(
  repository: AuthRepository,
  persistence = new PersistenceService(),
) {
  try {
    const user = await repository.getSession()
    if (user) {
      persistAuthenticatedUser(user, persistence)
      return user
    }
  } catch {
    // Cached profile data never authorizes a protected route.
  }

  clearAuthenticatedUser(persistence)
  return null
}
