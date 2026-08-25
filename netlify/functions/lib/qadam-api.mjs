import { createHmac, randomBytes, randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'

const LOGIN_PHONE_LIMIT = 5
const LOGIN_CLIENT_LIMIT = 20
const REGISTRATION_PHONE_LIMIT = 3
const REGISTRATION_CLIENT_LIMIT = 10
const RATE_WINDOW_MINUTES = 15
const QUESTION_COUNT = 5
const ADMIN_USER_PAGE_LIMIT = 50

export class ApiError extends Error {
  constructor(statusCode, code) {
    super(code)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
  }
}

export function readConfig(env = process.env) {
  const pepper = env.QADAM_SECURITY_PEPPER ?? ''
  if (Buffer.byteLength(pepper, 'utf8') < 32) {
    throw new Error('QADAM_SECURITY_PEPPER must contain at least 32 bytes')
  }
  const bcryptCost = Number(env.PASSWORD_BCRYPT_STRENGTH ?? '12')
  if (!Number.isInteger(bcryptCost) || bcryptCost < 10 || bcryptCost > 14) {
    throw new Error('PASSWORD_BCRYPT_STRENGTH must be an integer from 10 to 14')
  }
  const sessionTtlDays = Number(env.SESSION_TTL_DAYS ?? '30')
  if (!Number.isInteger(sessionTtlDays) || sessionTtlDays < 1 || sessionTtlDays > 90) {
    throw new Error('SESSION_TTL_DAYS must be an integer from 1 to 90')
  }
  return { pepper, bcryptCost, sessionTtlDays }
}

export class QadamApi {
  constructor(pool, config) {
    this.pool = pool
    this.config = config
    this.dummyPasswordHash = bcrypt.hashSync(
      randomBytes(32).toString('base64url'),
      config.bcryptCost,
    )
  }

  async register(input, clientAddress) {
    const firstName = normalizeText(input?.firstName, 2, 60)
    const lastName = normalizeText(input?.lastName, 2, 60)
    const city = normalizeText(input?.city, 2, 80)
    const phone = normalizePhone(input?.phone, false)
    validatePassword(input?.password)

    const phoneFingerprint = this.hash(phone)
    const requestFingerprint = this.hash(clientAddress || 'unknown')
    const client = await this.pool.connect()
    try {
      await client.query('begin')
      await this.lock(client, `register-phone:${phoneFingerprint}`)
      await this.lock(client, `register-request:${requestFingerprint}`)
      const limited =
        (await countAttempts(
          client,
          'registration_attempts',
          'phone_fingerprint',
          phoneFingerprint,
        )) >= REGISTRATION_PHONE_LIMIT ||
        (await countAttempts(
          client,
          'registration_attempts',
          'request_fingerprint',
          requestFingerprint,
        )) >= REGISTRATION_CLIENT_LIMIT
      if (limited) {
        await client.query('rollback')
        throw new ApiError(429, 'RATE_LIMITED')
      }

      await client.query(
        `insert into registration_attempts(id,phone_fingerprint,request_fingerprint)
         values($1,$2,$3)`,
        [randomUUID(), phoneFingerprint, requestFingerprint],
      )
      const existing = await client.query('select 1 from users where phone=$1', [phone])
      if (existing.rowCount > 0) {
        await client.query('commit')
        throw new ApiError(409, 'PHONE_ALREADY_REGISTERED')
      }

      const passwordHash = await bcrypt.hash(input.password, this.config.bcryptCost)
      const userId = randomUUID()
      const inserted = await client.query(
        `insert into users(id,full_name,first_name,last_name,city,phone,password_hash)
         values($1,$2,$3,$4,$5,$6,$7)
         returning id,first_name,last_name,city,phone,role,created_at`,
        [userId, `${firstName} ${lastName}`, firstName, lastName, city, phone, passwordHash],
      )
      const result = await this.createSession(client, inserted.rows[0])
      await client.query('commit')
      return result
    } catch (error) {
      if (!(
        error instanceof ApiError &&
        ['RATE_LIMITED', 'PHONE_ALREADY_REGISTERED'].includes(error.code)
      )) {
        await rollbackQuietly(client)
      }
      if (error?.code === '23505') throw new ApiError(409, 'PHONE_ALREADY_REGISTERED')
      throw error
    } finally {
      client.release()
    }
  }

  async login(input, clientAddress) {
    const phone = normalizePhone(input?.phone, true)
    const phoneFingerprint = this.hash(phone)
    const requestFingerprint = this.hash(clientAddress || 'unknown')
    const client = await this.pool.connect()
    try {
      await client.query('begin')
      await this.lock(client, `login-phone:${phoneFingerprint}`)
      await this.lock(client, `login-request:${requestFingerprint}`)
      const limited =
        (await countAttempts(
          client,
          'login_attempts',
          'phone_fingerprint',
          phoneFingerprint,
          'succeeded=false and ',
        )) >= LOGIN_PHONE_LIMIT ||
        (await countAttempts(
          client,
          'login_attempts',
          'request_fingerprint',
          requestFingerprint,
          'succeeded=false and ',
        )) >= LOGIN_CLIENT_LIMIT
      if (limited) {
        await client.query('rollback')
        throw new ApiError(429, 'RATE_LIMITED')
      }

      const attemptId = randomUUID()
      await client.query(
        `insert into login_attempts(id,phone_fingerprint,request_fingerprint)
         values($1,$2,$3)`,
        [attemptId, phoneFingerprint, requestFingerprint],
      )
      const found = await client.query(
        `select id,first_name,last_name,city,phone,password_hash,role,created_at
         from users where phone=$1`,
        [phone],
      )
      const user = found.rows[0] ?? null
      const password = passwordWithinBcryptLimit(input?.password) ? input.password : ''
      const matches = await bcrypt.compare(password, user?.password_hash ?? this.dummyPasswordHash)
      if (!user || !user.password_hash || !password || !matches) {
        await client.query('commit')
        throw new ApiError(401, 'INVALID_CREDENTIALS')
      }

      await client.query('update login_attempts set succeeded=true where id=$1', [attemptId])
      const result = await this.createSession(client, user)
      await client.query('commit')
      return result
    } catch (error) {
      if (!(
        error instanceof ApiError && ['RATE_LIMITED', 'INVALID_CREDENTIALS'].includes(error.code)
      )) {
        await rollbackQuietly(client)
      }
      throw error
    } finally {
      client.release()
    }
  }

  async session(token) {
    if (!token) return null
    const tokenHash = this.hash(token)
    await this.pool.query(
      `update sessions set last_seen_at=now()
       where token_hash=$1 and revoked_at is null and expires_at>now()
         and last_seen_at < now() - interval '1 minute'`,
      [tokenHash],
    )
    const result = await this.pool.query(
      `select u.id,u.first_name,u.last_name,u.city,u.phone,u.role,u.created_at
       from sessions s join users u on u.id=s.user_id
       where s.token_hash=$1 and s.revoked_at is null and s.expires_at>now()`,
      [tokenHash],
    )
    return result.rows[0] ? userDto(result.rows[0]) : null
  }

  async logout(token) {
    if (!token) return
    await this.pool.query(
      'update sessions set revoked_at=now() where token_hash=$1 and revoked_at is null',
      [this.hash(token)],
    )
  }

  async subjects() {
    const result = await this.pool.query('select id,name from subjects order by sort_order')
    return result.rows
  }

  async adminOverview(user) {
    requireAdmin(user)
    const result = await this.pool.query(
      `select
         (select count(*)::int from users) as total_users,
         (select count(distinct user_id)::int from sessions
          where revoked_at is null and expires_at>now()
            and last_seen_at>now()-interval '5 minutes') as online_users,
         (select count(*)::int from users
          where created_at>now()-interval '7 days') as recent_registrations,
         (select count(*)::int from diagnostic_attempts) as diagnostic_attempts,
         (select count(*)::int from diagnostic_attempts
          where completed_at>now()-interval '7 days') as recent_diagnostic_attempts`,
    )
    const row = result.rows[0]
    return {
      totalUsers: row.total_users,
      onlineUsers: row.online_users,
      offlineUsers: row.total_users - row.online_users,
      recentRegistrations: row.recent_registrations,
      diagnosticAttempts: row.diagnostic_attempts,
      recentDiagnosticAttempts: row.recent_diagnostic_attempts,
    }
  }

  async adminUsers(user, input = {}) {
    requireAdmin(user)
    const page = boundedInteger(input.page, 1, 1000, 1)
    const limit = boundedInteger(input.limit, 1, ADMIN_USER_PAGE_LIMIT, 20)
    const query = normalizeSearch(input.query)
    const pattern = `%${escapeLike(query)}%`
    const where = query
      ? `where first_name ilike $1 escape '\\'
          or last_name ilike $1 escape '\\'
          or city ilike $1 escape '\\'
          or phone ilike $1 escape '\\'`
      : ''
    const values = query ? [pattern] : []
    const count = await this.pool.query(`select count(*)::int as count from users ${where}`, values)
    const result = await this.pool.query(
      `select id,first_name,last_name,city,phone,role,created_at
       from users ${where}
       order by created_at desc,id desc
       limit $${values.length + 1} offset $${values.length + 2}`,
      [...values, limit, (page - 1) * limit],
    )
    return {
      users: result.rows.map(adminUserDto),
      page,
      limit,
      total: count.rows[0].count,
    }
  }

  async createAdminQuestion(user, input) {
    requireAdmin(user)
    const subjectId = normalizeSubjectId(input?.subjectId)
    const topic = normalizeText(input?.topic, 2, 120)
    const text = normalizeText(input?.text, 10, 1000)
    const explanation = normalizeText(input?.explanation, 5, 2000)
    const options = normalizeOptions(input?.options)
    if (
      !Number.isInteger(input?.correctIndex) ||
      input.correctIndex < 0 ||
      input.correctIndex >= options.length
    ) {
      throw new ApiError(400, 'VALIDATION_ERROR')
    }
    const client = await this.pool.connect()
    try {
      await client.query('begin')
      await this.lock(client, `admin-question:${subjectId}`)
      const subject = await client.query('select 1 from subjects where id=$1', [subjectId])
      if (!subject.rows[0]) throw new ApiError(400, 'INVALID_SUBJECT')
      const sort = await client.query(
        'select coalesce(min(sort_order),1)-1 as next_sort from questions where subject_id=$1',
        [subjectId],
      )
      const id = `question-${randomUUID()}`
      const inserted = await client.query(
        `insert into questions(
           id,subject_id,topic,prompt,options,correct_option,explanation,sort_order,created_by
         ) values($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9)
         returning id,subject_id,topic,prompt,options,correct_option,explanation,created_at`,
        [
          id,
          subjectId,
          topic,
          text,
          JSON.stringify(options),
          input.correctIndex,
          explanation,
          sort.rows[0].next_sort,
          user.id,
        ],
      )
      await client.query('commit')
      return adminQuestionDto(inserted.rows[0])
    } catch (error) {
      await rollbackQuietly(client)
      throw error
    } finally {
      client.release()
    }
  }

  async questions(subjectId) {
    const result = await this.pool.query(
      `select id,topic,prompt as text,options
       from questions where subject_id=$1 and is_active=true order by sort_order limit $2`,
      [subjectId, QUESTION_COUNT],
    )
    if (result.rowCount !== QUESTION_COUNT) {
      throw new ApiError(503, 'QUESTION_BANK_INCOMPLETE')
    }
    return result.rows
  }

  async checkDiagnosticAnswer(subjectId, body, userId) {
    if (
      typeof body?.operationId !== 'string' ||
      !/^[A-Za-z0-9:_-]{1,100}$/.test(body.operationId) ||
      typeof body?.questionId !== 'string' ||
      !body.questionId ||
      !Number.isInteger(body.selectedIndex)
    ) {
      throw new ApiError(400, 'INVALID_ANSWERS')
    }
    const client = await this.pool.connect()
    try {
      await client.query('begin')
      await this.lock(client, `diagnostic:${userId}:${body.operationId}`)
      const operation = await client.query(
        `select subject_id from diagnostic_answer_checks
         where user_id=$1 and operation_id=$2 limit 1`,
        [userId, body.operationId],
      )
      if (operation.rows[0] && operation.rows[0].subject_id !== subjectId) {
        throw new ApiError(409, 'DIAGNOSTIC_OPERATION_CONFLICT')
      }
      const existing = await client.query(
        `select result_json from diagnostic_answer_checks
         where user_id=$1 and operation_id=$2 and question_id=$3`,
        [userId, body.operationId, body.questionId],
      )
      if (existing.rows[0]) {
        await client.query('commit')
        return existing.rows[0].result_json
      }
      const found = await client.query(
        `select correct_option,explanation,jsonb_array_length(options) as option_count
         from questions where subject_id=$1 and id=$2 and is_active=true`,
        [subjectId, body.questionId],
      )
      const question = found.rows[0]
      if (!question) throw new ApiError(400, 'INVALID_QUESTION')
      if (body.selectedIndex < 0 || body.selectedIndex >= question.option_count) {
        throw new ApiError(400, 'INVALID_ANSWERS')
      }
      const result = {
        questionId: body.questionId,
        selectedIndex: body.selectedIndex,
        isCorrect: body.selectedIndex === question.correct_option,
        correctIndex: question.correct_option,
        explanation: question.explanation,
      }
      await client.query(
        `insert into diagnostic_answer_checks(
           user_id,operation_id,subject_id,question_id,selected_option,is_correct,result_json
         ) values($1,$2,$3,$4,$5,$6,$7::jsonb)`,
        [
          userId,
          body.operationId,
          subjectId,
          body.questionId,
          body.selectedIndex,
          result.isCorrect,
          JSON.stringify(result),
        ],
      )
      await client.query('commit')
      return result
    } catch (error) {
      await rollbackQuietly(client)
      throw error
    } finally {
      client.release()
    }
  }

  async submitDiagnostic(subjectId, body, userId) {
    const answers = body?.answers
    const operationId = body?.operationId
    if (
      typeof operationId !== 'string' ||
      !/^[A-Za-z0-9:_-]{1,100}$/.test(operationId) ||
      !Array.isArray(answers) ||
      answers.length !== QUESTION_COUNT ||
      new Set(answers.map((answer) => answer?.questionId)).size !== QUESTION_COUNT ||
      answers.some(
        (answer) =>
          !answer ||
          typeof answer.questionId !== 'string' ||
          !answer.questionId ||
          !Number.isInteger(answer.selectedIndex),
      )
    ) {
      throw new ApiError(400, 'INVALID_ANSWERS')
    }

    const questionIds = answers.map((answer) => answer.questionId)
    const client = await this.pool.connect()
    try {
      await client.query('begin')
      await this.lock(client, `diagnostic:${userId}:${operationId}`)
      const existing = await client.query(
        `select subject_id,result_json from diagnostic_attempts
         where user_id=$1 and operation_id=$2`,
        [userId, operationId],
      )
      if (existing.rows[0]) {
        if (existing.rows[0].subject_id !== subjectId) {
          throw new ApiError(409, 'DIAGNOSTIC_OPERATION_CONFLICT')
        }
        await client.query('commit')
        return existing.rows[0].result_json
      }
      const checked = await client.query(
        `select question_id,selected_option,is_correct,result_json from diagnostic_answer_checks
         where user_id=$1 and operation_id=$2 and subject_id=$3`,
        [userId, operationId, subjectId],
      )
      const checkedSelections = new Map(
        checked.rows.map((answer) => [answer.question_id, answer.selected_option]),
      )
      if (
        checked.rowCount !== QUESTION_COUNT ||
        answers.some((answer) => checkedSelections.get(answer.questionId) !== answer.selectedIndex)
      ) {
        throw new ApiError(409, 'DIAGNOSTIC_ANSWERS_CHANGED')
      }
      const snapshots = new Map(
        checked.rows.map((answer) => [answer.question_id, answer.result_json]),
      )
      const results = questionIds.map((questionId) => snapshots.get(questionId))
      const correct = results.filter((answer) => answer.isCorrect).length
      const attemptId = randomUUID()
      const response = {
        attemptId,
        total: QUESTION_COUNT,
        correct,
        insufficientData: true,
        answers: results,
      }
      await client.query(
        `insert into diagnostic_attempts(
           id,user_id,operation_id,subject_id,correct_count,total_count,result_json
         ) values($1,$2,$3,$4,$5,$6,$7::jsonb)`,
        [
          attemptId,
          userId,
          operationId,
          subjectId,
          correct,
          QUESTION_COUNT,
          JSON.stringify(response),
        ],
      )
      for (let index = 0; index < answers.length; index += 1) {
        await client.query(
          `insert into diagnostic_answers(attempt_id,question_id,selected_option,is_correct)
           values($1,$2,$3,$4)`,
          [
            attemptId,
            answers[index].questionId,
            answers[index].selectedIndex,
            results[index].isCorrect,
          ],
        )
      }
      await client.query('commit')
      return response
    } catch (error) {
      await rollbackQuietly(client)
      throw error
    } finally {
      client.release()
    }
  }

  async createSession(client, user) {
    const token = randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + this.config.sessionTtlDays * 86_400_000)
    await client.query(
      'insert into sessions(id,user_id,token_hash,expires_at) values($1,$2,$3,$4)',
      [randomUUID(), user.id, this.hash(token), expiresAt],
    )
    return { sessionToken: token, user: userDto(user) }
  }

  hash(value) {
    return createHmac('sha256', this.config.pepper).update(value).digest('hex')
  }

  async lock(client, key) {
    await client.query('select pg_advisory_xact_lock(hashtextextended($1,0))', [key])
  }
}

async function countAttempts(client, table, column, value, predicate = '') {
  const allowed = new Set([
    'registration_attempts:phone_fingerprint',
    'registration_attempts:request_fingerprint',
    'login_attempts:phone_fingerprint',
    'login_attempts:request_fingerprint',
  ])
  if (!allowed.has(`${table}:${column}`)) throw new Error('Unsupported rate-limit dimension')
  const result = await client.query(
    `select count(*)::int as count from ${table}
     where ${predicate}${column}=$1 and created_at > now() - ($2 * interval '1 minute')`,
    [value, RATE_WINDOW_MINUTES],
  )
  return result.rows[0].count
}

function normalizeText(value, min, max) {
  const normalized = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
  if (normalized.length < min || normalized.length > max) {
    throw new ApiError(400, 'VALIDATION_ERROR')
  }
  return normalized
}

function normalizePhone(value, genericError) {
  const normalized = typeof value === 'string' ? value.replace(/[\s()-]/g, '') : ''
  if (/^\+77\d{9}$/.test(normalized)) return normalized
  if (genericError) return '+70000000000'
  throw new ApiError(400, 'INVALID_PHONE')
}

function passwordWithinBcryptLimit(password) {
  return (
    typeof password === 'string' &&
    password.length <= 72 &&
    Buffer.byteLength(password, 'utf8') <= 72
  )
}

function validatePassword(password) {
  if (!passwordWithinBcryptLimit(password) || password.length < 8) {
    throw new ApiError(400, 'VALIDATION_ERROR')
  }
}

function userDto(row) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    city: row.city,
    phone: row.phone,
    role: row.role === 'admin' ? 'admin' : 'student',
    createdAt: new Date(row.created_at).toISOString(),
  }
}

function adminUserDto(row) {
  return userDto(row)
}

function requireAdmin(user) {
  if (user?.role !== 'admin') throw new ApiError(403, 'FORBIDDEN')
}

function boundedInteger(value, min, max, fallback) {
  if (value === undefined || value === null || value === '') return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new ApiError(400, 'VALIDATION_ERROR')
  }
  return parsed
}

function normalizeSearch(value) {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') throw new ApiError(400, 'VALIDATION_ERROR')
  const normalized = value.trim().replace(/\s+/g, ' ')
  if (normalized.length > 80) throw new ApiError(400, 'VALIDATION_ERROR')
  return normalized
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`)
}

function normalizeSubjectId(value) {
  if (typeof value !== 'string' || !/^[a-z0-9-]{1,50}$/.test(value)) {
    throw new ApiError(400, 'VALIDATION_ERROR')
  }
  return value
}

function normalizeOptions(value) {
  if (!Array.isArray(value) || value.length < 2 || value.length > 6) {
    throw new ApiError(400, 'VALIDATION_ERROR')
  }
  const options = value.map((option) => normalizeText(option, 1, 300))
  if (new Set(options.map((option) => option.toLocaleLowerCase('kk-KZ'))).size !== options.length) {
    throw new ApiError(400, 'VALIDATION_ERROR')
  }
  return options
}

function adminQuestionDto(row) {
  return {
    id: row.id,
    subjectId: row.subject_id,
    topic: row.topic,
    text: row.prompt,
    options: row.options,
    correctIndex: row.correct_option,
    explanation: row.explanation,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

async function rollbackQuietly(client) {
  try {
    await client.query('rollback')
  } catch {
    // Preserve the original error; a released failed connection is discarded by pg.
  }
}
