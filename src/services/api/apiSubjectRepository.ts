export interface SubjectDto {
  id: string
  name: string
}

function isSubject(value: unknown): value is SubjectDto {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).id === 'string' &&
    typeof (value as Record<string, unknown>).name === 'string'
  )
}

export class ApiSubjectRepository {
  private readonly client: typeof fetch

  constructor(
    private readonly baseUrl: string,
    client: typeof fetch = fetch,
  ) {
    this.client = (input, init) => client(input, init)
  }

  async getSubjects(): Promise<SubjectDto[]> {
    const response = await this.client(`${this.baseUrl.replace(/\/$/, '')}/subjects`, {
      credentials: 'include',
    })
    const value: unknown = await response.json().catch(() => null)
    if (!response.ok || !Array.isArray(value) || !value.every(isSubject)) {
      throw new Error('Пәндерді жүктеу мүмкін болмады')
    }
    return value
  }
}

export const subjectRepository = new ApiSubjectRepository(import.meta.env.VITE_API_BASE_URL ?? '')
