<script setup lang="ts">
import { ArrowLeft, ArrowRight, Check, Landmark, Search } from 'lucide-vue-next'
import type { Component } from 'vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { startGuestDiagnostic } from '../features/session/sessionApplication'
import { diagnosticRepository } from '../services/api/apiDiagnosticRepository'
import { subjectRepository } from '../services/api/apiSubjectRepository'

interface Subject {
  id: string
  name: string
  description: string
  color: string
  soft: string
  icon: Component
}

const router = useRouter()
const search = ref('')
const selected = ref(new Set<string>())
const subjects = ref<Subject[]>([])
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const failedAction = ref<'subjects' | 'diagnostic'>('subjects')

const subjectMetadata: Record<string, Pick<Subject, 'description' | 'color' | 'soft' | 'icon'>> = {
  'history-kz': {
    description: 'Қазақ хандығы, XX ғасыр',
    color: '#2468f2',
    soft: '#edf4ff',
    icon: Landmark,
  },
}

async function loadSubjects() {
  loading.value = true
  error.value = ''
  failedAction.value = 'subjects'
  try {
    const available = await subjectRepository.getSubjects()
    subjects.value = available.map((subject) => ({
      ...subject,
      ...(subjectMetadata[subject.id] ?? {
        description: 'Диагностикалық тест',
        color: '#2468f2',
        soft: '#edf4ff',
        icon: Landmark,
      }),
    }))
    if (!subjects.value.some((subject) => selected.value.has(subject.id))) {
      selected.value = subjects.value[0] ? new Set([subjects.value[0].id]) : new Set()
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Пәндерді жүктеу мүмкін болмады'
  } finally {
    loading.value = false
  }
}

onMounted(loadSubjects)

const filteredSubjects = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('kk-KZ')
  return subjects.value.filter((subject) => {
    return (
      !term ||
      subject.name.toLocaleLowerCase('kk-KZ').includes(term) ||
      subject.description.toLocaleLowerCase('kk-KZ').includes(term)
    )
  })
})

function toggleSubject(id: string) {
  selected.value = new Set([id])
}

async function continueToDiagnostic() {
  const subjectId = [...selected.value][0]
  if (!subjectId || submitting.value) return
  submitting.value = true
  error.value = ''
  failedAction.value = 'diagnostic'
  try {
    const questions = await diagnosticRepository.getQuestions(subjectId)
    const session = startGuestDiagnostic(
      [subjectId],
      questions.map((question) => question.id),
    )
    await router.push({ name: 'diagnostic', query: { session: session.id } })
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Диагностиканы бастау мүмкін болмады'
  } finally {
    submitting.value = false
  }
}

function retryFailedAction() {
  if (failedAction.value === 'diagnostic') void continueToDiagnostic()
  else void loadSubjects()
}
</script>

<template>
  <section
    class="screen-page flex flex-col bg-[#f8f8f8] px-4 pb-4 lg:px-[clamp(40px,6vw,96px)] lg:pb-10"
  >
    <header class="safe-top flex min-h-[64px] shrink-0 items-end pb-2">
      <button
        class="icon-button -ml-1"
        type="button"
        aria-label="Артқа"
        @click="router.push({ name: 'welcome' })"
      >
        <ArrowLeft :size="21" :stroke-width="2" />
      </button>
      <h1 class="ml-3 flex-1 text-[21px] font-[900] tracking-[-.025em] text-[#111b34]">
        Пәнді таңда
      </h1>
      <span class="pr-1 text-[13px] text-[#536178]">1/2</span>
    </header>

    <div class="subject-select-layout">
      <div class="subject-select-controls">
        <p class="mt-4 text-[15px] leading-[1.4] text-[#536178] lg:mt-2 lg:max-w-[440px]">
          Кейін өзгертуге болады. Бастау үшін бір пән жеткілікті.
        </p>

        <label v-if="subjects.length > 1" class="relative mt-3 block">
          <Search
            class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8ea0b8]"
            :size="20"
            :stroke-width="2"
            aria-hidden="true"
          />
          <input
            v-model="search"
            type="search"
            class="h-[48px] w-full rounded-[16px] border border-[#dce3ec] bg-white pl-11 pr-4 text-[14px] text-[#111b34] placeholder:text-[#9aabc0]"
            placeholder="Пәнді іздеу"
            aria-label="Пәнді іздеу"
          />
        </label>
      </div>

      <div
        class="subject-select-list mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-2 lg:mt-0"
      >
        <p
          v-if="loading"
          class="mt-8 text-center text-[14px] text-[#6f7a90]"
          role="status"
          aria-live="polite"
        >
          Пәндер жүктеліп жатыр…
        </p>
        <button
          v-for="subject in filteredSubjects"
          :key="subject.id"
          type="button"
          class="flex min-h-[64px] shrink-0 items-center rounded-[18px] border bg-white px-3 text-left transition-all"
          :class="
            selected.has(subject.id)
              ? 'border-[#1f66d9] bg-[#edf4ff] shadow-[0_0_0_3px_rgba(31,102,217,.08)]'
              : 'border-[#dce3ec]'
          "
          :aria-pressed="selected.has(subject.id)"
          @click="toggleSubject(subject.id)"
        >
          <span
            class="grid size-10 shrink-0 place-items-center rounded-[13px]"
            :style="{ color: subject.color, backgroundColor: subject.soft }"
          >
            <component :is="subject.icon" :size="21" :stroke-width="2.15" aria-hidden="true" />
          </span>
          <span class="ml-3 min-w-0 flex-1">
            <span class="block text-[14px] font-[850] leading-[1.25] text-[#111b34]">
              {{ subject.name }}
            </span>
            <span class="mt-0.5 block text-[12px] leading-[1.25] text-[#536178]">
              {{ subject.description }}
            </span>
          </span>
          <span
            class="ml-2 grid size-7 shrink-0 place-items-center rounded-[9px] border"
            :class="
              selected.has(subject.id)
                ? 'border-[#1f66d9] bg-[#1f66d9] text-white'
                : 'border-[#c9d4e2] bg-white text-transparent'
            "
            aria-hidden="true"
          >
            <Check :size="18" :stroke-width="2.4" />
          </span>
        </button>

        <p
          v-if="!loading && !error && filteredSubjects.length === 0"
          class="mt-8 text-center text-[14px] text-[#6f7a90]"
        >
          Пән табылмады
        </p>
      </div>

      <div v-if="error" class="mt-2 flex items-center justify-between gap-3" role="alert">
        <p class="text-[13px] text-[#b4232a]">{{ error }}</p>
        <button class="text-button min-h-11 shrink-0" type="button" @click="retryFailedAction">
          Қайталап көру
        </button>
      </div>

      <button
        class="subject-select-action primary-button mt-2 min-h-[52px] shrink-0 rounded-[16px] text-[16px] lg:mt-0"
        type="button"
        :disabled="selected.size === 0 || loading || submitting"
        @click="continueToDiagnostic"
      >
        {{ submitting ? 'Жүктеліп жатыр…' : 'Жалғастыру' }}
        <ArrowRight :size="20" :stroke-width="2" aria-hidden="true" />
      </button>
    </div>
  </section>
</template>
