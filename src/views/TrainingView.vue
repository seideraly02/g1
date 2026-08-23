<script setup lang="ts">
import {
  ChevronRight,
  History,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  WandSparkles,
} from 'lucide-vue-next'
import { computed, ref, type Component } from 'vue'
import { useRouter } from 'vue-router'
import BottomNav from '../components/BottomNav.vue'
import SampleDataNotice from '../components/SampleDataNotice.vue'
import { getStudyPlan } from '../features/plan/studyPlanApplication'
import { startGuestDiagnostic } from '../features/session/sessionApplication'
import { createSavedGoalTrainingPresentation } from '../features/training/trainingPresentation'

type PlanKey = 'daily'

interface Plan {
  label: string
  title: string
  description: string
  duration: string
  questions: number
  topics: number
  effect: string
}

interface TrainingMode {
  key: PlanKey | 'mistakes' | 'mock'
  title: string
  description: string
  icon: Component
  tone: string
  badge?: string
}

const router = useRouter()
const activePlan = ref<PlanKey>('daily')
const savedGoal = createSavedGoalTrainingPresentation(getStudyPlan())

const plans: Record<PlanKey, Plan> = {
  daily: {
    label: 'Бастапқы режим',
    title: 'Қысқа жаттығу',
    description: 'Пәнді таңдап, бес сұраққа жауап бер',
    duration: '5 минут',
    questions: 5,
    topics: 1,
    effect: 'Таңдалған пән бойынша қысқа жаттығудан өту.',
  },
}

const modes: TrainingMode[] = [
  {
    key: 'mistakes',
    title: 'Қателермен жұмыс',
    description: '12 сұрақ қайталауды күтуде',
    icon: RotateCcw,
    tone: 'bg-[#fff9e9] text-[#d47a00]',
    badge: '12',
  },
  {
    key: 'mock',
    title: 'Сұрақтар картасы',
    description: '40 позициялы навигация үлгісі',
    icon: Timer,
    tone: 'bg-[#edf4ff] text-[#1f66d9]',
  },
]

const plan = computed<Plan>(() => {
  if (!savedGoal) return plans[activePlan.value]

  return {
    label: 'Сақталған мақсат',
    title: savedGoal.subjectName,
    description: `Күндік мақсатың — ${savedGoal.dailyQuestionGoal} сұрақ. Қазір қолжетімді қысқа жинақтан баста.`,
    duration: '5 минут',
    questions: savedGoal.starterQuestionIds.length,
    topics: 1,
    effect: 'Бұл 5 сұрақ сақталған пән бойынша орындалады.',
  }
})

function selectMode(mode: TrainingMode) {
  if (mode.key === 'mistakes') {
    router.push({ name: 'mistakes' })
    return
  }
  if (mode.key === 'mock') {
    router.push({ name: 'mock-exam' })
    return
  }
}

function startSelectedMode() {
  if (savedGoal) {
    const session = startGuestDiagnostic([savedGoal.subjectId], savedGoal.starterQuestionIds)
    void router.push({ name: 'diagnostic', query: { session: session.id } })
    return
  }

  void router.push({ name: 'subjects-onboarding' })
}
</script>

<template>
  <section class="screen-page bg-[#f8f8f8]">
    <div class="safe-top flex items-center justify-between px-4 pb-3 pt-4">
      <h1 class="page-title text-[22px]">Жаттығу</h1>
      <button
        class="icon-button border-[#dfe6ef] bg-white"
        type="button"
        aria-label="Қайталау тарихы"
        @click="router.push({ name: 'mistakes' })"
      >
        <History :size="21" />
      </button>
    </div>

    <div class="screen-content pt-1">
      <SampleDataNotice
        class="mb-3"
        text="Қателер саны мен сұрақтар картасы — интерфейс үлгісі. Сақталған оқу мақсаты жергілікті құрылғыдан оқылады."
      />
      <div
        class="overflow-hidden rounded-b-[30px] rounded-t-[20px] border border-[#1f66d9] bg-[#1f66d9] p-5 text-white shadow-[0_12px_28px_rgba(31,102,217,.18)]"
      >
        <div class="flex items-center justify-between">
          <span class="rounded-lg bg-white/15 px-2 py-1 text-[10px] font-[850] text-white">
            {{ plan.label }}
          </span>
          <span class="inline-flex items-center gap-2 text-[11px] text-white">
            <Timer :size="18" />
            {{ plan.duration }}
          </span>
        </div>

        <h2 class="mt-4 text-[19px] font-[900] tracking-[-.025em]">{{ plan.title }}</h2>
        <p class="mt-1 text-[13px] leading-5 text-white">{{ plan.description }}</p>

        <div class="mt-3 flex gap-2">
          <span
            class="rounded-[12px] border border-white/25 bg-white/10 px-3 py-2 text-[12px] font-[850] text-white"
          >
            {{ plan.questions }} сұрақ
          </span>
          <span
            class="rounded-[12px] border border-white/25 bg-white/10 px-3 py-2 text-[12px] font-[850] text-white"
          >
            {{ plan.topics }} тақырып
          </span>
        </div>

        <div
          class="mt-3 flex items-center gap-3 rounded-[16px] border border-white/20 bg-white/10 p-3"
        >
          <WandSparkles class="shrink-0" :size="22" />
          <p class="text-[12px] leading-5 text-white">
            <strong class="text-white">Күтілетін нәтиже:</strong>
            {{ plan.effect }}
          </p>
        </div>

        <button
          class="mt-4 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] border-0 bg-white px-5 text-[15px] font-bold text-[#1d5bbd]"
          type="button"
          @click="startSelectedMode"
        >
          Бастау
          <Play :size="19" fill="currentColor" />
        </button>
      </div>

      <div class="mt-3 flex items-center gap-3">
        <span class="section-label">БАСҚА РЕЖИМДЕР</span>
        <span class="h-px flex-1 bg-[#dce4ef]" />
      </div>

      <div class="card mt-2 overflow-hidden">
        <button
          v-for="(mode, index) in modes"
          :key="mode.key"
          class="flex min-h-[57px] w-full items-center gap-3 border-x-0 border-b-0 bg-white px-3 text-left"
          :class="index === 0 ? 'border-t-0' : 'border-t border-[#e6ebf2]'"
          type="button"
          :aria-pressed="mode.key === activePlan"
          @click="selectMode(mode)"
        >
          <span class="grid size-10 shrink-0 place-items-center rounded-xl" :class="mode.tone">
            <component :is="mode.icon" :size="21" />
          </span>
          <span class="min-w-0 flex-1">
            <strong class="block truncate text-[13px]">{{ mode.title }}</strong>
            <span class="mt-0.5 block truncate text-[10px] text-[#536178]">{{
              mode.description
            }}</span>
          </span>
          <span
            v-if="mode.badge"
            class="rounded-lg bg-[#fff1c9] px-2 py-1 text-[11px] font-[850] text-[#b65a09]"
          >
            {{ mode.badge }}
          </span>
          <Sparkles v-else-if="mode.key === activePlan" class="text-[#2869df]" :size="18" />
          <ChevronRight v-else class="text-[#98a6b9]" :size="20" />
        </button>
      </div>
    </div>

    <BottomNav active="training" />
  </section>
</template>
