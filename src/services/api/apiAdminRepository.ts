import type { UserRole } from '../../features/auth/types'

export interface AdminOverviewDto {
  totalUsers: number
  onlineUsers: number
  offlineUsers: number
  recentRegistrations: number
  diagnosticAttempts: number
  recentDiagnosticAttempts: number
}

export interface AdminUserDto {
  id: string
  firstName: string
  lastName: string
  city: string
  phone: string
  role: UserRole
  createdAt: string
}

export interface AdminUsersPageDto {
  users: AdminUserDto[]
  page: number
  limit: number
  total: number
}

export interface CreateAdminQuestionInput {
  subjectId: string
  topic: string
  text: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface AdminQuestionDto extends CreateAdminQuestionInput {
  id: string
  createdAt: string
}

export class AdminApiError extends Error {
  constructor(readonly kind: 'forbidden' | 'request') {
    super(
      kind === 'forbidden' ? 'Бұл бөлімге кіруге рұқсат жоқ' : 'Деректерді жүктеу мүмкін болмады',
    )
    this.name = 'AdminApiError'
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function nonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0
}

function decodeOverview(value: unknown): AdminOverviewDto | null {
  const data = record(value)
  if (!data) return null
  const keys = [
    'totalUsers',
    'onlineUsers',
    'offlineUsers',
    'recentRegistrations',
    'diagnosticAttempts',
    'recentDiagnosticAttempts',
  ] as const
  if (!keys.every((key) => nonNegativeInteger(data[key]))) return null
  return data as unknown as AdminOverviewDto
}

function decodeUser(value: unknown): AdminUserDto | null {
  const data = record(value)
  if (
    !data ||
    !['id', 'firstName', 'lastName', 'city', 'phone', 'createdAt'].every(
      (key) => typeof data[key] === 'string',
    ) ||
    (data.role !== 'student' && data.role !== 'admin')
  ) {
    return null
  }
  return data as unknown as AdminUserDto
}

function decodeUsersPage(value: unknown): AdminUsersPageDto | null {
  const data = record(value)
  if (
    !data ||
    !Array.isArray(data.users) ||
    !nonNegativeInteger(data.total) ||
    !nonNegativeInteger(data.page) ||
    !nonNegativeInteger(data.limit)
  ) {
    return null
  }
  const users = data.users.map(decodeUser)
  if (users.some((user) => user === null)) return null
  return { users: users as AdminUserDto[], page: data.page, limit: data.limit, total: data.total }
}

function decodeQuestion(value: unknown): AdminQuestionDto | null {
  const data = record(value)
  if (
    !data ||
    !['id', 'subjectId', 'topic', 'text', 'explanation', 'createdAt'].every(
      (key) => typeof data[key] === 'string',
    ) ||
    !Array.isArray(data.options) ||
    data.options.length < 2 ||
    data.options.length > 6 ||
    !data.options.every((option) => typeof option === 'string') ||
    !nonNegativeInteger(data.correctIndex) ||
    data.correctIndex >= data.options.length
  ) {
    return null
  }
  return data as unknown as AdminQuestionDto
}

export class ApiAdminRepository {
  private readonly client: typeof fetch

  constructor(
    private readonly baseUrl: string,
    client: typeof fetch = fetch,
  ) {
    // Native fetch must not be invoked as an object method in some browsers.
    this.client = (input, init) => client(input, init)
  }

  async getOverview(): Promise<AdminOverviewDto> {
    return this.get('/admin/overview', decodeOverview)
  }

  async getUsers(query = '', page = 1, limit = 20): Promise<AdminUsersPageDto> {
    const parameters = new URLSearchParams({ query, page: String(page), limit: String(limit) })
    return this.get(`/admin/users?${parameters}`, decodeUsersPage)
  }

  async createQuestion(input: CreateAdminQuestionInput): Promise<AdminQuestionDto> {
    const response = await this.client(`${this.url}/admin/questions`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const value: unknown = await response.json().catch(() => null)
    if (response.status === 403) throw new AdminApiError('forbidden')
    const question = decodeQuestion(value)
    if (!response.ok || !question) throw new AdminApiError('request')
    return question
  }

  private async get<T>(path: string, decode: (value: unknown) => T | null): Promise<T> {
    const response = await this.client(`${this.url}${path}`, { credentials: 'include' })
    const value: unknown = await response.json().catch(() => null)
    if (response.status === 403) throw new AdminApiError('forbidden')
    const decoded = decode(value)
    if (!response.ok || !decoded) throw new AdminApiError('request')
    return decoded
  }

  private get url() {
    return this.baseUrl.replace(/\/$/, '')
  }
}

export const adminRepository = new ApiAdminRepository(import.meta.env.VITE_API_BASE_URL ?? '')
