import { PersistenceService } from '../../services/persistenceService'
import type { AuthRepository } from './authRepository'
import { clearAuthenticatedUser } from './authPersistence'

export async function verifyServerSession(
  repository: AuthRepository,
  persistence = new PersistenceService(),
) {
  const user = await repository.getSession()
  if (user) return user

  clearAuthenticatedUser(persistence)
  return null
}
