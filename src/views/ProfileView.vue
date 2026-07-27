<script setup lang="ts">
import {
  Accessibility,
  Bell,
  BookOpen,
  ChevronRight,
  Flame,
  Languages,
  LockKeyhole,
  Medal,
  PauseCircle,
  Settings,
  Star,
  Target,
  Trophy,
} from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import BottomNav from '../components/BottomNav.vue'
import ToggleSwitch from '../components/ToggleSwitch.vue'

const router = useRouter()
const notificationsEnabled = ref(true)
const ratingsEnabled = ref(true)
const privateProfile = ref(true)
const settingsMessage = ref('')
const selectedAchievement = ref('series')

function showSettings() {
  settingsMessage.value = settingsMessage.value ? '' : 'Профиль параметрлері ашылды'
}
</script>

<template>
  <section class="screen-page min-h-[844px] bg-[#f8faff]">
    <AppHeader title="Профиль">
      <template #actions>
        <button class="icon-button border-[#dfe6ef]" type="button" aria-label="Параметрлер" @click="showSettings">
          <Settings :size="21" />
        </button>
      </template>
    </AppHeader>

    <div class="screen-content space-y-2.5 pt-3">
      <div
        v-if="settingsMessage"
        class="rounded-xl border border-[#b9dcff] bg-[#eff6ff] px-3 py-2 text-center text-[11px] font-[700] text-[#245ebc]"
      >
        {{ settingsMessage }}
      </div>

      <div class="card flex items-center gap-3 p-4">
        <div class="grid size-[74px] shrink-0 place-items-center rounded-[24px] bg-gradient-to-br from-[#a9ccff] to-[#c2a8fb] text-[26px] font-[900] text-[#2458d0]">
          С
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="text-[20px] font-[900] leading-none">Саят</h2>
          <div class="mt-2 text-[11px] text-[#536178]">Мақсат: 105 балл · ҰБТ — 18 маусым</div>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              class="inline-flex items-center rounded-full border border-[#ddcaff] bg-[#f7f2ff] px-3 py-1.5 text-[11px] font-[850] text-[#7434dc]"
              type="button"
              @click="router.push({ name: 'rating' })"
            >
              Зерде · 6-орын
            </button>
            <button
              class="inline-flex items-center gap-1.5 rounded-full border border-[#ffe071] bg-[#fffbec] px-3 py-1.5 text-[11px] font-[850] text-[#b65a09]"
              type="button"
              @click="router.push({ name: 'streak' })"
            >
              <Flame :size="16" />
              8 күн
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2">
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

      <div class="card overflow-hidden">
        <button
          class="flex min-h-[52px] w-full items-center gap-3 border-0 bg-white px-3 text-left"
          type="button"
          @click="router.push({ name: 'subjects' })"
        >
          <span class="grid size-10 place-items-center rounded-xl bg-[#f5f0ff] text-[#8338e8]">
            <BookOpen :size="21" />
          </span>
          <strong class="flex-1 text-[13px]">Пәндер мен мақсаттар</strong>
          <ChevronRight class="text-[#98a6b9]" :size="20" />
        </button>
        <button
          class="flex min-h-[52px] w-full items-center gap-3 border-x-0 border-b-0 border-t border-[#e6ebf2] bg-white px-3 text-left"
          type="button"
          @click="settingsMessage = 'Қолданба тілі: қазақша'"
        >
          <span class="grid size-10 place-items-center rounded-xl bg-[#eef5ff] text-[#2869df]">
            <Languages :size="21" />
          </span>
          <strong class="flex-1 text-[13px]">Тіл</strong>
          <span class="text-[11px] text-[#536178]">Қазақша</span>
          <ChevronRight class="text-[#98a6b9]" :size="20" />
        </button>
        <div class="flex min-h-[52px] items-center gap-3 border-t border-[#e6ebf2] px-3">
          <button
            class="flex min-w-0 flex-1 items-center gap-3 border-0 bg-transparent p-0 text-left"
            type="button"
            @click="router.push({ name: 'notifications' })"
          >
            <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ecfbf3] text-[#19a658]">
              <Bell :size="21" />
            </span>
            <strong class="text-[13px]">Хабарландырулар</strong>
          </button>
          <ToggleSwitch v-model="notificationsEnabled" aria-label="Хабарландыруларды қосу" />
        </div>
        <button
          class="flex min-h-[52px] w-full items-center gap-3 border-x-0 border-b-0 border-t border-[#e6ebf2] bg-white px-3 text-left"
          type="button"
          @click="settingsMessage = 'Қолжетімділік параметрлері ашылды'"
        >
          <span class="grid size-10 place-items-center rounded-xl bg-[#fff9e9] text-[#d47a00]">
            <Accessibility :size="21" />
          </span>
          <strong class="flex-1 text-[13px]">Қолжетімділік</strong>
          <ChevronRight class="text-[#98a6b9]" :size="20" />
        </button>
      </div>

      <div class="card overflow-hidden">
        <div class="flex min-h-[52px] items-center gap-3 px-3">
          <span class="grid size-10 place-items-center rounded-xl bg-[#f5f0ff] text-[#8338e8]">
            <Trophy :size="21" />
          </span>
          <strong class="min-w-0 flex-1 text-[13px]">Рейтингтерге қатысу</strong>
          <ToggleSwitch v-model="ratingsEnabled" aria-label="Рейтингтерге қатысу" />
        </div>
        <div class="flex min-h-[52px] items-center gap-3 border-t border-[#e6ebf2] px-3">
          <span class="grid size-10 place-items-center rounded-xl bg-[#eef5ff] text-[#2869df]">
            <LockKeyhole :size="21" />
          </span>
          <strong class="min-w-0 flex-1 text-[13px]">Жабық профиль</strong>
          <ToggleSwitch v-model="privateProfile" aria-label="Профильді жабу" />
        </div>
        <button
          class="flex min-h-[52px] w-full items-center gap-3 border-x-0 border-b-0 border-t border-[#e6ebf2] bg-white px-3 text-left"
          type="button"
          @click="router.push({ name: 'streak' })"
        >
          <span class="grid size-10 place-items-center rounded-xl bg-[#ecfbf3] text-[#19a658]">
            <PauseCircle :size="21" />
          </span>
          <strong class="flex-1 text-[13px]">Үзіліс режимі</strong>
          <ChevronRight class="text-[#98a6b9]" :size="20" />
        </button>
      </div>

      <div class="flex items-center justify-between">
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
            class="grid size-10 place-items-center rounded-xl border-0 bg-[#f5f0ff] text-[#8338e8]"
            :class="{ 'ring-2 ring-[#8338e8]/30': selectedAchievement === 'star' }"
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
