<script setup lang="ts">
import {
  ChevronRight,
  Heart,
  History,
  Layers3,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  WandSparkles,
  Zap,
} from 'lucide-vue-next'
import { computed, ref, type Component } from 'vue'
import { useRouter } from 'vue-router'
import BottomNav from '../components/BottomNav.vue'

type PlanKey = 'daily' | 'quick' | 'regular' | 'favorites'

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

const plans: Record<PlanKey, Plan> = {
  daily: {
    label: 'Ұсынылады',
    title: 'Күннің жаттығуы',
    description: 'Әлсіз тақырыптар + аралық қайталау',
    duration: '12 минут',
    questions: 20,
    topics: 3,
    effect: '2 қатені бекітіп, тарих бойынша дәлдікті арттыру.',
  },
  quick: {
    label: 'Жылдам режим',
    title: 'Жылдам жаттығу',
    description: 'Күнделікті ырғақты сақтауға арналған қысқа жинақ',
    duration: '3 минут',
    questions: 5,
    topics: 1,
    effect: 'Күндік мақсатты орындап, сабақтар сериясын сақтау.',
  },
  regular: {
    label: 'Өз таңдауыңыз',
    title: 'Қалыпты жаттығу',
    description: 'Пән мен тақырыптарды өзіңіз таңдаңыз',
    duration: '18 минут',
    questions: 20,
    topics: 3,
    effect: 'Таңдалған тақырыптарды жүйелі түрде бекіту.',
  },
  favorites: {
    label: 'Сақталғандар',
    title: 'Таңдаулы сұрақтар',
    description: 'Бұрын сақталған сұрақтарды қайталау',
    duration: '6 минут',
    questions: 8,
    topics: 2,
    effect: 'Маңызды сұрақтарды қайта қарап, жауапты бекіту.',
  },
}

const modes: TrainingMode[] = [
  {
    key: 'quick',
    title: 'Жылдам жаттығу',
    description: '5 сұрақ · шамамен 3 минут',
    icon: Zap,
    tone: 'bg-[#ecfbf3] text-[#19a658]',
  },
  {
    key: 'regular',
    title: 'Қалыпты жаттығу',
    description: 'Пән мен тақырыптарды таңдаңыз',
    icon: Layers3,
    tone: 'bg-[#eef5ff] text-[#2869df]',
  },
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
    title: 'Сынақ ҰБТ',
    description: 'Таймері бар толық формат',
    icon: Timer,
    tone: 'bg-[#f5f0ff] text-[#8338e8]',
  },
  {
    key: 'favorites',
    title: 'Таңдаулы сұрақтар',
    description: '8 сұрақ сақталды',
    icon: Heart,
    tone: 'bg-[#fff0f1] text-[#dc2933]',
  },
]

const plan = computed(() => plans[activePlan.value])

function selectMode(mode: TrainingMode) {
  if (mode.key === 'mistakes') {
    router.push({ name: 'mistakes' })
    return
  }
  if (mode.key === 'mock') {
    router.push({ name: 'mock-exam' })
    return
  }
  activePlan.value = mode.key
}
</script>

<template>
  <section class="screen-page min-h-[844px] bg-[#f8faff]">
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
      <div class="rounded-[22px] border border-[#b9dcff] bg-gradient-to-br from-[#eef6ff] to-[#f2f4ff] p-4">
        <div class="flex items-center justify-between">
          <span class="rounded-lg bg-[#dceaff] px-2 py-1 text-[10px] font-[850] text-[#235ec9]">
            {{ plan.label }}
          </span>
          <span class="inline-flex items-center gap-2 text-[11px] text-[#536178]">
            <Timer :size="18" />
            {{ plan.duration }}
          </span>
        </div>

        <h2 class="mt-4 text-[19px] font-[900] tracking-[-.025em]">{{ plan.title }}</h2>
        <p class="mt-1 text-[11px] leading-5 text-[#536178]">{{ plan.description }}</p>

        <div class="mt-3 flex gap-2">
          <span class="rounded-full border border-[#b9dcff] bg-white/50 px-3 py-2 text-[12px] font-[850] text-[#235ec9]">
            {{ plan.questions }} сұрақ
          </span>
          <span class="rounded-full border border-[#ddcaff] bg-white/50 px-3 py-2 text-[12px] font-[850] text-[#7434dc]">
            {{ plan.topics }} тақырып
          </span>
        </div>

        <div class="mt-3 flex items-center gap-3 rounded-[17px] border border-[#dce4ef] bg-white/80 p-3">
          <WandSparkles class="shrink-0" :size="22" />
          <p class="text-[11px] leading-5 text-[#536178]">
            <strong class="text-[#111b34]">Күтілетін нәтиже:</strong>
            {{ plan.effect }}
          </p>
        </div>

        <button class="primary-button mt-3" type="button" @click="router.push({ name: 'mock-exam' })">
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
            <span class="mt-0.5 block truncate text-[10px] text-[#536178]">{{ mode.description }}</span>
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
