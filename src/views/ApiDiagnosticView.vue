<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  diagnosticRepository,
  type DiagnosticQuestionDto,
  type DiagnosticResultDto,
} from '../services/api/apiDiagnosticRepository'

const router = useRouter()
const subjectId = 'history'
const questions = ref<DiagnosticQuestionDto[]>([])
const answers = ref<Record<string, number>>({})
const currentIndex = ref(0)
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const result = ref<DiagnosticResultDto | null>(null)

const currentQuestion = computed(() => questions.value[currentIndex.value])
const selectedIndex = computed(() => {
  const question = currentQuestion.value
  return question ? answers.value[question.id] : undefined
})
const progress = computed(() => questions.value.length ? ((currentIndex.value + 1) / questions.value.length) * 100 : 0)

onMounted(async () => {
  try {
    questions.value = await diagnosticRepository.getQuestions(subjectId)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Сұрақтарды жүктеу мүмкін болмады'
  } finally {
    loading.value = false
  }
})

function selectAnswer(index: number) {
  const question = currentQuestion.value
  if (!question || result.value) return
  answers.value = { ...answers.value, [question.id]: index }
}

async function continueDiagnostic() {
  if (selectedIndex.value === undefined) return
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value += 1
    return
  }
  submitting.value = true
  error.value = ''
  try {
    result.value = await diagnosticRepository.submit(
      subjectId,
      questions.value.map((question) => ({
        questionId: question.id,
        selectedIndex: answers.value[question.id] ?? -1,
      })),
    )
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Нәтижені сақтау мүмкін болмады'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="screen-page mx-auto min-h-screen max-w-[760px] bg-[#f8fafc] px-4 py-6">
    <header class="flex items-center justify-between gap-4">
      <button class="min-h-11 text-sm font-bold text-[#2468f2]" type="button" @click="router.back()">Артқа</button>
      <div class="min-w-0 flex-1">
        <h1 class="truncate text-center text-base font-black text-[#111b34]">Қазақстан тарихы</h1>
        <div class="mt-2 h-2 overflow-hidden rounded-full bg-[#e3e8f0]">
          <div class="h-full rounded-full bg-[#2468f2] transition-all" :style="{ width: `${progress}%` }" />
        </div>
      </div>
      <span class="min-w-12 text-right text-sm font-bold text-[#536178]">
        {{ questions.length ? `${currentIndex + 1}/${questions.length}` : '—' }}
      </span>
    </header>

    <main class="mt-8">
      <p v-if="loading" class="text-center text-sm text-[#536178]">Сұрақтар жүктелуде…</p>
      <div v-else-if="error" class="rounded-2xl bg-[#fff0f1] p-4 text-sm text-[#b4232a]" role="alert">{{ error }}</div>

      <div v-else-if="result" class="rounded-3xl bg-white p-6 shadow-sm">
        <p class="text-sm font-bold text-[#2468f2]">Диагностика аяқталды</p>
        <h2 class="mt-2 text-3xl font-black text-[#111b34]">{{ result.correct }} / {{ result.total }}</h2>
        <p class="mt-3 text-sm leading-6 text-[#536178]">
          Бұл бес сұрақтық бастапқы нәтиже. Ол нақты ҰБТ болжамы емес, тек оқу жоспарын бастауға арналған.
        </p>
        <button class="mt-6 min-h-12 w-full rounded-2xl bg-[#2468f2] px-4 font-black text-white" type="button" @click="router.push({ name: 'home' })">
          Басты бетке өту
        </button>
      </div>

      <template v-else-if="currentQuestion">
        <span class="rounded-lg bg-[#dfecff] px-2 py-1 text-xs font-extrabold text-[#2468f2]">{{ currentQuestion.topic }}</span>
        <h2 class="mt-4 text-xl font-black leading-8 text-[#111b34]">{{ currentQuestion.text }}</h2>
        <div class="mt-5 space-y-3">
          <button
            v-for="(option, index) in currentQuestion.options"
            :key="option"
            type="button"
            class="min-h-14 w-full rounded-2xl border bg-white px-4 text-left text-sm font-bold transition"
            :class="selectedIndex === index ? 'border-[#2468f2] ring-2 ring-[#b9d2ff]' : 'border-[#dfe5ee]'"
            @click="selectAnswer(index)"
          >
            {{ String.fromCharCode(65 + index) }}. {{ option }}
          </button>
        </div>
        <button
          class="mt-8 min-h-12 w-full rounded-2xl bg-[#2468f2] px-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          :disabled="selectedIndex === undefined || submitting"
          @click="continueDiagnostic"
        >
          {{ submitting ? 'Сақталуда…' : currentIndex === questions.length - 1 ? 'Нәтижені көру' : 'Келесі сұрақ' }}
        </button>
      </template>
    </main>
  </section>
</template>
