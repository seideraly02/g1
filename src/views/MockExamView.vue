<script setup lang="ts">
import { ArrowLeft, ArrowRight, Clock3, Flag } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import {
  completeTrialTraining,
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
    router.push({ name: 'training-result' })
  }
}
</script>

<template>
  <section class="screen-page flex min-h-[844px] flex-col bg-[#f8faff]">
    <AppHeader title="Сынақ ҰБТ" close>
      <template #actions>
        <div
          class="flex items-center gap-2 rounded-xl bg-[#f0f3f8] px-3 py-2 text-[14px] font-[850]"
        >
          <Clock3 :size="18" />
          <span class="metric-value">01:42:18</span>
        </div>
      </template>
    </AppHeader>

    <div class="flex flex-1 flex-col px-4 pb-4">
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
        <div class="mt-2 flex justify-between gap-1.5">
          <button
            v-for="number in questionNumbers"
            :key="number"
            class="grid h-8 min-w-0 flex-1 place-items-center rounded-[9px] border text-[11px] font-[800]"
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

      <div class="mt-auto grid grid-cols-2 gap-2 pt-4">
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
  </section>
</template>
