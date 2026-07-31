import { PersistenceService } from '../../services/persistenceService'
import { resetDefaultSessionRepository } from '../session/sessionApplication'

const accountDataKeys = [
  'qadam.settings.v1',
  'qadam.guest.v1',
  'qadam.sessions.v1',
  'qadam.plan.v1',
  'qadam.syncQueue.v1',
  'qadam.auth.v1',
] as const

export function signOutAccount(persistence = new PersistenceService()): void {
  for (const key of accountDataKeys) {
    persistence.remove(key)
  }

  resetDefaultSessionRepository(persistence)
}
