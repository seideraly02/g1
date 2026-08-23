<script setup lang="ts">
import { Bell, BookOpen, ChevronRight, Flame, Medal, Star, Target } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import BottomNav from '../components/BottomNav.vue'
import SampleDataNotice from '../components/SampleDataNotice.vue'

const router = useRouter()
const selectedAchievement = ref('series')
</script>

<template>
  <section class="screen-page w-full min-w-0 bg-[#f8f8f8]">
    <AppHeader title="Профиль" />

    <div
      class="screen-content min-w-0 space-y-2.5 pt-3 lg:grid lg:grid-cols-12 lg:gap-4 lg:space-y-0"
    >
      <SampleDataNotice
        class="lg:col-span-12"
        text="Авторизация уақытша өшірулі. Профильдегі барлық көрсеткіш — интерфейс үлгісі және жеке нәтижең емес."
      />
      <div class="card flex items-center gap-3 p-4 lg:col-span-7">
        <div
          class="grid size-[74px] shrink-0 place-items-center rounded-[24px] bg-[#edf4ff] text-[26px] font-[900] text-[#1f66d9]"
        >
          С
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="text-[20px] font-[900] leading-none">Қонақ оқушы</h2>
          <div class="mt-2 text-[11px] text-[#536178]">Жеке мақсат әлі бапталмаған</div>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              class="inline-flex items-center rounded-full border border-[#cfe0fb] bg-[#edf4ff] px-3 py-1.5 text-[11px] font-[850] text-[#1f66d9]"
              type="button"
              @click="router.push({ name: 'rating' })"
            >
              Рейтинг үлгісі
            </button>
            <button
              class="inline-flex items-center gap-1.5 rounded-full border border-[#ffe071] bg-[#fffbec] px-3 py-1.5 text-[11px] font-[850] text-[#b65a09]"
              type="button"
              @click="router.push({ name: 'streak' })"
            >
              <Flame :size="16" />
              Серия үлгісі
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 lg:col-span-5">
        <div class="card px-2 py-3 text-center">
          <div class="metric-value text-[21px] font-[900]">20</div>
          <div class="mt-1 text-[10px] text-[#536178]">күндік мақсат</div>
        </div>
        <div class="card px-2 py-3 text-center">
          <div class="metric-value text-[21px] font-[900]">80%</div>
          <div class="mt-1 text-[10px] text-[#536178]">дәлдік</div>
        </div>
        <div class="card px-2 py-3 text-center">
          <div class="metric-value text-[21px] font-[900]">1</div>
          <div class="mt-1 text-[10px] text-[#536178]">мұздату</div>
        </div>
      </div>

      <div class="card overflow-hidden lg:col-span-7">
        <button
          class="flex min-h-[52px] w-full items-center gap-3 border-0 bg-white px-3 text-left"
          type="button"
          @click="router.push({ name: 'subjects' })"
        >
          <span
            class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf4ff] text-[#1f66d9]"
          >
            <BookOpen :size="21" />
          </span>
          <strong class="min-w-0 flex-1 text-[13px]">Пәндер мен мақсаттар</strong>
          <ChevronRight class="shrink-0 text-[#98a6b9]" :size="20" />
        </button>
        <button
          class="flex min-h-[52px] w-full items-center gap-3 border-x-0 border-b-0 border-t border-[#e6ebf2] bg-white px-3 text-left"
          type="button"
          @click="router.push({ name: 'notifications' })"
        >
          <span
            class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ecfbf3] text-[#19a658]"
          >
            <Bell :size="21" />
          </span>
          <strong class="min-w-0 flex-1 text-[13px]">Хабарландырулар үлгісі</strong>
          <ChevronRight class="shrink-0 text-[#98a6b9]" :size="20" />
        </button>
      </div>

      <div class="flex items-center justify-between lg:col-span-5 lg:px-4">
        <span class="text-[12px] text-[#536178]">Жетістіктер · 6</span>
        <div class="flex gap-2">
          <button
            class="grid size-10 place-items-center rounded-xl border-0 bg-[#fff9e9] text-[#d47a00]"
            :class="{ 'ring-2 ring-[#d47a00]/30': selectedAchievement === 'medal' }"
            type="button"
            aria-label="Марапат жетістігі"
            @click="selectedAchievement = 'medal'"
          >
            <Medal :size="20" />
          </button>
          <button
            class="grid size-10 place-items-center rounded-xl border-0 bg-[#edf4ff] text-[#1f66d9]"
            :class="{ 'ring-2 ring-[#1f66d9]/30': selectedAchievement === 'star' }"
            type="button"
            aria-label="Жұлдыз жетістігі"
            @click="selectedAchievement = 'star'"
          >
            <Star :size="20" />
          </button>
          <button
            class="grid size-10 place-items-center rounded-xl border-0 bg-[#ecfbf3] text-[#19a658]"
            :class="{ 'ring-2 ring-[#19a658]/30': selectedAchievement === 'series' }"
            type="button"
            aria-label="Нысана жетістігі"
            @click="selectedAchievement = 'series'"
          >
            <Target :size="20" />
          </button>
        </div>
      </div>
    </div>

    <BottomNav active="profile" />
  </section>
</template>
