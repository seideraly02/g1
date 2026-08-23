<script setup lang="ts">
import { ArrowRight, Check, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { guestDiagnosticQuestionIds } from '../features/diagnostic/diagnosticSession'
import {
  completeGuestDiagnostic,
  getGuestDiagnosticSession,
  saveGuestDiagnosticAnswer,
  setGuestDiagnosticQuestion,
} from '../features/session/sessionApplication'

interface DiagnosticQuestion {
  id: string
  topic: string
  prompt: string
  options: string[]
  correct: number
  explanation: string
}

const historyQuestions: DiagnosticQuestion[] = [
  {
    id: guestDiagnosticQuestionIds[0],
    topic: 'Қазақ хандығы',
    prompt: 'Қазақ хандығының негізін қалаған хандар кімдер?',
    options: ['Керей мен Жәнібек', 'Абылай мен Әбілқайыр', 'Қасым мен Есім', 'Тәуке мен Хақназар'],
    correct: 0,
    explanation: 'Керей мен Жәнібек қазақ руларының басын қосып, дербес хандықтың негізін қалады.',
  },
  {
    id: guestDiagnosticQuestionIds[1],
    topic: 'Қазақ хандығы',
    prompt: 'Қазақ хандығы қай жылы құрылды?',
    options: ['1456 жылы', '1466 жылы', '1465 жылы', '1470 жылы'],
    correct: 2,
    explanation:
      'Керей мен Жәнібек 1465 жылы Батыс Жетісуда хандықтың негізін қалады. Бұл дербес мемлекеттіліктің бастауына айналды.',
  },
  {
    id: guestDiagnosticQuestionIds[2],
    topic: 'Қазақ хандығы',
    prompt: 'Қазақ хандығы алғаш құрылған өңірді белгіле.',
    options: ['Сарыарқа', 'Батыс Жетісу', 'Маңғыстау', 'Ертіс бойы'],
    correct: 1,
    explanation:
      'Хандықтың алғашқы аумағы Шу мен Талас өзендері аралығындағы Батыс Жетісуда болды.',
  },
  {
    id: guestDiagnosticQuestionIds[3],
    topic: 'XX ғасыр',
    prompt: 'Алаш автономиясы қай жылы жарияланды?',
    options: ['1905 жылы', '1916 жылы', '1917 жылы', '1920 жылы'],
    correct: 2,
    explanation:
      'Алаш автономиясы 1917 жылғы желтоқсанда өткен Екінші жалпықазақ съезінде жарияланды.',
  },
  {
    id: guestDiagnosticQuestionIds[4],
    topic: 'XX ғасыр',
    prompt: 'Қазақстан тәуелсіздігін қай жылы жариялады?',
    options: ['1986 жылы', '1990 жылы', '1991 жылы', '1993 жылы'],
    correct: 2,
    explanation: 'Қазақстан 1991 жылғы 16 желтоқсанда мемлекеттік тәуелсіздігін жариялады.',
  },
]

const questionBanks: Record<string, DiagnosticQuestion[]> = {
  history: historyQuestions,
  reading: [
    {
      id: guestDiagnosticQuestionIds[0],
      topic: 'Мәтін құрылымы',
      prompt: 'Мәтіннің негізгі ойын анықтайтын бөлік қайсы?',
      options: ['Тақырып пен түйін', 'Тек бірінші сөйлем', 'Тыныс белгілері', 'Сөз саны'],
      correct: 0,
      explanation: 'Негізгі ой тақырып пен автор қорытындысы арқылы анықталады.',
    },
    {
      id: guestDiagnosticQuestionIds[1],
      topic: 'Сөз мағынасы',
      prompt: '«Ұқыпты» сөзіне мағыналас сөзді тап.',
      options: ['Салғырт', 'Жинақы', 'Асығыс', 'Кездейсоқ'],
      correct: 1,
      explanation: '«Жинақы» сөзі ұқыпты әрекет пен тәртіпті білдіреді.',
    },
    {
      id: guestDiagnosticQuestionIds[2],
      topic: 'Қорытынды',
      prompt: 'Мәтіннен қорытынды жасау үшін неге сүйену керек?',
      options: ['Жеке пікірге', 'Мәтіндегі дерекке', 'Тек тақырыпқа', 'Сөйлем санына'],
      correct: 1,
      explanation: 'Дұрыс қорытынды мәтінде берілген деректер мен байланыстарға сүйенеді.',
    },
    {
      id: guestDiagnosticQuestionIds[3],
      topic: 'Автор ұстанымы',
      prompt: 'Автордың көзқарасын не арқылы тануға болады?',
      options: ['Бағалауыш сөздерден', 'Абзац санынан', 'Қаріп өлшемінен', 'Мәтін ұзындығынан'],
      correct: 0,
      explanation: 'Бағалауыш сөздер автордың оқиғаға немесе мәселеге қатынасын білдіреді.',
    },
    {
      id: guestDiagnosticQuestionIds[4],
      topic: 'Логикалық байланыс',
      prompt: 'Себеп-салдар байланысын білдіретін сөзді таңда.',
      options: ['Сондықтан', 'Алайда', 'Мысалы', 'Немесе'],
      correct: 0,
      explanation: '«Сондықтан» алдыңғы ойдың салдарын көрсетеді.',
    },
  ],
  'math-literacy': [
    {
      id: guestDiagnosticQuestionIds[0],
      topic: 'Пайыз',
      prompt: '10 000 теңгенің 20%-ы қанша?',
      options: ['1 000', '2 000', '5 000', '8 000'],
      correct: 1,
      explanation: '10 000 × 0,2 = 2 000.',
    },
    {
      id: guestDiagnosticQuestionIds[1],
      topic: 'Пропорция',
      prompt: '3 дәптер 900 теңге тұрса, 5 дәптер қанша тұрады?',
      options: ['1 200', '1 500', '1 800', '2 000'],
      correct: 1,
      explanation: 'Бір дәптер 300 теңге, сондықтан 5 дәптер 1 500 теңге.',
    },
    {
      id: guestDiagnosticQuestionIds[2],
      topic: 'Уақыт',
      prompt: 'Сабақ 14:20-да басталып, 45 минутқа созылды. Қашан аяқталды?',
      options: ['14:55', '15:05', '15:15', '15:25'],
      correct: 1,
      explanation: '14:20-ға 45 минут қоссақ, 15:05 болады.',
    },
    {
      id: guestDiagnosticQuestionIds[3],
      topic: 'Орташа мән',
      prompt: '4, 6 және 8 сандарының орташа мәнін тап.',
      options: ['5', '6', '7', '18'],
      correct: 1,
      explanation: '(4 + 6 + 8) ÷ 3 = 6.',
    },
    {
      id: guestDiagnosticQuestionIds[4],
      topic: 'Аудан',
      prompt: 'Ұзындығы 5 м, ені 3 м бөлменің ауданы қанша?',
      options: ['8 м²', '15 м²', '16 м²', '30 м²'],
      correct: 1,
      explanation: 'Тіктөртбұрыш ауданы: 5 × 3 = 15 м².',
    },
  ],
  math: [
    {
      id: guestDiagnosticQuestionIds[0],
      topic: 'Теңдеу',
      prompt: '2x + 6 = 14 теңдеуінің түбірін тап.',
      options: ['2', '4', '6', '10'],
      correct: 1,
      explanation: '2x = 8, сондықтан x = 4.',
    },
    {
      id: guestDiagnosticQuestionIds[1],
      topic: 'Дәреже',
      prompt: '2³ · 2² өрнегінің мәні қандай?',
      options: ['16', '32', '64', '128'],
      correct: 1,
      explanation: 'Бірдей негіздер көбейтілгенде дәреже көрсеткіштері қосылады: 2⁵ = 32.',
    },
    {
      id: guestDiagnosticQuestionIds[2],
      topic: 'Функция',
      prompt: 'y = 3x − 1 болса, x = 2 кезіндегі y мәнін тап.',
      options: ['3', '5', '6', '7'],
      correct: 1,
      explanation: 'y = 3 × 2 − 1 = 5.',
    },
    {
      id: guestDiagnosticQuestionIds[3],
      topic: 'Геометрия',
      prompt: 'Үшбұрыш бұрыштарының қосындысы неше градус?',
      options: ['90°', '180°', '270°', '360°'],
      correct: 1,
      explanation: 'Кез келген үшбұрыштың ішкі бұрыштарының қосындысы 180°.',
    },
    {
      id: guestDiagnosticQuestionIds[4],
      topic: 'Түбір',
      prompt: '√81 мәнін тап.',
      options: ['7', '8', '9', '10'],
      correct: 2,
      explanation: '9 × 9 = 81, сондықтан √81 = 9.',
    },
  ],
  physics: [
    {
      id: guestDiagnosticQuestionIds[0],
      topic: 'Жылдамдық',
      prompt: 'Жылдамдықтың негізгі формуласы қайсы?',
      options: ['v = s/t', 'v = st', 'v = t/s', 'v = s + t'],
      correct: 0,
      explanation: 'Жылдамдық жүрілген жолды уақытқа бөлу арқылы табылады.',
    },
    {
      id: guestDiagnosticQuestionIds[1],
      topic: 'Күш',
      prompt: 'Күштің SI жүйесіндегі өлшем бірлігі қандай?',
      options: ['Джоуль', 'Ньютон', 'Ватт', 'Паскаль'],
      correct: 1,
      explanation: 'Күш ньютонмен өлшенеді.',
    },
    {
      id: guestDiagnosticQuestionIds[2],
      topic: 'Тығыздық',
      prompt: 'Тығыздық формуласы қайсы?',
      options: ['ρ = m/V', 'ρ = mV', 'ρ = V/m', 'ρ = m + V'],
      correct: 0,
      explanation: 'Тығыздық масса мен көлемнің қатынасына тең.',
    },
    {
      id: guestDiagnosticQuestionIds[3],
      topic: 'Электр тогы',
      prompt: 'Ток күшінің өлшем бірлігін таңда.',
      options: ['Вольт', 'Ом', 'Ампер', 'Кулон'],
      correct: 2,
      explanation: 'Ток күші ампермен өлшенеді.',
    },
    {
      id: guestDiagnosticQuestionIds[4],
      topic: 'Энергия',
      prompt: 'Механикалық энергияның өлшем бірлігі қандай?',
      options: ['Ньютон', 'Джоуль', 'Ватт', 'Тесла'],
      correct: 1,
      explanation: 'Энергияның SI жүйесіндегі өлшем бірлігі — джоуль.',
    },
  ],
}

const router = useRouter()
const route = useRoute()
const requestedSessionId = typeof route.query.session === 'string' ? route.query.session : undefined
const diagnosticSession = ref(getGuestDiagnosticSession(requestedSessionId))
const selectedSubjectId = computed(
  () => diagnosticSession.value?.selectedSubjectIds[0] ?? 'history',
)
const subjectNames: Record<string, string> = {
  history: 'Қазақстан тарихы',
  reading: 'Оқу сауаттылығы',
  'math-literacy': 'Математикалық сауаттылық',
  math: 'Математика',
  physics: 'Физика',
}
const subjectName = computed(() => subjectNames[selectedSubjectId.value] ?? 'Диагностика')
const questions = computed(() => questionBanks[selectedSubjectId.value] ?? historyQuestions)
const questionIndex = ref(diagnosticSession.value?.currentQuestionIndex ?? 0)
const detailsOpen = ref(false)

const question = computed(() => questions.value[questionIndex.value] ?? historyQuestions[0])
const savedAnswer = computed(() =>
  diagnosticSession.value?.answers.find((answer) => answer.questionId === question.value.id),
)
const selectedAnswer = computed(() => {
  const selectedOptionId = savedAnswer.value?.selectedOptionId
  if (selectedOptionId === undefined) {
    return null
  }

  const optionIndex = Number(selectedOptionId)
  return Number.isInteger(optionIndex) ? optionIndex : null
})
const answered = computed(() => savedAnswer.value !== undefined)
const sessionUnavailable = computed(() => diagnosticSession.value === null)
const progress = computed(() => ((questionIndex.value + 1) / questions.value.length) * 100)

function selectAnswer(index: number) {
  if (answered.value || !diagnosticSession.value) {
    return
  }

  const subjectId = diagnosticSession.value.selectedSubjectIds[0]
  if (!subjectId) {
    return
  }

  const updatedSession = saveGuestDiagnosticAnswer({
    sessionId: diagnosticSession.value.id,
    questionId: question.value.id,
    subjectId,
    selectedOptionId: String(index),
    isCorrect: index === question.value.correct,
    isSkipped: false,
    answeredAt: new Date().toISOString(),
  })

  if (updatedSession) {
    diagnosticSession.value = updatedSession
  }
}

function nextQuestion() {
  if (!answered.value || !diagnosticSession.value) return

  if (questionIndex.value === questions.value.length - 1) {
    const completedSession = completeGuestDiagnostic(diagnosticSession.value.id)
    if (completedSession) {
      diagnosticSession.value = completedSession
      router.push({ name: 'diagnostic-result', query: { session: completedSession.id } })
    }
    return
  }

  const nextQuestionIndex = questionIndex.value + 1
  const updatedSession = setGuestDiagnosticQuestion(diagnosticSession.value.id, nextQuestionIndex)
  if (updatedSession) {
    diagnosticSession.value = updatedSession
    questionIndex.value = nextQuestionIndex
    detailsOpen.value = false
  }
}
</script>

<template>
  <section class="screen-page flex flex-col bg-[#f8f8f8] px-4 pb-4 lg:px-[clamp(40px,6vw,96px)]">
    <header class="safe-top grid min-h-[72px] grid-cols-[44px_1fr_52px] items-center">
      <button
        class="icon-button -ml-1 mt-1"
        type="button"
        aria-label="Жабу"
        @click="router.push({ name: 'subjects-onboarding' })"
      >
        <X :size="21" :stroke-width="2" />
      </button>
      <div class="px-1 pt-1.5">
        <h1 class="truncate text-[13px] font-[850] text-[#111b34]">{{ subjectName }}</h1>
        <div class="progress-track mt-2 h-[8px]">
          <div
            class="h-full rounded-full bg-[#1f66d9] transition-[width]"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>
      <div class="flex items-start justify-end">
        <span class="whitespace-nowrap pt-2 text-[12px] font-[600] text-[#536178]">
          {{ questionIndex + 1 }} / {{ questions.length }}
        </span>
      </div>
    </header>

    <p
      v-if="sessionUnavailable"
      class="mt-3 rounded-[12px] bg-[#fff0f1] px-3 py-2 text-[13px] leading-[1.4] text-[#b4232a]"
      role="alert"
    >
      Диагностиканы бастау үшін алдымен пән таңда.
    </p>

    <main
      class="min-h-0 flex-1 overflow-y-auto pb-3 lg:grid lg:grid-cols-[minmax(300px,.8fr)_minmax(520px,1.2fr)] lg:content-center lg:gap-x-[clamp(40px,6vw,96px)] lg:gap-y-4 lg:overflow-visible"
    >
      <div class="mt-4 flex items-center gap-2 lg:col-start-1 lg:mt-0">
        <span class="rounded-[9px] bg-[#dfecff] px-2 py-1 text-[11px] font-[800] text-[#1f66d9]">
          {{ question.topic }}
        </span>
        <span class="rounded-[9px] bg-[#f1f4f8] px-2 py-1 text-[11px] font-[750] text-[#536178]">
          ≈ 45 сек.
        </span>
      </div>

      <h2
        class="mt-3 text-[19px] font-[900] leading-[1.38] tracking-[-.018em] text-[#0d1730] lg:col-start-1 lg:text-[28px]"
      >
        {{ question.prompt }}
      </h2>

      <div class="mt-3 space-y-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mt-0">
        <button
          v-for="(option, index) in question.options"
          :key="option"
          type="button"
          class="flex min-h-[54px] w-full items-center rounded-[17px] border px-3 text-left transition-colors"
          :class="[
            answered && index === question.correct
              ? 'border-[#66e6a0] bg-[#effcf5]'
              : answered && index === selectedAnswer && index !== question.correct
                ? 'border-[#ff9299] bg-[#fff2f2]'
                : 'border-[#dfe5ee] bg-white',
            answered && index !== question.correct && index !== selectedAnswer
              ? 'text-[#6f7a90]'
              : 'text-[#111b34]',
          ]"
          :disabled="answered || sessionUnavailable"
          @click="selectAnswer(index)"
        >
          <span
            class="grid size-7 shrink-0 place-items-center rounded-[9px] text-[13px] font-[850]"
            :class="
              answered && index === question.correct
                ? 'bg-[#16a757] text-white'
                : answered && index === selectedAnswer && index !== question.correct
                  ? 'bg-[#e9272f] text-white'
                  : 'bg-[#f1f4f8] text-[#111b34]'
            "
          >
            <Check v-if="answered && index === question.correct" :size="18" :stroke-width="2.5" />
            <X
              v-else-if="answered && index === selectedAnswer && index !== question.correct"
              :size="18"
              :stroke-width="2.5"
            />
            <template v-else>{{ String.fromCharCode(65 + index) }}</template>
          </span>
          <span class="ml-3 min-w-0 flex-1">
            <span class="block text-[15px] font-[750] leading-[1.2]">{{ option }}</span>
            <span
              v-if="answered && index === selectedAnswer && index !== question.correct"
              class="mt-1 block text-[11px] font-[600] text-[#cc2027]"
            >
              Сенің жауабың
            </span>
            <span
              v-else-if="answered && index === question.correct"
              class="mt-1 block text-[11px] font-[600] text-[#158d4b]"
            >
              Дұрыс жауап
            </span>
          </span>
        </button>
      </div>

      <div
        v-if="answered"
        class="mt-2.5 rounded-[18px] border border-[#afd6ff] bg-[#edf5ff] p-3 lg:col-span-2 lg:mt-2"
      >
        <div class="border-l-[3px] border-[#1f66d9] pl-3">
          <h3 class="text-[13px] font-[850] text-[#111b34]">Неліктен?</h3>
          <p class="mt-1 text-[12px] leading-[1.45] text-[#536178]">{{ question.explanation }}</p>
          <p v-if="detailsOpen" class="mt-1 text-[11px] leading-[1.4] text-[#536178]">
            Бұл тақырыпты қысқа конспект пен қосымша сұрақтар арқылы бекіте аласың.
          </p>
        </div>
        <div class="mt-2 flex items-center justify-between">
          <span class="text-[11px] text-[#536178]">Тақырып түсіндірмесі</span>
          <button
            type="button"
            class="text-[12px] font-[800] text-[#1f66d9]"
            @click="detailsOpen = !detailsOpen"
          >
            Толығырақ
          </button>
        </div>
      </div>
    </main>

    <button
      class="primary-button mt-2 min-h-[52px] shrink-0 rounded-[16px] text-[16px] lg:ml-auto lg:w-[min(100%,520px)]"
      type="button"
      :disabled="!answered || sessionUnavailable"
      @click="nextQuestion"
    >
      {{ questionIndex === questions.length - 1 ? 'Нәтижені көру' : 'Келесі сұрақ' }}
      <ArrowRight :size="20" :stroke-width="2" aria-hidden="true" />
    </button>
  </section>
</template>
