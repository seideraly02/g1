<script setup lang="ts">
import { Clock3, Target, TrendingUp } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BottomNav from '../components/BottomNav.vue'
import MiniLineChart from '../components/MiniLineChart.vue'
import SampleDataNotice from '../components/SampleDataNotice.vue'

const router = useRouter()
const period = ref<7 | 30>(7)
const selectedDay = ref(6)

const summary = computed(() =>
  period.value === 7
    ? {
        forecast: '75–85',
        gain: '+4 балл',
        note: 'Соңғы 7 күнде дәлдік 6%-ға өсті.',
        accuracy: '74% → 80%',
        points: '3,37 27,31 51,33 75,20 99,23 123,12 147,7',
      }
    : {
        forecast: '78–88',
        gain: '+7 балл',
        note: 'Соңғы 30 күнде дәлдік 11%-ға өсті.',
        accuracy: '69% → 80%',
        points: '3,39 27,37 51,31 75,29 99,19 123,16 147,7',
      },
)

const subjects = [
  { name: 'Информатика', value: 82, color: 'bg-[#168653]' },
  { name: 'Математика', value: 76, color: 'bg-[#1f66d9]' },
  { name: 'Тарих', value: 63, color: 'bg-[#1f66d9]' },
]

const days = [
  { label: 'Дс', done: true },
  { label: 'Сс', done: true },
  { label: 'Ср', done: true },
  { label: 'Бс', done: false },
  { label: 'Жм', done: true },
  { label: 'Сб', done: true },
  { label: 'Жс', done: false },
]
</script>

<template>
  <section class="screen-page min-h-[844px] bg-[#f8f8f8]">
    <div class="safe-top flex items-center justify-between px-4 pb-2 pt-4">
      <h1 class="page-title text-[22px]">Ілгерілеу</h1>
      <div class="flex rounded-[14px] bg-[#dfe6f0] p-1" role="group" aria-label="Кезеңді таңдау">
        <button
          v-for="value in [7, 30] as const"
          :key="value"
          class="h-9 rounded-[11px] border-0 px-3 text-[12px] font-[800] transition-colors"
          :class="
            period === value ? 'bg-white text-[#111b34] shadow-sm' : 'bg-transparent text-[#536178]'
          "
          type="button"
          :aria-pressed="period === value"
          @click="period = value"
        >
          {{ value }} күн
        </button>
      </div>
    </div>

    <div class="screen-content space-y-2.5 pt-2">
      <SampleDataNotice />
      <button
        class="card block w-full p-3 text-left transition-transform active:scale-[.995]"
        type="button"
        @click="router.push({ name: 'forecast' })"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="text-[11px] font-[850] tracking-[.08em] text-[#1f66d9]">БОЛЖАМ</div>
            <div class="metric-value mt-1 text-[27px] font-[900] tracking-[-.03em]">
              {{ summary.forecast }}
            </div>
          </div>
          <div
            class="flex items-center gap-2 rounded-xl bg-[#dcf8e7] px-3 py-2 text-[11px] font-[850] text-[#15894a]"
          >
            <TrendingUp :size="20" />
            {{ summary.gain }}
          </div>
        </div>
        <div class="mt-1.5 text-[11px] text-[#536178]">{{ summary.note }}</div>
      </button>

      <div class="card p-3">
        <div class="flex items-center justify-between">
          <h2 class="text-[14px] font-[850]">Дәлдік динамикасы</h2>
          <span class="metric-value text-[12px] text-[#536178]">{{ summary.accuracy }}</span>
        </div>
        <div class="mt-1 h-[64px]">
          <MiniLineChart :points="summary.points" />
        </div>
      </div>

      <div class="card p-3">
        <div class="mb-2 flex items-center justify-between">
          <h2 class="text-[14px] font-[850]">Пәндер бойынша дәлдік</h2>
          <span class="text-[10px] text-[#536178]">барлық талпыныс</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="subject in subjects"
            :key="subject.name"
            class="grid grid-cols-[72px_1fr_34px] items-center gap-2"
          >
            <span class="text-[11px]">{{ subject.name }}</span>
            <div class="h-2 overflow-hidden rounded-full bg-[#dfe6ef]">
              <div
                class="h-full rounded-full"
                :class="subject.color"
                :style="{ width: `${subject.value}%` }"
              />
            </div>
            <span class="metric-value text-right text-[11px] font-[850]">{{ subject.value }}%</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div class="card p-3">
          <div class="grid size-10 place-items-center rounded-xl bg-[#edf4ff] text-[#1f66d9]">
            <Clock3 :size="20" />
          </div>
          <div class="metric-value mt-2 text-[21px] font-[900]">38 сек.</div>
          <div class="mt-1 text-[10px] leading-5 text-[#536178]">
            орташа жауап · 4 сек. жылдамырақ
          </div>
        </div>
        <button
          class="card p-3 text-left transition-transform active:scale-[.99]"
          type="button"
          @click="router.push({ name: 'streak' })"
        >
          <div class="grid size-10 place-items-center rounded-xl bg-[#ecfbf3] text-[#19a658]">
            <Target :size="21" />
          </div>
          <div class="metric-value mt-2 text-[21px] font-[900]">6/7 күн</div>
          <div class="mt-1 text-[10px] leading-5 text-[#536178]">күнделікті мақсат орындалды</div>
        </button>
      </div>

      <div class="card p-3">
        <div class="flex items-center justify-between">
          <h2 class="text-[14px] font-[850]">Белсенділік</h2>
          <span class="text-[10px] uppercase text-[#536178]">шілде</span>
        </div>
        <div class="mt-2 grid grid-cols-7 gap-1.5">
          <button
            v-for="(day, index) in days"
            :key="day.label"
            class="grid h-10 place-items-center rounded-[10px] border text-[10px] font-[800]"
            :class="
              selectedDay === index
                ? 'border-2 border-[#1f66d9] bg-white text-[#1f66d9]'
                : day.done
                  ? 'border-[#d7e8ff] bg-[#deecff] text-[#215bc4]'
                  : 'border-transparent bg-[#f1f4f8] text-[#536178]'
            "
            type="button"
            :aria-pressed="selectedDay === index"
            @click="selectedDay = index"
          >
            {{ day.label }}
          </button>
        </div>
      </div>
    </div>

    <BottomNav active="progress" />
  </section>
</template>
