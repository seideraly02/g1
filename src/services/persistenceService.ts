export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem?(key: string): void
}

export type PersistenceDecoder<T> = (value: unknown) => T | null

function getBrowserStorage(): StorageAdapter | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export class PersistenceService {
  constructor(private readonly storage: StorageAdapter | null = getBrowserStorage()) {}

  read<T>(key: string, decode: PersistenceDecoder<T>): T | null {
    if (!this.storage) {
      return null
    }

    try {
      const value = this.storage.getItem(key)
      if (value === null) {
        return null
      }

      return decode(JSON.parse(value) as unknown)
    } catch {
      return null
    }
  }

  write<T>(key: string, value: T): boolean {
    if (!this.storage) {
      return false
    }

    try {
      this.storage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  }

  remove(key: string): boolean {
    if (!this.storage?.removeItem) {
      return false
    }

    try {
      this.storage.removeItem(key)
      return true
    } catch {
      return false
    }
  }
}
