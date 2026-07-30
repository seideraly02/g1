<script setup lang="ts">
import {
  ArrowLeft,
  ArrowRight,
  Atom,
  BatteryMedium,
  BookOpen,
  Calculator,
  Check,
  Landmark,
  Radical,
  Search,
  Wifi,
} from 'lucide-vue-next'
import type { Component } from 'vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

type SubjectTab = 'required' | 'profile'

interface Subject {
  id: string
  name: string
  description: string
  color: string
  soft: string
  icon: Component
  tabs: SubjectTab[]
}

const router = useRouter()
const search = ref('')
const activeTab = ref<SubjectTab>('required')
const selected = ref(new Set<string>(['history']))

const subjects: Subject[] = [
  {
    id: 'history',
    name: 'Қазақстан тарихы',
    description: 'Қазақ хандығы, XX ғасыр',
    color: '#2468f2',
    soft: '#edf4ff',
    icon: Landmark,
    tabs: ['required'],
  },
  {
    id: 'reading',
    name: 'Оқу сауаттылығы',
    description: 'Мәтіндер мен логика',
    color: '#8247ec',
    soft: '#f4efff',
    icon: BookOpen,
    tabs: ['required'],
  },
  {
    id: 'math-literacy',
    name: 'Математикалық сауаттылық',
    description: 'Практикалық есептер',
    color: '#18a95a',
    soft: '#edfbf3',
    icon: Calculator,
    tabs: ['required'],
  },
  {
    id: 'math',
    name: 'Математика',
    description: 'Алгебра және геометрия',
    color: '#d17a00',
    soft: '#fff9e9',
    icon: Radical,
    tabs: ['required', 'profile'],
  },
  {
    id: 'physics',
    name: 'Физика',
    description: 'Механика және электр құбылыстары',
    color: '#e02632',
    soft: '#fff0f1',
    icon: Atom,
    tabs: ['required', 'profile'],
  },
]

const filteredSubjects = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('kk-KZ')
  return subjects.filter((subject) => {
    const matchesTab = subject.tabs.includes(activeTab.value)
    const matchesSearch =
      !term ||
      subject.name.toLocaleLowerCase('kk-KZ').includes(term) ||
      subject.description.toLocaleLowerCase('kk-KZ').includes(term)
    return matchesTab && matchesSearch
  })
})

function toggleSubject(id: string) {
  const next = new Set(selected.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  selected.value = next
}

function continueToDiagnostic() {
  if (selected.value.size > 0) {
    router.push({ name: 'diagnostic' })
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

    <header class="flex h-[44px] shrink-0 items-center">
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

    <p class="mt-4 text-[15px] leading-[1.4] text-[#536178]">
      Кейін өзгертуге болады. Бастау үшін бір пән жеткілікті.
    </p>

    <label class="relative mt-3 block">
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

    <div class="mt-3 grid h-[44px] shrink-0 grid-cols-2 rounded-[16px] bg-[#e2e8f0] p-1">
      <button
        type="button"
        class="rounded-[12px] text-[13px] font-[800] transition-all"
        :class="
          activeTab === 'required'
            ? 'bg-white text-[#111b34] shadow-[0_2px_7px_rgba(25,42,71,.08)]'
            : 'text-[#536178]'
        "
        @click="activeTab = 'required'"
      >
        Міндетті
      </button>
      <button
        type="button"
        class="rounded-[12px] text-[13px] font-[800] transition-all"
        :class="
          activeTab === 'profile'
            ? 'bg-white text-[#111b34] shadow-[0_2px_7px_rgba(25,42,71,.08)]'
            : 'text-[#536178]'
        "
        @click="activeTab = 'profile'"
      >
        Бейіндік
      </button>
    </div>

    <div class="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-2">
      <button
        v-for="subject in filteredSubjects"
        :key="subject.id"
        type="button"
        class="flex min-h-[64px] shrink-0 items-center rounded-[18px] border bg-white px-3 text-left transition-all"
        :class="
          selected.has(subject.id)
            ? 'border-[#2468f2] bg-[#edf4ff] shadow-[0_0_0_3px_rgba(36,104,242,.08)]'
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
          <span class="block truncate text-[14px] font-[850] leading-[1.25] text-[#111b34]">
            {{ subject.name }}
          </span>
          <span class="mt-0.5 block truncate text-[12px] leading-[1.25] text-[#536178]">
            {{ subject.description }}
          </span>
        </span>
        <span
          class="ml-2 grid size-7 shrink-0 place-items-center rounded-[9px] border"
          :class="
            selected.has(subject.id)
              ? 'border-[#2468f2] bg-[#2468f2] text-white'
              : 'border-[#c9d4e2] bg-white text-transparent'
          "
          aria-hidden="true"
        >
          <Check :size="18" :stroke-width="2.4" />
        </span>
      </button>

      <p v-if="filteredSubjects.length === 0" class="mt-8 text-center text-[14px] text-[#6f7a90]">
        Пән табылмады
      </p>
    </div>

    <button
      class="primary-button mt-2 min-h-[52px] shrink-0 rounded-[16px] text-[16px]"
      type="button"
      :disabled="selected.size === 0"
      @click="continueToDiagnostic"
    >
      Жалғастыру
      <ArrowRight :size="20" :stroke-width="2" aria-hidden="true" />
    </button>
  </section>
</template>
