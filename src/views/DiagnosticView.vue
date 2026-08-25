<script setup lang="ts">
import { ArrowRight, Check, X } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  completeGuestDiagnostic,
  getGuestDiagnosticSession,
  saveGuestDiagnosticAnswer,
  setGuestDiagnosticQuestion,
} from '../features/session/sessionApplication'
import type { SessionAnswerAttempt } from '../features/session/types'
import {
  diagnosticRepository,
  type DiagnosticAnswerResult,
  type DiagnosticQuestionDto,
} from '../services/api/apiDiagnosticRepository'

const router = useRouter()
const route = useRoute()
const requestedSessionId = typeof route.query.session === 'string' ? route.query.session : undefined
const diagnosticSession = ref(getGuestDiagnosticSession(requestedSessionId))
const questions = ref<DiagnosticQuestionDto[]>([])
const evaluations = ref<Record<string, DiagnosticAnswerResult>>({})
const questionIndex = ref(diagnosticSession.value?.currentQuestionIndex ?? 0)
const loading = ref(false)
const evaluating = ref(false)
const submitting = ref(false)
const loadError = ref('')
const answerError = ref('')
const submitError = ref('')

const subjectId = computed(() => diagnosticSession.value?.selectedSubjectIds[0] ?? '')
const question = computed(() => questions.value[questionIndex.value] ?? null)
const savedAnswer = computed(() =>
  question.value
    ? diagnosticSession.value?.answers.find((answer) => answer.questionId === question.value?.id)
    : undefined,
)
const selectedAnswer = computed(() => {
  const value = savedAnswer.value?.selectedOptionId
  return value === undefined ? null : Number(value)
})
const evaluation = computed(() =>
  question.value ? evaluations.value[question.value.id] : undefined,
)
const progress = computed(() =>
  questions.value.length ? ((questionIndex.value + 1) / questions.value.length) * 100 : 0,
)
const subjectName = computed(() =>
  subjectId.value === 'history-kz' ? 'Қазақстан тарихы' : 'Диагностика',
)

async function restoreCurrentEvaluation() {
  const session = diagnosticSession.value
  const currentQuestion = questions.value[questionIndex.value]
  const existing = session?.answers.find((answer) => answer.questionId === currentQuestion?.id)
  if (!session || !currentQuestion || existing?.selectedOptionId === undefined) return
  const checked = await diagnosticRepository.checkAnswer(subjectId.value, {
    operationId: session.id,
    questionId: currentQuestion.id,
    selectedIndex: Number(existing.selectedOptionId),
  })
  evaluations.value = { ...evaluations.value, [checked.questionId]: checked }
}

async function loadQuestions() {
  if (!diagnosticSession.value || !subjectId.value) return
  loading.value = true
  loadError.value = ''
  try {
    const loaded = await diagnosticRepository.getQuestions(subjectId.value)
    const expectedIds = diagnosticSession.value.questionIds
    if (
      loaded.length !== expectedIds.length ||
      loaded.some((candidate, index) => candidate.id !== expectedIds[index])
    ) {
      throw new Error('Диагностика сұрақтары өзгерді. Пәнді қайта таңда.')
    }
    questions.value = loaded
    await restoreCurrentEvaluation()
  } catch (cause) {
    loadError.value = cause instanceof Error ? cause.message : 'Сұрақтарды жүктеу мүмкін болмады'
  } finally {
    loading.value = false
  }
}

onMounted(loadQuestions)

async function selectAnswer(index: number) {
  if (!question.value || savedAnswer.value || evaluating.value || !diagnosticSession.value) return
  evaluating.value = true
  answerError.value = ''
  try {
    const checked = await diagnosticRepository.checkAnswer(subjectId.value, {
      operationId: diagnosticSession.value.id,
      questionId: question.value.id,
      selectedIndex: index,
    })
    evaluations.value = { ...evaluations.value, [checked.questionId]: checked }
    diagnosticSession.value =
      saveGuestDiagnosticAnswer({
        sessionId: diagnosticSession.value.id,
        questionId: question.value.id,
        subjectId: subjectId.value,
        selectedOptionId: String(checked.selectedIndex),
        isCorrect: checked.isCorrect,
        isSkipped: false,
        answeredAt: new Date().toISOString(),
      }) ?? diagnosticSession.value
  } catch (cause) {
    answerError.value = cause instanceof Error ? cause.message : 'Жауапты тексеру мүмкін болмады'
  } finally {
    evaluating.value = false
  }
}

async function retryCurrentEvaluation() {
  if (evaluating.value) return
  evaluating.value = true
  answerError.value = ''
  try {
    await restoreCurrentEvaluation()
  } catch (cause) {
    answerError.value =
      cause instanceof Error ? cause.message : 'Жауапты қайта жүктеу мүмкін болмады'
  } finally {
    evaluating.value = false
  }
}

async function nextQuestion() {
  if (!savedAnswer.value || !evaluation.value || !diagnosticSession.value || submitting.value)
    return
  if (questionIndex.value < questions.value.length - 1) {
    const nextIndex = questionIndex.value + 1
    diagnosticSession.value =
      setGuestDiagnosticQuestion(diagnosticSession.value.id, nextIndex) ?? diagnosticSession.value
    questionIndex.value = nextIndex
    answerError.value = ''
    try {
      await restoreCurrentEvaluation()
    } catch (cause) {
      answerError.value =
        cause instanceof Error ? cause.message : 'Жауапты қайта жүктеу мүмкін болмады'
    }
    return
  }

  submitting.value = true
  submitError.value = ''
  try {
    const result = await diagnosticRepository.submit(subjectId.value, {
      operationId: diagnosticSession.value.id,
      answers: diagnosticSession.value.answers.map((answer) => ({
        questionId: answer.questionId,
        selectedIndex: Number(answer.selectedOptionId),
      })),
    })
    for (const checked of result.answers) {
      const existing: SessionAnswerAttempt | undefined = diagnosticSession.value.answers.find(
        (answer) => answer.questionId === checked.questionId,
      )
      if (!existing) continue
      diagnosticSession.value =
        saveGuestDiagnosticAnswer({
          sessionId: diagnosticSession.value.id,
          questionId: existing.questionId,
          subjectId: subjectId.value,
          selectedOptionId: existing.selectedOptionId,
          isCorrect: checked.isCorrect,
          isSkipped: false,
          answeredAt: existing.answeredAt ?? new Date().toISOString(),
        }) ?? diagnosticSession.value
    }
    const completed = completeGuestDiagnostic(diagnosticSession.value.id)
    if (completed) {
      await router.push({ name: 'diagnostic-result', query: { session: completed.id } })
    }
  } catch (cause) {
    submitError.value = cause instanceof Error ? cause.message : 'Нәтижені сақтау мүмкін болмады'
  } finally {
    submitting.value = false
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
        <X :size="21" aria-hidden="true" />
      </button>
      <div class="px-1 pt-1.5">
        <h1 class="truncate text-[13px] font-[850] text-[#111b34]">{{ subjectName }}</h1>
        <div class="progress-track mt-2 h-2">
          <div class="h-full rounded-full bg-[#1f66d9]" :style="{ width: `${progress}%` }" />
        </div>
      </div>
      <span class="text-right text-[12px] font-[600] text-[#536178]">
        {{ questions.length ? questionIndex + 1 : 0 }} / {{ questions.length }}
      </span>
    </header>

    <main
      v-if="!diagnosticSession"
      class="mx-auto flex max-w-md flex-1 flex-col items-center justify-center text-center"
    >
      <p class="text-[14px] text-[#b4232a]" role="alert">
        Диагностиканы бастау үшін алдымен пән таңда.
      </p>
    </main>
    <main
      v-else-if="loading"
      class="mx-auto flex max-w-md flex-1 items-center justify-center text-[14px] text-[#667085]"
      role="status"
      aria-live="polite"
    >
      Сұрақтар жүктеліп жатыр…
    </main>
    <main
      v-else-if="loadError"
      class="mx-auto flex max-w-md flex-1 flex-col items-center justify-center text-center"
    >
      <p class="text-[14px] text-[#b4232a]" role="alert">{{ loadError }}</p>
      <button class="text-button mt-4 min-h-11" type="button" @click="loadQuestions">
        Қайталап көру
      </button>
    </main>
    <main
      v-else-if="question"
      class="mx-auto min-h-0 w-full max-w-[1120px] flex-1 overflow-y-auto pb-3 lg:grid lg:grid-cols-2 lg:content-center lg:gap-12"
    >
      <div class="mt-4 lg:mt-0">
        <span class="rounded-lg bg-[#dfecff] px-2 py-1 text-[11px] font-[800] text-[#1f66d9]">
          {{ question.topic }}
        </span>
        <h2 class="mt-4 text-[20px] font-[900] leading-[1.4] text-[#0d1730] lg:text-[28px]">
          {{ question.text }}
        </h2>
      </div>

      <div class="mt-4 space-y-2 lg:mt-0">
        <button
          v-for="(option, index) in question.options"
          :key="option"
          class="flex min-h-[54px] w-full items-center rounded-[17px] border px-3 text-left"
          :class="
            evaluation && index === evaluation.correctIndex
              ? 'border-[#66e6a0] bg-[#effcf5]'
              : evaluation && index === selectedAnswer
                ? 'border-[#ff9299] bg-[#fff2f2]'
                : savedAnswer && index === selectedAnswer
                  ? 'border-[#1f66d9] bg-[#edf4ff]'
                  : 'border-[#dfe5ee] bg-white'
          "
          type="button"
          :disabled="Boolean(savedAnswer) || evaluating"
          @click="selectAnswer(index)"
        >
          <span class="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f1f4f8] font-bold">
            <Check v-if="evaluation && index === evaluation.correctIndex" :size="18" />
            <X v-else-if="evaluation && index === selectedAnswer" :size="18" />
            <template v-else>{{ String.fromCharCode(65 + index) }}</template>
          </span>
          <span class="ml-3 text-[15px] font-[750]">{{ option }}</span>
          <span v-if="evaluation && index === evaluation.correctIndex" class="sr-only">
            Дұрыс жауап
          </span>
          <span
            v-if="evaluation && index === selectedAnswer && !evaluation.isCorrect"
            class="sr-only"
          >
            Сенің жауабың, қате
          </span>
        </button>

        <p v-if="evaluating" class="text-[13px] text-[#667085]" aria-live="polite">
          Жауап тексеріліп жатыр…
        </p>
        <div v-if="answerError" class="flex items-center justify-between gap-3" role="alert">
          <p class="text-[13px] text-[#b4232a]">
            {{ answerError }}
            <template v-if="!savedAnswer">Тағы бір рет таңда.</template>
          </p>
          <button
            v-if="savedAnswer && !evaluation"
            class="text-button min-h-11 shrink-0"
            type="button"
            @click="retryCurrentEvaluation"
          >
            Қайталап көру
          </button>
        </div>
        <div
          v-if="evaluation"
          class="rounded-[18px] border border-[#afd6ff] bg-[#edf5ff] p-4"
          role="status"
          aria-live="polite"
        >
          <h3 class="text-[13px] font-[850]">
            {{ evaluation.isCorrect ? 'Дұрыс жауап' : 'Дұрыс жауабы көрсетілді' }}
          </h3>
          <p class="mt-1 text-[12px] leading-5 text-[#536178]">{{ evaluation.explanation }}</p>
        </div>
      </div>
    </main>

    <div v-if="question && !loading && !loadError" class="mx-auto w-full max-w-[1120px]">
      <p v-if="submitError" class="mb-2 text-[13px] text-[#b4232a]" role="alert">
        {{ submitError }}
      </p>
      <button
        class="primary-button ml-auto min-h-[52px] lg:max-w-[520px]"
        type="button"
        :disabled="!evaluation || submitting"
        @click="nextQuestion"
      >
        {{
          submitting
            ? 'Сақталып жатыр…'
            : questionIndex === questions.length - 1
              ? 'Нәтижені көру'
              : 'Келесі сұрақ'
        }}
        <ArrowRight :size="20" aria-hidden="true" />
      </button>
    </div>
  </section>
</template>
