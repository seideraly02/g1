<script setup lang="ts">
import { Check, Ellipsis, Landmark, Play, RotateCcw, TrendingUp } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import BottomNav from '../components/BottomNav.vue'

interface Topic {
  name: string
  detail: string
  progress: number
  status: string
  tone: 'green' | 'orange' | 'blue'
}

const router = useRouter()
const showMenu = ref(false)
const showAll = ref(false)

const topics: Topic[] = [
  {
    name: 'Қазақ хандығы',
    detail: 'Дәлдік 84% · 6 күннен кейін қайталау',
    progress: 84,
    status: 'Меңгерілді',
    tone: 'green',
  },
  {
    name: 'XX ғасырдағы Қазақстан',
    detail: 'Дәлдік 52% · 4 белсенді қате',
    progress: 52,
    status: 'Бүгін қайталау',
    tone: 'orange',
  },
  {
    name: 'Тәуелсіз Қазақстан',
    detail: 'Дәлдік 68% · 12 сұрақтың 7-сі',
    progress: 58,
    status: 'Орындалуда',
    tone: 'blue',
  },
  {
    name: 'Қазақстанның ежелгі тарихы',
    detail: 'Дәлдік 74% · 3 күннен кейін қайталау',
    progress: 74,
    status: 'Орындалуда',
    tone: 'blue',
  },
]

const visibleTopics = computed(() => (showAll.value ? topics : topics.slice(0, 3)))

function startTraining() {
  void router.push({ name: 'training' })
}
</script>

<template>
  <section class="screen-page bg-[#f8faff]">
    <AppHeader title="Қазақстан тарихы" back>
      <template #actions>
        <button
          type="button"
          class="icon-button"
          aria-label="Қосымша әрекеттер"
          :aria-expanded="showMenu"
          @click="showMenu = !showMenu"
        >
          <Ellipsis :size="21" />
        </button>
      </template>
    </AppHeader>

    <div class="screen-content px-4 pt-1">
      <div v-if="showMenu" class="relative z-10">
        <div class="absolute right-0 top-0 w-40 rounded-xl border border-[#e0e7f0] bg-white p-1.5 text-[11px] shadow-lg">
          <button
            type="button"
            class="w-full rounded-lg border-0 bg-transparent px-3 py-2 text-left font-[700] hover:bg-[#f4f7fb]"
            @click="router.push({ name: 'mistakes' }); showMenu = false"
          >
            Қателерді ашу
          </button>
          <button
            type="button"
            class="w-full rounded-lg border-0 bg-transparent px-3 py-2 text-left font-[700] hover:bg-[#f4f7fb]"
            @click="showAll = true; showMenu = false"
          >
            Барлық тақырып
          </button>
        </div>
      </div>

      <article class="rounded-[20px] border border-[#b9d4ff] bg-[#edf5ff] p-4">
        <div class="flex items-start gap-3">
          <span class="grid size-12 shrink-0 place-items-center rounded-[14px] bg-white/75 text-[#2468f2]">
            <Landmark :size="24" />
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="metric-value m-0 text-[22px] font-[850] leading-none">48%</p>
                <p class="mb-0 mt-1 text-[10px] text-[#66738a]">Жалпы ілгерілеу</p>
              </div>
              <span class="chip chip--blue h-7 border-0 px-2.5">Аптасына +4%</span>
            </div>
            <div class="progress-track mt-2.5 bg-[#dce5f0]">
              <div class="progress-value w-[48%]" />
            </div>
          </div>
        </div>

        <div class="mt-3 grid grid-cols-3 gap-2">
          <div class="rounded-[14px] border border-[#d8e1ed] bg-white px-2 py-3 text-center">
            <strong class="metric-value block text-[18px]">63%</strong>
            <span class="mt-1 block text-[9px] text-[#66738a]">дәлдік</span>
          </div>
          <div class="rounded-[14px] border border-[#d8e1ed] bg-white px-2 py-3 text-center">
            <strong class="metric-value block text-[18px]">12–16</strong>
            <span class="mt-1 block text-[9px] text-[#66738a]">болжамды балл</span>
          </div>
          <div class="rounded-[14px] border border-[#d8e1ed] bg-white px-2 py-3 text-center">
            <strong class="metric-value block text-[18px]">3</strong>
            <span class="mt-1 block text-[9px] text-[#66738a]">әлсіз тақырып</span>
          </div>
        </div>
      </article>

      <button type="button" class="primary-button mt-3 h-12 rounded-[14px]" @click="startTraining">
        Бүгінгі жаттығуды бастау
        <Play :size="19" fill="currentColor" />
      </button>

      <div class="mt-3 grid grid-cols-2 gap-2.5">
        <button type="button" class="secondary-button h-11" @click="startTraining">
          Жалғастыру
        </button>
        <button
          type="button"
          class="secondary-button h-11"
          @click="router.push({ name: 'mistakes' })"
        >
          Қателерді талдау
        </button>
      </div>

      <div class="mt-3 flex items-center justify-between">
        <h2 class="m-0 text-[14px] font-[800]">Тақырыптар</h2>
        <button type="button" class="text-button min-h-7 px-0" @click="showAll = !showAll">
          {{ showAll ? 'Жинау' : 'Барлығы 18' }}
        </button>
      </div>

      <div class="mt-2 space-y-2.5">
        <button
          v-for="topic in visibleTopics"
          :key="topic.name"
          type="button"
          class="card w-full p-3 text-left transition-colors hover:bg-[#fbfcff]"
          @click="startTraining"
        >
          <span class="flex items-start justify-between gap-2">
            <strong class="pt-1 text-[12px]">{{ topic.name }}</strong>
            <span
              class="chip shrink-0 border-0 px-2.5"
              :class="{
                'chip--green': topic.tone === 'green',
                'chip--orange': topic.tone === 'orange',
                'chip--blue': topic.tone === 'blue',
              }"
            >
              <Check v-if="topic.tone === 'green'" :size="14" />
              <RotateCcw v-else-if="topic.tone === 'orange'" :size="13" />
              <TrendingUp v-else :size="13" />
              {{ topic.status }}
            </span>
          </span>
          <span class="mt-1.5 block text-[9px] text-[#66738a]">{{ topic.detail }}</span>
          <span class="progress-track mt-2 block">
            <span
              class="block h-full rounded-full"
              :class="{
                'bg-[linear-gradient(90deg,#10a653,#42db82)]': topic.tone === 'green',
                'bg-[linear-gradient(90deg,#dc8105,#ffc32a)]': topic.tone === 'orange',
                'bg-[linear-gradient(90deg,#2468f2,#64a4fb)]': topic.tone === 'blue',
              }"
              :style="{ width: `${topic.progress}%` }"
            />
          </span>
        </button>
      </div>
    </div>
    <BottomNav active="subjects" />
  </section>
</template>
