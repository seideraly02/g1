<script setup lang="ts">
import { ArrowRight, BatteryMedium, Bookmark, Check, Flag, Save, Wifi, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
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

const questions: DiagnosticQuestion[] = [
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

const router = useRouter()
const diagnosticSession = ref(getGuestDiagnosticSession())
const questionIndex = ref(diagnosticSession.value?.currentQuestionIndex ?? 0)
const bookmarked = ref(true)
const reported = ref(false)
const detailsOpen = ref(false)

const question = computed(() => questions[questionIndex.value])
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
const progress = computed(() => ((questionIndex.value + 1) / questions.length) * 100)

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

  if (questionIndex.value === questions.length - 1) {
    const completedSession = completeGuestDiagnostic(diagnosticSession.value.id)
    if (completedSession) {
      diagnosticSession.value = completedSession
      router.push({ name: 'diagnostic-result' })
    }
    return
  }

  const nextQuestionIndex = questionIndex.value + 1
  const updatedSession = setGuestDiagnosticQuestion(diagnosticSession.value.id, nextQuestionIndex)
  if (updatedSession) {
    diagnosticSession.value = updatedSession
    questionIndex.value = nextQuestionIndex
    detailsOpen.value = false
    reported.value = false
  }
}
</script>

<template>
  <section class="screen-page flex min-h-[844px] flex-col bg-[#f8fafc] px-4 pb-4">
    <div class="flex h-[42px] shrink-0 items-center justify-between px-1 pt-1 text-[#111b34]">
      <span class="text-[12px] font-[850] tracking-[.01em]">09:41</span>
      <div class="flex items-center gap-2">
        <svg width="14" height="13" viewBox="0 0 14 13" fill="none" aria-hidden="true">
          <rect x="1" y="8" width="2" height="4" rx="1" fill="currentColor" />
          <rect x="4.3" y="6" width="2" height="6" rx="1" fill="currentColor" />
          <rect x="7.6" y="3.5" width="2" height="8.5" rx="1" fill="currentColor" />
          <rect x="10.9" y="1" width="2" height="11" rx="1" fill="currentColor" />
        </svg>
        <Wifi :size="16" :stroke-width="2.4" aria-hidden="true" />
        <BatteryMedium :size="21" :stroke-width="2" aria-hidden="true" />
      </div>
    </div>

    <header class="grid grid-cols-[40px_1fr_88px] items-start">
      <button
        class="icon-button -ml-1 mt-1"
        type="button"
        aria-label="Жабу"
        @click="router.push({ name: 'subjects-onboarding' })"
      >
        <X :size="21" :stroke-width="2" />
      </button>
      <div class="px-1 pt-1.5">
        <h1 class="truncate text-[13px] font-[850] text-[#111b34]">Қазақстан тарихы</h1>
        <div class="progress-track mt-2 h-[8px]">
          <div
            class="h-full rounded-full bg-gradient-to-r from-[#2468f2] to-[#63aaf7] transition-[width]"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>
      <div class="flex items-start justify-end gap-1">
        <span class="whitespace-nowrap pt-2 text-[12px] font-[600] text-[#536178]">
          {{ questionIndex + 1 }} / {{ questions.length }}
        </span>
        <button
          class="icon-button"
          type="button"
          :aria-label="bookmarked ? 'Белгіні алып тастау' : 'Белгілеу'"
          :aria-pressed="bookmarked"
          @click="bookmarked = !bookmarked"
        >
          <Bookmark :size="20" :stroke-width="2" :fill="bookmarked ? 'currentColor' : 'none'" />
        </button>
      </div>
    </header>

    <p
      v-if="sessionUnavailable"
      class="mt-3 rounded-[12px] bg-[#fff0f1] px-3 py-2 text-[13px] leading-[1.4] text-[#b4232a]"
      role="alert"
    >
      Диагностиканы бастау үшін алдымен пән таңда.
    </p>

    <main class="min-h-0 flex-1 overflow-y-auto pb-3">
      <div class="mt-4 flex items-center gap-2">
        <span class="rounded-[9px] bg-[#dfecff] px-2 py-1 text-[11px] font-[800] text-[#2468f2]">
          {{ question.topic }}
        </span>
        <span class="rounded-[9px] bg-[#f1f4f8] px-2 py-1 text-[11px] font-[750] text-[#536178]">
          ≈ 45 сек.
        </span>
      </div>

      <h2 class="mt-3 text-[19px] font-[900] leading-[1.38] tracking-[-.018em] text-[#0d1730]">
        {{ question.prompt }}
      </h2>

      <div class="mt-3 space-y-2">
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

      <div v-if="answered" class="mt-2.5 rounded-[18px] border border-[#afd6ff] bg-[#edf5ff] p-3">
        <div class="border-l-[3px] border-[#2468f2] pl-3">
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
            class="text-[12px] font-[800] text-[#2468f2]"
            @click="detailsOpen = !detailsOpen"
          >
            Толығырақ
          </button>
        </div>
      </div>

      <div v-if="answered" class="mt-2.5 flex items-center justify-between gap-2">
        <button
          type="button"
          class="inline-flex min-h-8 items-center gap-2 text-[12px] font-[750] text-[#2468f2]"
          @click="reported = !reported"
        >
          <Flag :size="16" :stroke-width="2" aria-hidden="true" />
          {{ reported ? 'Хабарланды' : 'Мәселе туралы хабарлау' }}
        </button>
        <button
          type="button"
          class="inline-flex min-h-8 items-center gap-1 rounded-[10px] bg-[#dcf8e7] px-2 text-[11px] font-[750] text-[#148747]"
          @click="bookmarked = !bookmarked"
        >
          <Save :size="16" :stroke-width="2" aria-hidden="true" />
          {{ bookmarked ? 'Сақталды' : 'Сақтау' }}
        </button>
      </div>
    </main>

    <button
      class="primary-button mt-2 min-h-[52px] shrink-0 rounded-[16px] text-[16px]"
      type="button"
      :disabled="!answered || sessionUnavailable"
      @click="nextQuestion"
    >
      {{ questionIndex === questions.length - 1 ? 'Нәтижені көру' : 'Келесі сұрақ' }}
      <ArrowRight :size="20" :stroke-width="2" aria-hidden="true" />
    </button>
  </section>
</template>
