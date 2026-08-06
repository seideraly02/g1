import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const questions = [
  ['history-1', 'Қазақ хандығы', 'Қазақ хандығының негізін қалаған хандар кімдер?', ['Керей мен Жәнібек', 'Абылай мен Әбілқайыр', 'Қасым мен Есім', 'Тәуке мен Хақназар'], 0, 'Керей мен Жәнібек дербес Қазақ хандығының негізін қалады.'],
  ['history-2', 'Қазақ хандығы', 'Қазақ хандығы қай жылы құрылды?', ['1456 жылы', '1466 жылы', '1465 жылы', '1470 жылы'], 2, 'Қазақ хандығының құрылған жылы ретінде 1465 жыл қабылданады.'],
  ['history-3', 'Қазақ хандығы', 'Қазақ хандығы алғаш құрылған өңірді белгіле.', ['Сарыарқа', 'Батыс Жетісу', 'Маңғыстау', 'Ертіс бойы'], 1, 'Алғашқы аумақ Шу мен Талас аралығындағы Батыс Жетісуда болды.'],
  ['history-4', 'XX ғасыр', 'Алаш автономиясы қай жылы жарияланды?', ['1905 жылы', '1916 жылы', '1917 жылы', '1920 жылы'], 2, 'Алаш автономиясы 1917 жылғы желтоқсанда жарияланды.'],
  ['history-5', 'Тәуелсіз Қазақстан', 'Қазақстан тәуелсіздігін қай жылы жариялады?', ['1986 жылы', '1990 жылы', '1991 жылы', '1993 жылы'], 2, 'Қазақстан 1991 жылғы 16 желтоқсанда тәуелсіздігін жариялады.'],
] as const

await prisma.subject.upsert({
  where: { id: 'history' },
  update: { name: 'Қазақстан тарихы', order: 1 },
  create: { id: 'history', name: 'Қазақстан тарихы', order: 1 },
})

for (const [id, topic, text, options, correctIndex, explanation] of questions) {
  await prisma.question.upsert({
    where: { id },
    update: { topic, text, options: [...options], correctIndex, explanation, isActive: true },
    create: { id, subjectId: 'history', topic, text, options: [...options], correctIndex, explanation },
  })
}

await prisma.$disconnect()
