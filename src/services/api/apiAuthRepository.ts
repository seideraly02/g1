import type { AuthRepository } from '../../features/auth/authRepository'
import { AuthError } from '../../features/auth/types'
import type { AuthenticatedUser, LoginInput, RegistrationRequest } from '../../features/auth/types'

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function decodeUser(value: unknown): AuthenticatedUser | null {
  const data = record(value)
  if (
    !data ||
    !['id', 'firstName', 'lastName', 'city', 'phone', 'createdAt'].every(
      (key) => typeof data[key] === 'string',
    )
  ) {
    return null
  }
  return data as unknown as AuthenticatedUser
}

function apiError(status: number, value: unknown): AuthError {
  const code = record(value)?.code
  if (code === 'INVALID_CREDENTIALS') {
    return new AuthError('invalid-credentials', 'Телефон нөмірі немесе құпиясөз қате')
  }
  if (code === 'PHONE_ALREADY_REGISTERED') {
    return new AuthError('phone-already-registered', 'Бұл нөмір тіркелген. «Кіру» бөлімін таңда')
  }
  if (code === 'INVALID_PHONE' || code === 'VALIDATION_ERROR') {
    return new AuthError('validation', 'Енгізілген деректерді тексеріп, қайталап көр')
  }
  if (status === 429) {
    return new AuthError('rate-limited', 'Әрекет тым көп. 15 минуттан кейін қайталап көр')
  }
  if (status === 401) {
    return new AuthError('invalid-credentials', 'Телефон нөмірі немесе құпиясөз қате')
  }
  return new AuthError('server', 'Қызмет уақытша қолжетімсіз. Кейінірек қайталап көр')
}

export class ApiAuthRepository implements AuthRepository {
  private readonly client: typeof fetch

  constructor(
    private readonly baseUrl: string,
    client: typeof fetch = fetch,
  ) {
    this.client = (input, init) => client(input, init)
  }

  register(input: RegistrationRequest) {
    return this.request('/auth/register', input)
  }

  login(input: LoginInput) {
    return this.request('/auth/login', input)
  }

  async getSession() {
    if (!this.baseUrl.trim()) return null
    let response: Response
    try {
      response = await this.client(`${this.url}/auth/session`, { credentials: 'include' })
    } catch {
      throw new AuthError('offline', 'Интернет байланысын тексеріп, қайталап көр')
    }
    if (response.status === 401) return null
    const value: unknown = await response.json().catch(() => null)
    if (!response.ok) throw apiError(response.status, value)
    const user = decodeUser(value)
    if (!user) throw new AuthError('server', 'Серверден қате жауап алынды')
    return user
  }

  async signOut() {
    if (!this.baseUrl.trim()) return
    let response: Response
    try {
      response = await this.client(`${this.url}/auth/session`, {
        method: 'DELETE',
        credentials: 'include',
      })
    } catch {
      throw new AuthError('offline', 'Интернет байланысын тексеріп, қайталап көр')
    }
    if (!response.ok) {
      const value: unknown = await response.json().catch(() => null)
      throw apiError(response.status, value)
    }
  }

  private get url() {
    return this.baseUrl.replace(/\/$/, '')
  }

  private async request(path: string, body: unknown): Promise<AuthenticatedUser> {
    if (!this.baseUrl.trim()) {
      throw new AuthError('configuration', 'Кіру қызметі әлі бапталмаған')
    }
    let response: Response
    try {
      response = await this.client(`${this.url}${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch {
      throw new AuthError('offline', 'Интернет байланысын тексеріп, қайталап көр')
    }
    const value: unknown = await response.json().catch(() => null)
    if (!response.ok) throw apiError(response.status, value)
    const user = decodeUser(value)
    if (!user) throw new AuthError('server', 'Серверден қате жауап алынды')
    return user
  }
}

export const authRepository = new ApiAuthRepository(import.meta.env.VITE_API_BASE_URL ?? '')
