<script setup lang="ts">
import { ArrowRight, Gauge, RotateCcw, Trophy } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import BottomNav from '../components/BottomNav.vue'
import BrandMark from '../components/BrandMark.vue'
import { getForecastScreenModel } from '../features/forecast/forecastApplication'
import { getStudyPlan } from '../features/plan/studyPlanApplication'

const router = useRouter()
const forecast = getForecastScreenModel()
const studyPlan = getStudyPlan()
const subjectNames: Record<string, string> = {
  history: 'Қазақстан тарихы',
  reading: 'Оқу сауаттылығы',
  'math-literacy': 'Математикалық сауаттылық',
  math: 'Математика',
  physics: 'Физика',
}
const planSubjectId = studyPlan?.selectedSubjectIds[0]
const planSubjectName = planSubjectId ? (subjectNames[planSubjectId] ?? 'Таңдалған пән') : ''
const planExamDate = studyPlan
  ? new Intl.DateTimeFormat('kk-KZ', { day: 'numeric', month: 'long', year: 'numeric' }).format(
      new Date(`${studyPlan.examDate}T00:00:00`),
    )
  : ''

const shortcuts = [
  {
    title: 'Қателерді қайталау',
    detail: 'Меңгермеген тақырыптар',
    icon: RotateCcw,
    route: 'mistakes',
  },
  {
    title: 'Сұрақтар картасы',
    detail: 'Навигация интерфейсінің үлгісі',
    icon: Trophy,
    route: 'mock-exam',
  },
] as const
</script>

<template>
  <section class="screen-page bg-[#f8f8f8]">
    <header class="safe-top flex items-center justify-between px-4 pb-4 pt-4">
      <BrandMark />
      <button
        class="icon-button border border-[#e2e8f0] bg-white text-[#1f66d9]"
        type="button"
        aria-label="Ілгерілеуді ашу"
        @click="router.push({ name: 'progress' })"
      >
        <Gauge :size="21" />
      </button>
    </header>

    <div class="screen-content pt-0">
      <section
        class="overflow-hidden rounded-b-[30px] rounded-t-[20px] bg-[#1f66d9] px-5 py-6 text-white shadow-[0_12px_28px_rgba(31,102,217,.18)]"
      >
        <p class="text-sm font-semibold text-white">{{ forecast.eyebrow }}</p>
        <h1 class="mt-2 text-[27px] font-extrabold leading-tight tracking-[-.03em]">
          {{ forecast.title }}
        </h1>
        <p class="mt-2 text-sm leading-6 text-white">{{ forecast.description }}</p>
        <button
          class="mt-5 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] border-0 bg-white px-5 text-[15px] font-bold text-[#1d5bbd] transition hover:bg-[#f5f8ff]"
          type="button"
          @click="router.push({ name: 'training' })"
        >
          {{ forecast.actionLabel }} <ArrowRight :size="19" />
        </button>
      </section>

      <section v-if="studyPlan" class="card mt-5 p-4" aria-labelledby="saved-plan-title">
        <p class="eyebrow">Сақталған оқу мақсаты</p>
        <h2 id="saved-plan-title" class="mt-2 text-[17px] font-[800]">{{ planSubjectName }}</h2>
        <p class="mt-1 text-[13px] leading-5 text-[#667085]">
          Күндік мақсат: {{ studyPlan.dailyQuestionGoal }} сұрақ · ҰБТ күні: {{ planExamDate }}
        </p>
        <button
          class="secondary-button mt-4"
          type="button"
          @click="router.push({ name: 'personal-plan' })"
        >
          Мақсатты өзгерту
        </button>
      </section>

      <section class="mt-5" aria-labelledby="quick-actions-title">
        <h2 id="quick-actions-title" class="text-[17px] font-bold tracking-[-.02em]">
          Оқу режимдері
        </h2>
        <div class="mt-3 grid grid-cols-2 gap-3">
          <button
            v-for="shortcut in shortcuts"
            :key="shortcut.title"
            class="card min-h-[124px] p-4 text-left transition hover:border-[#b8cff3]"
            type="button"
            @click="router.push({ name: shortcut.route })"
          >
            <span class="grid size-10 place-items-center rounded-[13px] bg-[#edf4ff] text-[#1f66d9]"
              ><component :is="shortcut.icon" :size="20"
            /></span>
            <strong class="mt-3 block text-sm">{{ shortcut.title }}</strong>
            <span class="mt-1 block text-xs text-[#667085]">{{ shortcut.detail }}</span>
          </button>
        </div>
      </section>

      <section
        class="soft-card mt-5 p-4"
        :data-status="forecast.status"
        role="status"
        aria-labelledby="forecast-title"
      >
        <div class="flex items-start gap-3">
          <Gauge class="mt-0.5 shrink-0 text-[#1f66d9]" :size="22" />
          <div>
            <h2 id="forecast-title" class="text-[15px] font-bold">{{ forecast.title }}</h2>
            <p class="mt-1 text-sm leading-6 text-[#667085]">{{ forecast.note }}</p>
          </div>
        </div>
      </section>
    </div>
    <BottomNav active="home" />
  </section>
</template>
