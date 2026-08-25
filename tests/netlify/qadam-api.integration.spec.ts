import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ApiError, QadamApi, readConfig } from '../../netlify/functions/lib/qadam-api.mjs'

const connectionString = process.env.QADAM_TEST_DATABASE_URL
const describeDatabase = connectionString ? describe : describe.skip
const { Pool } = pg

describeDatabase('Qadam Netlify PostgreSQL API', () => {
  const pool = new Pool({ connectionString, max: 3 })
  const api = new QadamApi(
    pool,
    readConfig({
      QADAM_SECURITY_PEPPER: 'integration-test-pepper-at-least-32-bytes',
      PASSWORD_BCRYPT_STRENGTH: '10',
      SESSION_TTL_DAYS: '30',
    }),
  )

  beforeAll(async () => {
    await pool.query(
      'truncate diagnostic_answers,diagnostic_attempts,diagnostic_answer_checks,sessions,login_attempts,registration_attempts,users cascade',
    )
  })

  afterAll(async () => {
    await pool.end()
  })

  it('runs registration, login, session, rate limits, subjects, diagnostic, and logout', async () => {
    const registration = {
      firstName: 'Аян',
      lastName: 'Серікұлы',
      city: 'Алматы',
      phone: '+77015550901',
      password: 'strong-password-901',
    }
    const registered = await api.register(registration, '203.0.113.90')
    expect(registered.user).toMatchObject({
      firstName: 'Аян',
      lastName: 'Серікұлы',
      city: 'Алматы',
      phone: '+77015550901',
    })
    expect(await api.session(registered.sessionToken)).toEqual(registered.user)
    const stored = await pool.query('select password_hash from users where phone=$1', [
      '+77015550901',
    ])
    expect(stored.rows[0].password_hash).toMatch(/^\$2[aby]\$/)
    expect(stored.rows[0].password_hash).not.toContain(registration.password)

    const loggedIn = await api.login(
      { phone: registration.phone, password: registration.password },
      '203.0.113.91',
    )
    expect(loggedIn.user.id).toBe(registered.user.id)

    await pool.query(
      `insert into users(id,full_name,first_name,last_name,city,phone,password_hash)
       values($1,$2,$3,$4,$5,$6,null)`,
      [
        '7e3ba065-2fab-46c7-930e-0122b14937f1',
        'Legacy User',
        'Legacy',
        'User',
        'Астана',
        '+77015550902',
      ],
    )
    await expect(
      api.login({ phone: '+77015550902', password: 'strong-password-902' }, '203.0.113.97'),
    ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_CREDENTIALS' })
    await expect(
      api.register({ ...registration, phone: '+77015550902' }, '203.0.113.98'),
    ).rejects.toMatchObject({ statusCode: 409, code: 'PHONE_ALREADY_REGISTERED' })

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(
        api.login({ phone: registration.phone, password: 'wrong-password' }, '203.0.113.92'),
      ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_CREDENTIALS' })
    }
    await expect(
      api.login({ phone: registration.phone, password: 'wrong-password' }, '203.0.113.92'),
    ).rejects.toMatchObject({ statusCode: 429, code: 'RATE_LIMITED' })

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await expect(api.register(registration, `203.0.113.${93 + attempt}`)).rejects.toMatchObject({
        statusCode: 409,
        code: 'PHONE_ALREADY_REGISTERED',
      })
    }
    await expect(api.register(registration, '203.0.113.95')).rejects.toMatchObject({
      statusCode: 429,
      code: 'RATE_LIMITED',
    })

    expect(await api.subjects()).toEqual([{ id: 'history-kz', name: 'Қазақстан тарихы' }])
    const questions = await api.questions('history-kz')
    expect(questions).toHaveLength(5)
    expect(questions[0]).not.toHaveProperty('correctIndex')
    const answers = [
      { questionId: 'history-1', selectedIndex: 0 },
      { questionId: 'history-2', selectedIndex: 2 },
      { questionId: 'history-3', selectedIndex: 1 },
      { questionId: 'history-4', selectedIndex: 2 },
      { questionId: 'history-5', selectedIndex: 2 },
    ]
    await expect(
      api.checkDiagnosticAnswer(
        'history-kz',
        {
          operationId: 'session-integration-901',
          questionId: 'history-1',
          selectedIndex: 0,
        },
        registered.user.id,
      ),
    ).resolves.toMatchObject({
      questionId: 'history-1',
      selectedIndex: 0,
      isCorrect: true,
      correctIndex: 0,
    })
    await expect(
      api.checkDiagnosticAnswer(
        'history-kz',
        {
          operationId: 'session-integration-901',
          questionId: 'history-1',
          selectedIndex: 1,
        },
        registered.user.id,
      ),
    ).resolves.toMatchObject({ selectedIndex: 0, isCorrect: true })
    for (const answer of answers.slice(1)) {
      await api.checkDiagnosticAnswer(
        'history-kz',
        { operationId: 'session-integration-901', ...answer },
        registered.user.id,
      )
    }
    const lockedAnswers = await pool.query(
      `select question_id,selected_option from diagnostic_answer_checks
       where user_id=$1 and operation_id=$2 order by question_id`,
      [registered.user.id, 'session-integration-901'],
    )
    expect(lockedAnswers.rows).toHaveLength(5)
    expect(lockedAnswers.rows[0]).toMatchObject({
      question_id: 'history-1',
      selected_option: 0,
    })
    await expect(
      api.submitDiagnostic(
        'history-kz',
        {
          operationId: 'session-integration-901',
          answers: answers.map((answer, index) =>
            index === 0 ? { ...answer, selectedIndex: 1 } : answer,
          ),
        },
        registered.user.id,
      ),
    ).rejects.toMatchObject({ statusCode: 409, code: 'DIAGNOSTIC_ANSWERS_CHANGED' })
    const diagnostic = await api.submitDiagnostic(
      'history-kz',
      {
        operationId: 'session-integration-901',
        answers,
      },
      registered.user.id,
    )
    expect(diagnostic).toMatchObject({ total: 5, correct: 5, insufficientData: true })
    expect(diagnostic.answers).toHaveLength(5)
    const repeated = await api.submitDiagnostic(
      'history-kz',
      {
        operationId: 'session-integration-901',
        answers: [
          { questionId: 'history-1', selectedIndex: 1 },
          { questionId: 'history-2', selectedIndex: 1 },
          { questionId: 'history-3', selectedIndex: 1 },
          { questionId: 'history-4', selectedIndex: 1 },
          { questionId: 'history-5', selectedIndex: 1 },
        ],
      },
      registered.user.id,
    )
    expect(repeated).toEqual(diagnostic)
    const attempts = await pool.query(
      'select count(*)::int as count from diagnostic_attempts where user_id=$1',
      [registered.user.id],
    )
    expect(attempts.rows[0].count).toBe(1)

    await api.logout(loggedIn.sessionToken)
    expect(await api.session(loggedIn.sessionToken)).toBeNull()
  }, 20_000)

  it('uses a generic login error for malformed phones', async () => {
    await expect(
      api.login({ phone: 'bad', password: 'bad' }, '203.0.113.96'),
    ).rejects.toMatchObject(new ApiError(401, 'INVALID_CREDENTIALS'))
  })
})
