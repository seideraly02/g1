<script setup lang="ts">
import {
  ArrowLeft,
  BatteryMedium,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Target,
  WandSparkles,
  Wifi,
} from 'lucide-vue-next'
import type { Component } from 'vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

interface PlanSetting {
  id: string
  label: string
  value: string
  icon: Component
  color: string
  soft: string
}

const router = useRouter()
const dailyGoal = ref(20)
const activeSetting = ref<string | null>(null)
const goals = [
  { value: 10, minutes: 5 },
  { value: 20, minutes: 12 },
  { value: 30, minutes: 18 },
  { value: 50, minutes: 30 },
]
const settings: PlanSetting[] = [
  {
    id: 'subjects',
    label: 'Бейіндік пәндер',
    value: 'Математика, Информатика',
    icon: BookOpen,
    color: '#8247ec',
    soft: '#f4efff',
  },
  {
    id: 'target',
    label: 'Мақсат',
    value: '72 → 105 балл',
    icon: Target,
    color: '#16a757',
    soft: '#edfbf3',
  },
  {
    id: 'date',
    label: 'ҰБТ күні',
    value: '2027 жылғы 18 маусым',
    icon: CalendarDays,
    color: '#d17a00',
    soft: '#fff9e9',
  },
]
</script>

<template>
  <section class="screen-page flex min-h-[844px] flex-col bg-[#f8fafc] px-4 pb-4">
    <div class="flex h-[42px] shrink-0 items-center justify-between px-1 pt-1 text-[#111b34]">
      <span class="text-[12px] font-[850]">09:41</span>
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

    <header class="flex min-h-[58px] shrink-0 items-start">
      <button
        class="icon-button -ml-1 mt-2"
        type="button"
        aria-label="Артқа"
        @click="router.push({ name: 'save-progress' })"
      >
        <ArrowLeft :size="21" :stroke-width="2" />
      </button>
      <h1 class="ml-3 mt-1 flex-1 text-[21px] font-[900] leading-[1.25] tracking-[-.025em] text-[#111b34]">
        Жеке<br />жоспар
      </h1>
      <button
        type="button"
        class="mt-3 min-h-8 text-[14px] font-[800] text-[#2468f2]"
        @click="router.push({ name: 'home' })"
      >
        Өткізіп жіберу
      </button>
    </header>

    <div class="mt-1 grid h-1.5 shrink-0 grid-cols-5 gap-1.5" aria-label="5 қадамның 4-қадамы">
      <span v-for="step in 5" :key="step" class="rounded-full" :class="step <= 4 ? 'bg-[#2468f2]' : 'bg-[#dfe6ef]'" />
    </div>

    <main class="min-h-0 flex-1 overflow-y-auto pb-3">
      <div class="mt-4 flex items-center justify-between">
        <span class="text-[11px] font-[850] uppercase tracking-[.03em] text-[#2468f2]">
          5 қадамның 4-қадамы
        </span>
        <span class="text-[12px] text-[#536178]">Күнделікті мақсат</span>
      </div>

      <h2 class="mt-3 text-[25px] font-[900] leading-[1.18] tracking-[-.025em] text-[#0d1730]">
        Күніне қанша сұрақ шешу ыңғайлы?
      </h2>
      <p class="mt-2 text-[14px] leading-[1.4] text-[#536178]">
        Мақсатты профильде өзгертуге болады. Өзіңе ыңғайлы қарқыннан баста.
      </p>

      <div class="mt-4 grid grid-cols-4 gap-2">
        <button
          v-for="goal in goals"
          :key="goal.value"
          type="button"
          class="min-h-[78px] rounded-[18px] border bg-white px-1 transition-all"
          :class="
            dailyGoal === goal.value
              ? 'border-[#2468f2] bg-[#edf4ff] shadow-[0_0_0_3px_rgba(36,104,242,.09)]'
              : 'border-[#dce3ec]'
          "
          :aria-pressed="dailyGoal === goal.value"
          @click="dailyGoal = goal.value"
        >
          <strong
            class="block text-[22px] font-[900] leading-none"
            :class="dailyGoal === goal.value ? 'text-[#2468f2]' : 'text-[#111b34]'"
          >
            {{ goal.value }}
          </strong>
          <span class="mt-2 block whitespace-nowrap text-[10px] text-[#536178]">≈ {{ goal.minutes }} минут</span>
        </button>
      </div>

      <div class="mt-4 flex items-center rounded-[18px] border border-[#add4ff] bg-[#edf5ff] px-6 py-5">
        <WandSparkles :size="23" :stroke-width="2.1" class="shrink-0 text-[#2468f2]" aria-hidden="true" />
        <div class="ml-5">
          <strong class="block text-[13px] font-[850] text-[#111b34]">Оңтайлы бастау: {{ dailyGoal }}</strong>
          <p class="mt-1 text-[12px] leading-[1.35] text-[#536178]">
            Жоспарда әлсіз тақырыптар мен алдағы қайталаулар ескеріледі.
          </p>
        </div>
      </div>

      <div class="mt-4 flex items-center gap-3">
        <span class="shrink-0 text-[10px] font-[850] uppercase tracking-[.04em] text-[#536178]">
          Сенің баптауларың
        </span>
        <span class="h-px flex-1 bg-[#dce3ec]" />
      </div>

      <div class="mt-4 overflow-hidden rounded-[19px] border border-[#dce3ec] bg-white px-3">
        <button
          v-for="(setting, index) in settings"
          :key="setting.id"
          type="button"
          class="flex min-h-[59px] w-full items-center px-1 text-left transition-colors"
          :class="[
            index < settings.length - 1 ? 'border-b border-[#e7ebf1]' : '',
            activeSetting === setting.id ? 'bg-[#f8fafc]' : '',
          ]"
          :aria-pressed="activeSetting === setting.id"
          @click="activeSetting = activeSetting === setting.id ? null : setting.id"
        >
          <span
            class="grid size-10 shrink-0 place-items-center rounded-[13px]"
            :style="{ color: setting.color, backgroundColor: setting.soft }"
          >
            <component :is="setting.icon" :size="21" :stroke-width="2.1" aria-hidden="true" />
          </span>
          <span class="ml-3 min-w-0 flex-1">
            <strong class="block truncate text-[13px] font-[850] text-[#111b34]">{{ setting.label }}</strong>
            <span class="mt-0.5 block truncate text-[11px] text-[#536178]">{{ setting.value }}</span>
          </span>
          <ChevronRight :size="20" :stroke-width="2" class="shrink-0 text-[#91a0b3]" aria-hidden="true" />
        </button>
      </div>
    </main>

    <button
      class="primary-button mt-2 min-h-[52px] shrink-0 rounded-[16px] text-[16px]"
      type="button"
      @click="router.push({ name: 'home' })"
    >
      Жоспар құру
      <Check :size="19" :stroke-width="2.4" aria-hidden="true" />
    </button>
  </section>
</template>
