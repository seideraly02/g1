<script setup lang="ts">
import { Info, TrendingUp, Trophy } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BottomNav from '../components/BottomNav.vue'

type RatingTab = 'league' | 'friends' | 'class'

interface RatingRow {
  place: number
  initials: string
  name: string
  score: number
  current?: boolean
}

const router = useRouter()
const activeTab = ref<RatingTab>('league')
const showInfo = ref(false)

const tabs: Array<{ key: RatingTab; label: string }> = [
  { key: 'league', label: 'Менің лигам' },
  { key: 'friends', label: 'Достар' },
  { key: 'class', label: 'Сынып' },
]

const lists: Record<RatingTab, RatingRow[]> = {
  league: [
    { place: 4, initials: 'АМ', name: 'Аружан М.', score: 1420 },
    { place: 5, initials: 'ДҚ', name: 'Данияр Қ.', score: 1365 },
    { place: 6, initials: 'С', name: 'Сіз', score: 1311, current: true },
    { place: 7, initials: 'НА', name: 'Нұрай А.', score: 1274 },
    { place: 8, initials: 'ЕТ', name: 'Ержан Т.', score: 1190 },
  ],
  friends: [
    { place: 1, initials: 'АМ', name: 'Аружан М.', score: 1420 },
    { place: 2, initials: 'С', name: 'Сіз', score: 1311, current: true },
    { place: 3, initials: 'НА', name: 'Нұрай А.', score: 1274 },
    { place: 4, initials: 'ЕТ', name: 'Ержан Т.', score: 1190 },
  ],
  class: [
    { place: 4, initials: 'ДҚ', name: 'Данияр Қ.', score: 1365 },
    { place: 5, initials: 'С', name: 'Сіз', score: 1311, current: true },
    { place: 6, initials: 'НА', name: 'Нұрай А.', score: 1274 },
    { place: 7, initials: 'ЕТ', name: 'Ержан Т.', score: 1190 },
  ],
}

const rows = computed(() => lists[activeTab.value])
const currentPlace = computed(() => rows.value.find((row) => row.current)?.place ?? 6)
</script>

<template>
  <section class="screen-page min-h-[844px] bg-[#f8faff]">
    <div class="safe-top flex items-center justify-between px-4 pb-2 pt-4">
      <h1 class="page-title text-[22px]">Рейтинг</h1>
      <button
        class="icon-button"
        type="button"
        aria-label="Рейтинг туралы"
        :aria-expanded="showInfo"
        @click="showInfo = !showInfo"
      >
        <Info :size="21" />
      </button>
    </div>

    <div class="screen-content space-y-2.5 pt-4">
      <div
        class="grid grid-cols-3 rounded-2xl bg-[#dfe6f0] p-1"
        role="tablist"
        aria-label="Рейтинг санаты"
      >
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="h-10 rounded-xl border-0 text-[12px] font-[800]"
          :class="
            activeTab === tab.key
              ? 'bg-white text-[#111b34] shadow-sm'
              : 'bg-transparent text-[#536178]'
          "
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.key"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div
        v-if="showInfo"
        class="rounded-xl border border-[#b9dcff] bg-[#eff6ff] px-3 py-2 text-[11px] leading-5 text-[#34516f]"
      >
        Апта сайын жинаған ұпайыңызға қарай лигадағы орныңыз жаңарады.
      </div>

      <div class="rounded-[24px] bg-gradient-to-br from-[#3b348f] to-[#5437ea] p-4 text-white">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-[10px] font-[850] tracking-[.08em] text-[#d4d1ff]">АПТАЛЫҚ ЛИГА</div>
            <div class="mt-1 text-[23px] font-[900]">«Зерде» лигасы</div>
          </div>
          <div class="grid size-10 place-items-center rounded-xl bg-white/15">
            <Trophy :size="21" />
          </div>
        </div>
        <div class="mt-4 flex items-end justify-between">
          <div>
            <div class="text-[13px] text-[#d4d1ff]">Сіздің орныңыз</div>
            <div class="metric-value text-[26px] font-[900]">{{ currentPlace }}-орын</div>
          </div>
          <div class="text-right">
            <div class="text-[13px] text-[#d4d1ff]">Аяқталуына</div>
            <div class="metric-value text-[17px] font-[850]">2 күн 14 сағ.</div>
          </div>
        </div>
      </div>

      <div class="card overflow-hidden p-2">
        <div class="flex items-center justify-between px-2 pb-1">
          <span class="rounded-lg bg-[#dcf8e7] px-2 py-1 text-[10px] font-[800] text-[#15894a]">
            Жоғарылау аймағы · 1–5
          </span>
          <span class="text-[10px] text-[#536178]">ұпай</span>
        </div>

        <div
          v-for="row in rows"
          :key="`${activeTab}-${row.place}`"
          class="grid min-h-[51px] grid-cols-[28px_38px_1fr_auto] items-center gap-2 rounded-xl px-2"
          :class="
            row.current
              ? 'border border-[#b8d9ff] bg-[#eff6ff]'
              : row.place <= 5
                ? 'border-l-[3px] border-l-[#1aa85a]'
                : 'border-l-[3px] border-l-[#9aabc0]'
          "
        >
          <span class="metric-value text-[12px] font-[850]">{{ row.place }}</span>
          <span
            class="grid size-[34px] place-items-center rounded-xl text-[11px] font-[850]"
            :class="row.current ? 'bg-[#bbd9ff] text-[#235ec9]' : 'bg-[#e5ebf3]'"
          >
            {{ row.initials }}
          </span>
          <div class="min-w-0">
            <div class="truncate text-[12px]" :class="{ 'font-[850]': row.current }">
              {{ row.name }}
            </div>
            <div v-if="row.current" class="text-[10px] text-[#536178]">тағы +54 ұпай</div>
          </div>
          <span class="metric-value text-[12px] font-[850]">{{
            row.score.toLocaleString('kk-KZ')
          }}</span>
        </div>

        <div class="flex items-center justify-between px-2 pt-2">
          <span class="rounded-lg bg-[#fff1c9] px-2 py-1 text-[10px] font-[800] text-[#b65a09]">
            Төмендеу аймағы · 21–25
          </span>
          <span class="text-[10px] text-[#536178]">көрсетілмеген</span>
        </div>
      </div>

      <button
        class="flex w-full items-center gap-3 rounded-[18px] border border-[#b9dcff] bg-[#eff6ff] p-3 text-left"
        type="button"
        @click="router.push({ name: 'training' })"
      >
        <TrendingUp class="shrink-0" :size="21" />
        <span class="text-[12px] leading-5">
          <strong>Тағы бір жаттығу</strong> екі орынға көтерілуге көмектеседі.
        </span>
      </button>
    </div>

    <BottomNav active="progress" />
  </section>
</template>
