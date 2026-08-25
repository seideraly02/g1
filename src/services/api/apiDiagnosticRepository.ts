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

export interface DiagnosticSubmissionInput {
  operationId: string
  answers: DiagnosticAnswerInput[]
}

export interface DiagnosticAnswerCheckInput extends DiagnosticAnswerInput {
  operationId: string
}

export interface DiagnosticAnswerResult {
  questionId: string
  selectedIndex: number
  isCorrect: boolean
  correctIndex: number
  explanation: string
}

export interface DiagnosticResultDto {
  attemptId: string
  total: number
  correct: number
  insufficientData: boolean
  answers: Array<{
    questionId: string
    selectedIndex: number
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

function isAnswerResult(value: unknown): value is DiagnosticAnswerResult {
  return (
    isRecord(value) &&
    typeof value.questionId === 'string' &&
    Number.isInteger(value.selectedIndex) &&
    typeof value.isCorrect === 'boolean' &&
    typeof value.correctIndex === 'number' &&
    typeof value.explanation === 'string'
  )
}

export class ApiDiagnosticRepository {
  private readonly client: typeof fetch

  constructor(
    private readonly baseUrl: string,
    client: typeof fetch = fetch,
  ) {
    this.client = (input, init) => client(input, init)
  }

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

  async checkAnswer(
    subjectId: string,
    answer: DiagnosticAnswerCheckInput,
  ): Promise<DiagnosticAnswerResult> {
    const response = await this.client(
      `${this.url}/diagnostic/${encodeURIComponent(subjectId)}/check`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answer),
      },
    )
    const value: unknown = await response.json().catch(() => null)
    if (!response.ok || !isAnswerResult(value)) {
      throw new Error('Жауапты тексеру мүмкін болмады')
    }
    return value as unknown as DiagnosticAnswerResult
  }

  async submit(subjectId: string, input: DiagnosticSubmissionInput): Promise<DiagnosticResultDto> {
    const response = await this.client(
      `${this.url}/diagnostic/${encodeURIComponent(subjectId)}/submit`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
    )
    const value: unknown = await response.json().catch(() => null)
    if (
      !response.ok ||
      !isRecord(value) ||
      typeof value.attemptId !== 'string' ||
      !Number.isInteger(value.total) ||
      !Number.isInteger(value.correct) ||
      typeof value.insufficientData !== 'boolean' ||
      !Array.isArray(value.answers) ||
      !value.answers.every(isAnswerResult)
    ) {
      throw new Error('Нәтижені сақтау мүмкін болмады')
    }
    return value as unknown as DiagnosticResultDto
  }

  private get url() {
    return this.baseUrl.replace(/\/$/, '')
  }
}

export const diagnosticRepository = new ApiDiagnosticRepository(
  import.meta.env.VITE_API_BASE_URL ?? '',
)
