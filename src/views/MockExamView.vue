<script setup lang="ts">
import { ArrowLeft, ArrowRight, Clock3, Flag } from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import {
  completeTrialTraining,
  discardTrialTraining,
  saveTrialTrainingAnswer,
  setTrialTrainingQuestion,
  startTrialTraining,
} from '../features/session/sessionApplication'

const router = useRouter()
const trialQuestionIds = Array.from({ length: 40 }, (_, index) => `trial-math-${index + 1}`)
const trialSession = ref(startTrialTraining(['math'], trialQuestionIds, 22))
const currentQuestion = ref(trialSession.value.currentQuestionIndex + 1)
const selectedAnswer = ref(getSelectedAnswer(currentQuestion.value))
const markedQuestions = ref<number[]>([19])
const canLeaveWithoutConfirmation = ref(false)
const leaveDialogOpen = ref(false)
const leaveDialog = ref<HTMLElement | null>(null)
const continueButton = ref<HTMLButtonElement | null>(null)
let previouslyFocusedElement: HTMLElement | null = null

const options = [
  { key: 'A', value: '−3,5' },
  { key: 'B', value: '1,5' },
  { key: 'C', value: '3,5' },
  { key: 'D', value: '7' },
]

const questionNumbers = computed(() => {
  const start = Math.min(33, Math.max(1, currentQuestion.value - 6))
  return Array.from({ length: 8 }, (_, index) => start + index)
})

const isMarked = computed(() => markedQuestions.value.includes(currentQuestion.value))

function shouldConfirmLeave(): boolean {
  return !canLeaveWithoutConfirmation.value && trialSession.value.status !== 'completed'
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!shouldConfirmLeave()) return

  event.preventDefault()
  event.returnValue = ''
}

function handlePageHide(event: PageTransitionEvent) {
  if (event.persisted) return

  if (shouldConfirmLeave()) {
    discardTrialTraining(trialSession.value.id)
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('pagehide', handlePageHide)
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('pagehide', handlePageHide)
})

watch(leaveDialogOpen, async (isOpen) => {
  if (!isOpen) return

  await nextTick()
  continueButton.value?.focus()
})

onBeforeRouteLeave(() => {
  if (!shouldConfirmLeave()) return true

  openLeaveDialog()
  return false
})

function openLeaveDialog() {
  previouslyFocusedElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null
  leaveDialogOpen.value = true
}

function requestClose() {
  if (!shouldConfirmLeave()) {
    void router.push({ name: 'home' })
    return
  }

  openLeaveDialog()
}

async function cancelLeave() {
  leaveDialogOpen.value = false
  await nextTick()
  previouslyFocusedElement?.focus()
  previouslyFocusedElement = null
}

function confirmLeave() {
  discardTrialTraining(trialSession.value.id)
  canLeaveWithoutConfirmation.value = true
  leaveDialogOpen.value = false
  previouslyFocusedElement = null
  void router.push({ name: 'home' })
}

function handleLeaveDialogKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    void cancelLeave()
    return
  }

  if (event.key !== 'Tab' || !leaveDialog.value) return

  const focusableElements = Array.from(
    leaveDialog.value.querySelectorAll<HTMLElement>('button:not([disabled])'),
  )
  const firstElement = focusableElements[0]
  const lastElement = focusableElements.at(-1)
  if (!firstElement || !lastElement) return

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault()
    lastElement.focus()
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault()
    firstElement.focus()
  }
}

function getQuestionId(questionNumber: number): string | null {
  return trialQuestionIds[questionNumber - 1] ?? null
}

function getSelectedAnswer(questionNumber: number): string {
  const questionId = getQuestionId(questionNumber)
  return questionId
    ? (trialSession.value.answers.find((answer) => answer.questionId === questionId)
        ?.selectedOptionId ?? '')
    : ''
}

function selectAnswer(optionKey: string) {
  const questionId = getQuestionId(currentQuestion.value)
  if (!questionId) {
    return
  }

  const updatedSession = saveTrialTrainingAnswer({
    sessionId: trialSession.value.id,
    questionId,
    subjectId: 'math',
    selectedOptionId: optionKey,
    isSkipped: false,
    answeredAt: new Date().toISOString(),
  })

  if (updatedSession) {
    trialSession.value = updatedSession
    selectedAnswer.value = optionKey
  }
}

function setCurrentQuestion(questionNumber: number) {
  const updatedSession = setTrialTrainingQuestion(trialSession.value.id, questionNumber - 1)
  if (updatedSession) {
    trialSession.value = updatedSession
    currentQuestion.value = questionNumber
    selectedAnswer.value = getSelectedAnswer(questionNumber)
  }
}

function toggleMarked() {
  markedQuestions.value = isMarked.value
    ? markedQuestions.value.filter((number) => number !== currentQuestion.value)
    : [...markedQuestions.value, currentQuestion.value]
}

function moveQuestion(direction: -1 | 1) {
  setCurrentQuestion(Math.min(40, Math.max(1, currentQuestion.value + direction)))
}

function continueTrial() {
  if (currentQuestion.value < 40) {
    moveQuestion(1)
    return
  }

  const completedSession = completeTrialTraining(trialSession.value.id)
  if (completedSession) {
    trialSession.value = completedSession
    canLeaveWithoutConfirmation.value = true
    router.push({ name: 'training-result' })
  }
}
</script>

<template>
  <section class="mock-exam-page screen-page flex min-h-[844px] flex-col bg-[#f8faff]">
    <AppHeader title="Сынақ ҰБТ" close managed-close @close="requestClose">
      <template #actions>
        <div
          class="flex items-center gap-2 rounded-xl bg-[#f0f3f8] px-3 py-2 text-[14px] font-[850]"
        >
          <Clock3 :size="18" />
          <span class="metric-value">01:42:18</span>
        </div>
      </template>
    </AppHeader>

    <div class="mx-auto flex w-full max-w-[960px] flex-1 flex-col px-4 pb-4">
      <div class="-mt-1 pl-[56px] text-[11px] text-[#536178]">
        Математика · 40 сұрақтың {{ currentQuestion }}-і
      </div>

      <div class="mt-4 h-2 overflow-hidden rounded-full bg-[#dfe6f0]">
        <div
          class="h-full rounded-full bg-gradient-to-r from-[#2c69ec] to-[#68a8f7] transition-[width]"
          :style="{ width: `${(currentQuestion / 40) * 100}%` }"
        />
      </div>
      <div class="mt-1.5 flex justify-between text-[11px] text-[#536178]">
        <span>Жауап берілді: 18</span>
        <span>Өткізілді: 4 · Белгіленді: {{ markedQuestions.length }}</span>
      </div>

      <div class="mt-6 flex items-center justify-between">
        <span class="rounded-lg bg-[#f1eaff] px-2.5 py-1 text-[10px] font-[800] text-[#7434dc]">
          Квадрат теңдеулер
        </span>
        <button
          class="inline-flex min-h-9 items-center gap-2 border-0 bg-transparent px-2 text-[12px] font-[800] text-[#2869df]"
          type="button"
          :aria-pressed="isMarked"
          @click="toggleMarked"
        >
          <Flag :size="18" :fill="isMarked ? 'currentColor' : 'none'" />
          {{ isMarked ? 'Белгіленді' : 'Белгілеу' }}
        </button>
      </div>

      <h2 class="mt-4 text-[19px] font-[850] leading-[1.25] tracking-[-.025em]">
        Теңдеу түбірлерінің қосындысын табыңыз:
      </h2>
      <div
        class="mt-3 rounded-2xl bg-[#f0f3f8] px-4 py-3 text-center font-serif text-[24px] font-[700]"
      >
        2x² − 7x + 3 = 0
      </div>

      <div class="mt-2.5 grid gap-2">
        <button
          v-for="option in options"
          :key="option.key"
          class="flex min-h-[54px] items-center gap-3 rounded-2xl border bg-white px-3 text-left text-[15px] transition-colors"
          :class="
            selectedAnswer === option.key
              ? 'border-[#2869df] bg-[#eef5ff] font-[800] text-[#111b34]'
              : 'border-[#dce4ef] text-[#111b34]'
          "
          type="button"
          :aria-pressed="selectedAnswer === option.key"
          @click="selectAnswer(option.key)"
        >
          <span
            class="grid size-8 place-items-center rounded-[10px] font-[850]"
            :class="selectedAnswer === option.key ? 'bg-[#2869df] text-white' : 'bg-[#f1f4f9]'"
          >
            {{ option.key }}
          </span>
          {{ option.value }}
        </button>
      </div>

      <div class="card mt-2.5 p-3">
        <div class="flex items-center justify-between">
          <span class="text-[12px] font-[850]">Сұрақтар картасы</span>
          <span class="text-[10px] text-[#536178]">өту үшін басыңыз</span>
        </div>
        <div class="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-8">
          <button
            v-for="number in questionNumbers"
            :key="number"
            class="grid h-11 min-w-0 place-items-center rounded-[9px] border text-[11px] font-[800]"
            :class="
              number === currentQuestion
                ? 'border-[#2869df] bg-[#2869df] text-white'
                : markedQuestions.includes(number)
                  ? 'border-[#d47500] bg-[#fff8e8] text-[#a65300]'
                  : number < currentQuestion
                    ? 'border-[#9acbff] bg-[#f3f8ff] text-[#1e5ec7]'
                    : 'border-[#dce4ef] bg-white'
            "
            type="button"
            @click="setCurrentQuestion(number)"
          >
            {{ number }}
          </button>
        </div>
      </div>

      <div class="mt-auto grid grid-cols-2 gap-2 pt-5 md:grid-cols-[180px_220px] md:justify-end">
        <button
          class="secondary-button min-h-[52px]"
          type="button"
          @click="currentQuestion > 1 ? moveQuestion(-1) : router.push({ name: 'home' })"
        >
          <ArrowLeft :size="18" />
          Артқа
        </button>
        <button class="primary-button min-h-[52px]" type="button" @click="continueTrial">
          Әрі қарай
          <ArrowRight :size="18" />
        </button>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="leaveDialogOpen"
        class="fixed inset-0 z-50 grid place-items-center bg-[#111b34]/40 p-4"
        @click.self="cancelLeave"
      >
        <section
          ref="leaveDialog"
          class="w-full max-w-[380px] rounded-lg border border-[#dfe5ee] bg-white p-5 shadow-[0_18px_50px_rgba(17,27,52,.2)] outline-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-dialog-title"
          aria-describedby="leave-dialog-description"
          tabindex="-1"
          @keydown="handleLeaveDialogKeydown"
        >
          <p class="eyebrow">Аяқталмаған сынақ</p>
          <h2 id="leave-dialog-title" class="mt-2 text-[20px] font-[850] text-[#111b34]">
            Сынақтан шығу керек пе?
          </h2>
          <p id="leave-dialog-description" class="mt-2 text-[14px] leading-6 text-[#536178]">
            Жауаптарың өшіріледі. Аяқталмаған сынақ нәтижелерге қосылмайды және оны жалғастыра
            алмайсың.
          </p>

          <div class="mt-5 grid grid-cols-2 gap-2">
            <button
              ref="continueButton"
              class="secondary-button min-h-11"
              type="button"
              @click="cancelLeave"
            >
              Сынаққа оралу
            </button>
            <button
              class="inline-flex min-h-11 items-center justify-center rounded-lg border-0 bg-[#d92d38] px-4 text-[14px] font-[700] text-white hover:bg-[#b4232d]"
              type="button"
              @click="confirmLeave"
            >
              Аяқтау
            </button>
          </div>
        </section>
      </div>
    </Teleport>
  </section>
</template>
