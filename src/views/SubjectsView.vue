<script setup lang="ts">
import { Code2, Landmark, Search, Sigma, SlidersHorizontal } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import BottomNav from '../components/BottomNav.vue'

type FilterKey = 'all' | 'profile' | 'weak'

interface Subject {
  id: 'history' | 'math' | 'informatics'
  name: string
  topic: string
  mastery: number
  accuracy: number
  badge: string
  profile: boolean
  weak: boolean
}

const router = useRouter()
const query = ref('')
const activeFilter = ref<FilterKey>('all')
const showSort = ref(false)
const sortLowFirst = ref(false)

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'Барлығы' },
  { key: 'profile', label: 'Бейіндік' },
  { key: 'weak', label: 'Әлсіздері 3' },
]

const subjects: Subject[] = [
  {
    id: 'history',
    name: 'Қазақстан тарихы',
    topic: 'Назар аударуды қажет ететін 3 тақырып',
    mastery: 48,
    accuracy: 63,
    badge: 'Қайталау',
    profile: false,
    weak: true,
  },
  {
    id: 'math',
    name: 'Математика',
    topic: 'Квадрат теңдеулер',
    mastery: 62,
    accuracy: 76,
    badge: 'Бейіндік',
    profile: true,
    weak: false,
  },
  {
    id: 'informatics',
    name: 'Информатика',
    topic: 'Алгоритмдер мен деректер құрылымдары',
    mastery: 71,
    accuracy: 82,
    badge: 'Жақсы қарқын',
    profile: true,
    weak: false,
  },
]

const visibleSubjects = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase('kk-KZ')
  const filtered = subjects.filter((subject) => {
    const inFilter =
      activeFilter.value === 'all' ||
      (activeFilter.value === 'profile' && subject.profile) ||
      (activeFilter.value === 'weak' && subject.weak)
    const inSearch =
      !needle || `${subject.name} ${subject.topic}`.toLocaleLowerCase('kk-KZ').includes(needle)
    return inFilter && inSearch
  })
  return sortLowFirst.value ? [...filtered].sort((a, b) => a.accuracy - b.accuracy) : filtered
})

function openSubject(subject: Subject) {
  void router.push({ name: subject.id === 'history' ? 'history-subject' : 'training' })
}

function toggleSortOrder() {
  sortLowFirst.value = !sortLowFirst.value
  showSort.value = false
}

function clearFilters() {
  query.value = ''
  activeFilter.value = 'all'
}
</script>

<template>
  <section class="screen-page bg-[#f8faff]">
    <AppHeader title="Пәндер">
      <template #actions>
        <button
          type="button"
          class="icon-button border-[#e3e9f2] bg-white"
          aria-label="Пәндерді сұрыптау"
          :aria-expanded="showSort"
          @click="showSort = !showSort"
        >
          <SlidersHorizontal :size="19" />
        </button>
      </template>
    </AppHeader>

    <div class="screen-content px-4 pt-1">
      <div v-if="showSort" class="relative z-10">
        <button
          type="button"
          class="absolute right-0 top-0 rounded-xl border border-[#e2e8f1] bg-white px-3 py-2 text-[11px] font-[750] shadow-lg"
          @click="toggleSortOrder"
        >
          {{ sortLowFirst ? 'Бастапқы ретпен' : 'Дәлдігі төменнен' }}
        </button>
      </div>

      <label
        class="flex h-12 items-center gap-3 rounded-[14px] border border-[#dfe6ef] bg-white px-4"
      >
        <Search :size="20" class="shrink-0 text-[#9aa8bc]" />
        <span class="sr-only">Пәнді немесе тақырыпты іздеу</span>
        <input
          v-model="query"
          type="search"
          class="min-w-0 flex-1 border-0 bg-transparent text-[13px] outline-none placeholder:text-[#a1aec2]"
          placeholder="Пәнді немесе тақырыпты іздеу"
        />
      </label>

      <div class="mt-3 flex gap-2" role="group" aria-label="Пәндер сүзгісі">
        <button
          v-for="filter in filters"
          :key="filter.key"
          type="button"
          class="chip h-9 px-3.5 text-[11px] transition-colors"
          :class="
            activeFilter === filter.key
              ? filter.key === 'weak'
                ? 'border-[#f0cf62] bg-[#fffaf0] text-[#b56803]'
                : 'chip--active'
              : ''
          "
          :aria-pressed="activeFilter === filter.key"
          @click="activeFilter = filter.key"
        >
          {{ filter.label }}
        </button>
      </div>

      <div class="mt-3 space-y-3" aria-live="polite">
        <button
          v-for="subject in visibleSubjects"
          :key="subject.id"
          type="button"
          class="w-full rounded-[18px] border p-3.5 text-left transition-transform active:scale-[.995]"
          :class="{
            'border-[#f3d66a] bg-[#fffdf3]': subject.id === 'history',
            'border-[#ddd3ff] bg-[#fdfcff]': subject.id === 'math',
            'border-[#dfe8e4] bg-white': subject.id === 'informatics',
          }"
          @click="openSubject(subject)"
        >
          <span class="flex items-start gap-3">
            <span
              class="grid size-10 shrink-0 place-items-center rounded-[12px]"
              :class="{
                'bg-[#fff7df] text-[#dc8105]': subject.id === 'history',
                'bg-[#f1edff] text-[#7846e8]': subject.id === 'math',
                'bg-[#ecfbf3] text-[#18a65a]': subject.id === 'informatics',
              }"
            >
              <Landmark v-if="subject.id === 'history'" :size="20" />
              <Sigma v-else-if="subject.id === 'math'" :size="20" />
              <Code2 v-else :size="20" />
            </span>

            <span class="min-w-0 flex-1">
              <span class="flex items-center justify-between gap-2">
                <strong class="truncate text-[13px]">{{ subject.name }}</strong>
                <span
                  class="chip shrink-0 border-0"
                  :class="{
                    'chip--orange': subject.id === 'history',
                    'bg-[#f0e9ff] text-[#7840db]': subject.id === 'math',
                    'chip--green': subject.id === 'informatics',
                  }"
                >
                  {{ subject.badge }}
                </span>
              </span>
              <span class="mt-1 block truncate text-[10px] text-[#68758a]">{{
                subject.topic
              }}</span>
            </span>
          </span>

          <span class="mt-3 flex justify-between text-[10px] text-[#627087]">
            <span>Меңгеру {{ subject.mastery }}%</span>
            <span>Дәлдік {{ subject.accuracy }}%</span>
          </span>
          <span class="progress-track mt-2 block">
            <span
              class="block h-full rounded-full"
              :class="{
                'bg-[linear-gradient(90deg,#d97d05,#ffc32a)]': subject.id === 'history',
                'bg-[linear-gradient(90deg,#7545e7,#a486f4)]': subject.id === 'math',
                'bg-[linear-gradient(90deg,#0fa552,#42d982)]': subject.id === 'informatics',
              }"
              :style="{ width: `${subject.mastery}%` }"
            />
          </span>

          <span
            v-if="subject.id !== 'informatics'"
            class="mt-3 flex h-10 items-center justify-center rounded-[11px] border border-[#91bdf8] bg-white text-[12px] font-[800] text-[#2468f2]"
          >
            Жалғастыру
          </span>
        </button>

        <div v-if="visibleSubjects.length === 0" class="card px-4 py-8 text-center">
          <p class="m-0 text-[13px] font-[750]">Пән табылмады</p>
          <button type="button" class="text-button mt-2" @click="clearFilters">
            Сүзгіні тазалау
          </button>
        </div>
      </div>
    </div>

    <BottomNav active="subjects" />
  </section>
</template>
