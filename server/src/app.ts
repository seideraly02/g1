import crypto from 'node:crypto'
import Fastify, { type FastifyRequest } from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()
const sessionCookie = 'qadam_session'
const codeTtlMs = 5 * 60_000
const sessionTtlMs = 30 * 24 * 60 * 60_000

const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex')
const randomToken = () => crypto.randomBytes(32).toString('base64url')
const normalizePhone = (value: string) => value.replace(/[^+\d]/g, '')

async function currentUser(request: FastifyRequest) {
  const token = request.cookies[sessionCookie]
  if (!token) return null
  const session = await prisma.session.findUnique({
    where: { tokenHash: hash(token) },
    include: { user: true },
  })
  if (!session || session.revokedAt || session.expiresAt <= new Date()) return null
  return session.user
}

async function sendCode(phone: string, code: string) {
  if (process.env.AUTH_MODE === 'development') {
    console.info(`[development] Verification code prepared for ${phone.slice(-4)}: ${code}`)
    return
  }
  const url = process.env.TELEGRAM_GATEWAY_URL
  const token = process.env.TELEGRAM_GATEWAY_TOKEN
  if (!url || !token) throw new Error('Telegram Gateway is not configured')
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number: phone, code }),
  })
  if (!response.ok) throw new Error(`Telegram Gateway returned ${response.status}`)
}

export async function buildApp() {
  const app = Fastify({ logger: true })
  await app.register(cookie)
  await app.register(cors, {
    origin: process.env.FRONTEND_ORIGIN?.split(',').map((value) => value.trim()) ?? true,
    credentials: true,
  })

  app.get('/health', async () => ({ status: 'ok' }))

  app.post('/auth/telegram/request-code', async (request, reply) => {
    const input = z.object({
      fullName: z.string().trim().min(2).max(100),
      city: z.string().trim().min(2).max(100),
      phone: z.string().transform(normalizePhone).pipe(z.string().regex(/^\+7\d{10}$/)),
    }).safeParse(request.body)
    if (!input.success) return reply.code(400).send({ code: 'INVALID_INPUT' })

    const recent = await prisma.loginRequest.findFirst({
      where: { phone: input.data.phone, createdAt: { gt: new Date(Date.now() - 60_000) } },
    })
    if (recent) return reply.code(429).send({ code: 'RATE_LIMITED' })

    const code = String(crypto.randomInt(100000, 1_000_000))
    const loginRequest = await prisma.loginRequest.create({
      data: {
        ...input.data,
        codeHash: hash(code),
        expiresAt: new Date(Date.now() + codeTtlMs),
      },
    })
    await sendCode(input.data.phone, code)
    return {
      requestId: loginRequest.id,
      expiresAt: loginRequest.expiresAt.toISOString(),
      resendAfterSeconds: 60,
    }
  })

  app.post('/auth/telegram/verify-code', async (request, reply) => {
    const input = z.object({ requestId: z.string().min(1), code: z.string().regex(/^\d{6}$/) }).safeParse(request.body)
    if (!input.success) return reply.code(400).send({ code: 'INVALID_CODE' })
    const loginRequest = await prisma.loginRequest.findUnique({ where: { id: input.data.requestId } })
    if (!loginRequest || loginRequest.consumedAt) return reply.code(400).send({ code: 'INVALID_CODE' })
    if (loginRequest.expiresAt <= new Date()) return reply.code(400).send({ code: 'CODE_EXPIRED' })
    if (loginRequest.attempts >= 5) return reply.code(429).send({ code: 'RATE_LIMITED' })
    if (loginRequest.codeHash !== hash(input.data.code)) {
      await prisma.loginRequest.update({ where: { id: loginRequest.id }, data: { attempts: { increment: 1 } } })
      return reply.code(400).send({ code: 'INVALID_CODE' })
    }

    const verifiedAt = new Date()
    const user = await prisma.user.upsert({
      where: { phone: loginRequest.phone },
      create: { fullName: loginRequest.fullName, city: loginRequest.city, phone: loginRequest.phone, verifiedAt },
      update: { fullName: loginRequest.fullName, city: loginRequest.city, verifiedAt },
    })
    const token = randomToken()
    await prisma.$transaction([
      prisma.loginRequest.update({ where: { id: loginRequest.id }, data: { consumedAt: verifiedAt } }),
      prisma.session.create({
        data: { userId: user.id, tokenHash: hash(token), expiresAt: new Date(Date.now() + sessionTtlMs) },
      }),
    ])
    reply.setCookie(sessionCookie, token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: Math.floor(sessionTtlMs / 1000),
    })
    return { ...user, verifiedAt: user.verifiedAt.toISOString(), createdAt: undefined }
  })

  app.get('/auth/session', async (request, reply) => {
    const user = await currentUser(request)
    if (!user) return reply.code(401).send({ code: 'UNAUTHORIZED' })
    return { id: user.id, fullName: user.fullName, city: user.city, phone: user.phone, verifiedAt: user.verifiedAt.toISOString() }
  })

  app.delete('/auth/session', async (request, reply) => {
    const token = request.cookies[sessionCookie]
    if (token) await prisma.session.updateMany({ where: { tokenHash: hash(token) }, data: { revokedAt: new Date() } })
    reply.clearCookie(sessionCookie, { path: '/' })
    return reply.code(204).send()
  })

  app.get('/subjects', async () => prisma.subject.findMany({ orderBy: { order: 'asc' }, select: { id: true, name: true } }))

  app.get('/diagnostic/:subjectId', async (request, reply) => {
    const params = z.object({ subjectId: z.string().min(1) }).safeParse(request.params)
    if (!params.success) return reply.code(400).send({ code: 'INVALID_INPUT' })
    const questions = await prisma.question.findMany({
      where: { subjectId: params.data.subjectId, isActive: true },
      take: 5,
      orderBy: { id: 'asc' },
      select: { id: true, topic: true, text: true, options: true },
    })
    if (questions.length < 5) return reply.code(409).send({ code: 'INSUFFICIENT_QUESTIONS' })
    return questions
  })

  app.post('/diagnostic/:subjectId/submit', async (request, reply) => {
    const params = z.object({ subjectId: z.string().min(1) }).safeParse(request.params)
    const body = z.object({ answers: z.array(z.object({ questionId: z.string(), selectedIndex: z.number().int().min(0).max(9) })).length(5) }).safeParse(request.body)
    if (!params.success || !body.success) return reply.code(400).send({ code: 'INVALID_INPUT' })
    const questions = await prisma.question.findMany({ where: { id: { in: body.data.answers.map((answer) => answer.questionId) }, subjectId: params.data.subjectId, isActive: true } })
    if (questions.length !== body.data.answers.length) return reply.code(400).send({ code: 'INVALID_QUESTIONS' })
    const byId = new Map(questions.map((question) => [question.id, question]))
    const graded = body.data.answers.map((answer) => ({ ...answer, isCorrect: byId.get(answer.questionId)?.correctIndex === answer.selectedIndex }))
    const user = await currentUser(request)
    const attempt = await prisma.attempt.create({
      data: {
        userId: user?.id,
        subjectId: params.data.subjectId,
        total: graded.length,
        correct: graded.filter((answer) => answer.isCorrect).length,
        answers: { create: graded.map((answer) => ({ questionId: answer.questionId, selectedIndex: answer.selectedIndex, isCorrect: answer.isCorrect })) },
      },
    })
    return {
      attemptId: attempt.id,
      total: attempt.total,
      correct: attempt.correct,
      insufficientData: true,
      answers: graded.map((answer) => ({ questionId: answer.questionId, isCorrect: answer.isCorrect, correctIndex: byId.get(answer.questionId)!.correctIndex, explanation: byId.get(answer.questionId)!.explanation })),
    }
  })

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error)
    reply.code(500).send({ code: 'INTERNAL_ERROR' })
  })

  app.addHook('onClose', async () => prisma.$disconnect())
  return app
}
