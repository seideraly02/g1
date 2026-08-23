<script setup lang="ts">
import {
  Award,
  Check,
  ChevronRight,
  Flame,
  History,
  Info,
  PauseCircle,
  Snowflake,
} from 'lucide-vue-next'
import { ref } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import BottomNav from '../components/BottomNav.vue'
import SampleDataNotice from '../components/SampleDataNotice.vue'

type DetailKey = 'history' | 'pause'

const showInfo = ref(false)
const selectedDay = ref(4)
const openDetail = ref<DetailKey | null>(null)

const week = [
  { label: 'Дс', type: 'done', value: '1' },
  { label: 'Сс', type: 'done', value: '2' },
  { label: 'Ср', type: 'freeze', value: '3' },
  { label: 'Бс', type: 'done', value: '4' },
  { label: 'Жм', type: 'done', value: '5' },
  { label: 'Сб', type: 'future', value: '6' },
  { label: 'Жс', type: 'future', value: '7' },
]

function toggleDetail(key: DetailKey) {
  openDetail.value = openDetail.value === key ? null : key
}
</script>

<template>
  <section class="screen-page bg-[#f8f8f8]">
    <AppHeader title="Сабақтар сериясы" back>
      <template #actions>
        <button
          class="icon-button"
          type="button"
          aria-label="Серия туралы"
          :aria-expanded="showInfo"
          @click="showInfo = !showInfo"
        >
          <Info :size="20" />
        </button>
      </template>
    </AppHeader>

    <div class="screen-content space-y-3 pt-3">
      <SampleDataNotice />
      <div
        v-if="showInfo"
        class="rounded-xl border border-[#b9dcff] bg-[#eff6ff] px-3 py-2 text-[11px] leading-5 text-[#34516f]"
      >
        Күн сайын кемінде бір жаттығу орындасаңыз, серияңыз жалғасады.
      </div>

      <div
        class="rounded-b-[30px] rounded-t-[20px] border border-[#1f66d9] bg-[#1f66d9] p-5 text-white shadow-[0_12px_28px_rgba(31,102,217,.18)]"
      >
        <div class="text-[11px] font-[850] tracking-[.08em] text-white">АҒЫМДАҒЫ СЕРИЯ</div>
        <div class="mt-2 flex items-center">
          <Flame :size="29" :stroke-width="2" />
          <span class="metric-value ml-2 text-[44px] font-[900] leading-none text-white">8</span>
          <span class="ml-2 text-[16px] font-[850]">күн қатарынан</span>
          <Award class="ml-auto text-white" :size="26" />
        </div>
        <div class="mt-3 text-[12px] leading-5 text-white">
          Шағын жаттығу ырғақты сақтауға көмектеседі.
        </div>
      </div>

      <div class="card p-4">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-[14px] font-[850]">Осы апта</h2>
          <span
            class="inline-flex items-center gap-2 rounded-full border border-[#b7d9ff] bg-[#eff6ff] px-3 py-1.5 text-[11px] font-[800] text-[#235ec9]"
          >
            <Snowflake :size="18" />
            2 мұздатудың 1-еуі
          </span>
        </div>
        <div class="mt-4 grid grid-cols-7 gap-1.5">
          <button
            v-for="(day, index) in week"
            :key="day.label"
            class="flex flex-col items-center gap-1.5 border-0 bg-transparent p-0"
            type="button"
            :aria-label="`${day.label}, ${day.value}`"
            :aria-pressed="selectedDay === index"
            @click="selectedDay = index"
          >
            <span class="text-[9px] font-[800] text-[#536178]">{{ day.label }}</span>
            <span
              class="grid size-[38px] place-items-center rounded-[12px] border"
              :class="[
                day.type === 'done' && 'border-[#ffbf69] bg-[#fff8ef] text-[#bd3f0a]',
                day.type === 'freeze' && 'border-[#8fc7ff] bg-[#eef6ff] text-[#2869df]',
                day.type === 'future' && 'border-[#dce4ef] bg-white text-[#98a6b9]',
                selectedDay === index && 'ring-2 ring-[#2869df]/30',
              ]"
            >
              <Check v-if="day.type === 'done'" :size="18" :stroke-width="2.8" />
              <Snowflake v-else-if="day.type === 'freeze'" :size="20" />
              <span v-else class="metric-value text-[14px]">{{ day.value }}</span>
            </span>
          </button>
        </div>
      </div>

      <div class="flex items-center gap-3 rounded-[20px] border border-[#b9dcff] bg-[#eff6ff] p-4">
        <Snowflake class="shrink-0 text-[#2869df]" :size="25" />
        <div>
          <div class="text-[12px] font-[850]">Бүгін демалуға болады — серия қорғалған</div>
          <div class="mt-1 text-[11px] leading-4 text-[#536178]">
            Бір күн өткізіп алсаңыз, мұздату автоматты түрде қолданылады.
          </div>
        </div>
      </div>

      <div class="card p-3.5">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-[13px] font-[850]">Келесі марапат</h2>
            <div class="mt-1 text-[11px] text-[#536178]">10 күн · «Тұрақты ырғақ» белгісі</div>
          </div>
          <div class="grid size-10 place-items-center rounded-xl bg-[#edf4ff] text-[#1f66d9]">
            <Award :size="21" />
          </div>
        </div>
        <div class="mt-2.5 h-2 overflow-hidden rounded-full bg-[#dfe6ef]">
          <div class="h-full w-[80%] rounded-full bg-[#1f66d9]" />
        </div>
      </div>

      <div class="card overflow-hidden">
        <button
          class="flex w-full items-center gap-3 border-0 bg-white p-3 text-left"
          type="button"
          :aria-expanded="openDetail === 'history'"
          @click="toggleDetail('history')"
        >
          <span class="grid size-10 place-items-center rounded-xl bg-[#eef5ff] text-[#2869df]">
            <History :size="21" />
          </span>
          <span class="min-w-0 flex-1">
            <strong class="block text-[13px]">Мұздату тарихы</strong>
            <span class="block text-[10px] text-[#536178]">Осы аптада 1 рет пайдаланылды</span>
          </span>
          <ChevronRight
            class="text-[#98a6b9] transition-transform"
            :class="{ 'rotate-90': openDetail === 'history' }"
            :size="20"
          />
        </button>
        <div
          v-if="openDetail === 'history'"
          class="border-t border-[#e6ebf2] px-4 py-2 text-[10px] text-[#536178]"
        >
          Сәрсенбі, 24 шілде · автоматты мұздату
        </div>
        <button
          class="flex w-full items-center gap-3 border-t border-[#e6ebf2] bg-white p-3 text-left"
          type="button"
          :aria-expanded="openDetail === 'pause'"
          @click="toggleDetail('pause')"
        >
          <span class="grid size-10 place-items-center rounded-xl bg-[#ecfbf3] text-[#19a658]">
            <PauseCircle :size="21" />
          </span>
          <span class="min-w-0 flex-1">
            <strong class="block text-[13px]">Үзіліс режимі</strong>
            <span class="block text-[10px] text-[#536178]">Үзіліс кезінде лиганы сақтайды</span>
          </span>
          <ChevronRight
            class="text-[#98a6b9] transition-transform"
            :class="{ 'rotate-90': openDetail === 'pause' }"
            :size="20"
          />
        </button>
        <div
          v-if="openDetail === 'pause'"
          class="border-t border-[#e6ebf2] px-4 py-2 text-[10px] text-[#536178]"
        >
          Режимді профиль параметрлерінен қосуға болады.
        </div>
      </div>
    </div>

    <BottomNav active="profile" />
  </section>
</template>
