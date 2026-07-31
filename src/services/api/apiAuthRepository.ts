import type { AuthRepository } from '../../features/auth/authRepository'
import { AuthError } from '../../features/auth/types'
import type {
  AuthenticatedUser,
  CodeRequest,
  RegistrationProfile,
  VerifyCodeInput,
} from '../../features/auth/types'

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function decodeRequest(value: unknown): CodeRequest | null {
  const data = record(value)
  return data &&
    typeof data.requestId === 'string' &&
    typeof data.expiresAt === 'string' &&
    typeof data.resendAfterSeconds === 'number'
    ? {
        requestId: data.requestId,
        expiresAt: data.expiresAt,
        resendAfterSeconds: data.resendAfterSeconds,
      }
    : null
}

function decodeUser(value: unknown): AuthenticatedUser | null {
  const data = record(value)
  if (
    !data ||
    !['id', 'fullName', 'city', 'phone', 'verifiedAt'].every((key) => typeof data[key] === 'string')
  )
    return null
  return data as unknown as AuthenticatedUser
}

function apiError(status: number, value: unknown): AuthError {
  const code = record(value)?.code
  if (code === 'INVALID_CODE') return new AuthError('invalid-code', 'Код дұрыс емес')
  if (code === 'CODE_EXPIRED') return new AuthError('expired-code', 'Кодтың мерзімі аяқталды')
  if (code === 'TELEGRAM_NOT_LINKED')
    return new AuthError(
      'telegram-not-linked',
      'Бұл нөмірге Telegram тіркелгісі байланыстырылмаған',
    )
  if (status === 429) return new AuthError('rate-limited', 'Әрекет тым көп. Біраздан кейін қайтала')
  return new AuthError('server', 'Қызмет уақытша қолжетімсіз. Кейінірек қайтала')
}

export class ApiAuthRepository implements AuthRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly client: typeof fetch = fetch,
  ) {}

  requestTelegramCode(profile: RegistrationProfile) {
    return this.request('/auth/telegram/request-code', 'POST', profile, decodeRequest)
  }
  verifyTelegramCode(input: VerifyCodeInput) {
    return this.request('/auth/telegram/verify-code', 'POST', input, decodeUser)
  }
  async getSession() {
    if (!this.baseUrl.trim()) return null
    const response = await this.client(`${this.url}/auth/session`, {
      credentials: 'include',
    }).catch(() => null)
    if (!response || response.status === 401) return null
    const value: unknown = await response.json().catch(() => null)
    if (!response.ok) throw apiError(response.status, value)
    return decodeUser(value)
  }
  async signOut() {
    if (!this.baseUrl.trim()) return
    await this.client(`${this.url}/auth/session`, { method: 'DELETE', credentials: 'include' })
  }

  private get url() {
    return this.baseUrl.replace(/\/$/, '')
  }
  private async request<T>(
    path: string,
    method: 'POST',
    body: unknown,
    decode: (value: unknown) => T | null,
  ): Promise<T> {
    if (!this.baseUrl.trim())
      throw new AuthError('configuration', 'Тіркелу қызметі әлі бапталмаған')
    let response: Response
    try {
      response = await this.client(`${this.url}${path}`, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch {
      throw new AuthError('offline', 'Интернет байланысын тексеріп, қайта көр')
    }
    const value: unknown = await response.json().catch(() => null)
    if (!response.ok) throw apiError(response.status, value)
    const result = decode(value)
    if (!result) throw new AuthError('server', 'Серверден қате жауап алынды')
    return result
  }
}

export const authRepository = new ApiAuthRepository(import.meta.env.VITE_API_BASE_URL ?? '')
