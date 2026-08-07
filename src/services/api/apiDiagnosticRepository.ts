export interface DiagnosticQuestionDto {
  id: string
  topic: string
  text: string
  options: string[]
}

export interface DiagnosticAnswerInput {
  questionId: string
  selectedIndex: number
}

export interface DiagnosticResultDto {
  attemptId: string
  total: number
  correct: number
  insufficientData: boolean
  answers: Array<{
    questionId: string
    isCorrect: boolean
    correctIndex: number
    explanation: string
  }>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function decodeQuestion(value: unknown): DiagnosticQuestionDto | null {
  if (!isRecord(value)) return null
  if (
    typeof value.id !== 'string' ||
    typeof value.topic !== 'string' ||
    typeof value.text !== 'string' ||
    !Array.isArray(value.options) ||
    !value.options.every((option) => typeof option === 'string')
  )
    return null
  return { id: value.id, topic: value.topic, text: value.text, options: value.options }
}

export class ApiDiagnosticRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly client: typeof fetch = fetch,
  ) {}

  async getQuestions(subjectId: string): Promise<DiagnosticQuestionDto[]> {
    const response = await this.client(`${this.url}/diagnostic/${encodeURIComponent(subjectId)}`, {
      credentials: 'include',
    })
    const value: unknown = await response.json().catch(() => null)
    if (!response.ok || !Array.isArray(value))
      throw new Error('Диагностика сұрақтарын жүктеу мүмкін болмады')
    const questions = value.map(decodeQuestion)
    if (questions.some((question) => question === null))
      throw new Error('Серверден қате жауап алынды')
    return questions as DiagnosticQuestionDto[]
  }

  async submit(subjectId: string, answers: DiagnosticAnswerInput[]): Promise<DiagnosticResultDto> {
    const response = await this.client(
      `${this.url}/diagnostic/${encodeURIComponent(subjectId)}/submit`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      },
    )
    const value: unknown = await response.json().catch(() => null)
    if (!response.ok || !isRecord(value)) throw new Error('Нәтижені сақтау мүмкін болмады')
    return value as unknown as DiagnosticResultDto
  }

  private get url() {
    return this.baseUrl.replace(/\/$/, '')
  }
}

export const diagnosticRepository = new ApiDiagnosticRepository(
  import.meta.env.VITE_API_BASE_URL ?? '',
)
