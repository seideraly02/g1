import { describe, expect, it } from 'vitest'
import { PersistenceService, type StorageAdapter } from '../../services/persistenceService'
import type { AuthRepository } from './authRepository'
import { persistAuthenticatedUser, readAuthenticatedUser } from './authPersistence'
import { verifyServerSession } from './sessionVerification'
import type { AuthenticatedUser } from './types'

class MemoryStorage implements StorageAdapter {
  private values = new Map<string, string>()
  getItem(key: string) {
    return this.values.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
  removeItem(key: string) {
    this.values.delete(key)
  }
}

const user: AuthenticatedUser = {
  id: 'user-1',
  fullName: 'Аян Серікұлы',
  city: 'Алматы',
  phone: '+77011234567',
  verifiedAt: '2026-07-31T12:00:00.000Z',
}

function repository(session: AuthenticatedUser | null): AuthRepository {
  return {
    requestTelegramCode: async () => {
      throw new Error('unused')
    },
    verifyTelegramCode: async () => {
      throw new Error('unused')
    },
    getSession: async () => session,
    signOut: async () => undefined,
  }
}

describe('server session verification', () => {
  it('denies and removes a forged or stale cached profile', async () => {
    const persistence = new PersistenceService(new MemoryStorage())
    persistAuthenticatedUser(user, persistence)

    expect(await verifyServerSession(repository(null), persistence)).toBeNull()
    expect(readAuthenticatedUser(persistence)).toBeNull()
  })

  it('authorizes and refreshes cache only from a valid server session', async () => {
    const persistence = new PersistenceService(new MemoryStorage())

    expect(await verifyServerSession(repository(user), persistence)).toEqual(user)
    expect(readAuthenticatedUser(persistence)).toEqual(user)
  })
})
