<script setup lang="ts">
import { ArrowUpRight, Info, Landmark, ShieldCheck, Sparkles, TrendingUp } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import BottomNav from '../components/BottomNav.vue'
import MiniLineChart from '../components/MiniLineChart.vue'

const router = useRouter()
const showDetails = ref(false)
</script>

<template>
  <section class="screen-page bg-[#f8faff]">
    <AppHeader title="ҰБТ болжамы" back>
      <template #actions>
        <button
          type="button"
          class="icon-button"
          aria-label="Болжам туралы"
          :aria-expanded="showDetails"
          @click="showDetails = !showDetails"
        >
          <Info :size="20" />
        </button>
      </template>
    </AppHeader>

    <div class="screen-content px-4 pt-1">
      <article class="rounded-[22px] border border-[#d9d2ff] bg-[linear-gradient(145deg,#f5f3ff,#f1edff)] p-[18px]">
        <div class="flex items-start justify-between gap-3">
          <p class="eyebrow mt-1">АҒЫМДАҒЫ АРАЛЫҚ</p>
          <span class="chip chip--green h-8 border-0 px-3">
            <TrendingUp :size="16" />
            Аптасына +4
          </span>
        </div>

        <p class="metric-value mb-0 mt-3 text-[35px] font-[850] leading-none tracking-[-0.04em]">75–85 балл</p>

        <div class="mt-4 flex items-center gap-2 text-[11px] font-[750] text-[#7946df]">
          <ShieldCheck :size="18" />
          Орташа сенімділік
        </div>
        <div class="progress-track mt-2.5">
          <div class="h-full w-[68%] rounded-full bg-[linear-gradient(90deg,#7447e7,#a47cf9)]" />
        </div>
        <div class="mt-2 flex justify-between text-[10px] text-[#6e788d]">
          <span>Жауаптар: 128</span>
          <span>Деректердің 68%-ы жиналды</span>
        </div>
      </article>

      <article class="card mt-3 p-4">
        <div class="flex items-center justify-between">
          <h2 class="m-0 text-[13px] font-[800]">7 күндегі динамика</h2>
          <span class="chip chip--blue border-0 px-2.5">+6%</span>
        </div>

        <div class="relative mt-2 h-[86px] overflow-hidden">
          <span class="absolute inset-x-1 top-[19px] border-t border-[#e7ebf1]" />
          <span class="absolute inset-x-1 top-[45px] border-t border-[#e7ebf1]" />
          <span class="absolute inset-x-1 top-[71px] border-t border-[#e7ebf1]" />
          <MiniLineChart class="relative z-10" fill />
        </div>

        <p class="mb-0 mt-2 text-[10px] leading-[1.45] text-[#68758a]">
          Әлсіз тақырыптар бойынша жаттығулардан кейін дәлдік тұрақты өсіп келеді.
        </p>
      </article>

      <article class="card mt-3 overflow-hidden px-3">
        <button
          type="button"
          class="flex w-full items-center gap-3 border-0 border-b border-[#edf0f5] bg-transparent px-0 py-3 text-left"
          @click="router.push({ name: 'subjects' })"
        >
          <span class="grid size-10 shrink-0 place-items-center rounded-[12px] bg-[#f1edff] text-[#7a4bea]">
            <ArrowUpRight :size="20" />
          </span>
          <span class="min-w-0 flex-1">
            <strong class="block text-[13px]">Математика</strong>
            <span class="mt-1 block text-[10px] text-[#69758a]">Болжамға қатты әсер етеді</span>
          </span>
          <span class="chip chip--green border-0 px-2.5">+5</span>
        </button>

        <button
          type="button"
          class="flex w-full items-center gap-3 border-0 bg-transparent px-0 py-3 text-left"
          @click="router.push({ name: 'history-subject' })"
        >
          <span class="grid size-10 shrink-0 place-items-center rounded-[12px] bg-[#fff8e7] text-[#dd8508]">
            <Landmark :size="20" />
          </span>
          <span class="min-w-0 flex-1">
            <strong class="block text-[13px]">Қазақстан тарихы</strong>
            <span class="mt-1 block text-[10px] text-[#69758a]">XX ғасыр бойынша жауап аз</span>
          </span>
          <span class="chip chip--orange border-0 px-2.5">Тексеру</span>
        </button>
      </article>

      <button
        type="button"
        class="soft-card mt-3 flex w-full items-center gap-3 border-[#bcd7ff] px-4 py-3 text-left"
        @click="router.push({ name: 'training' })"
      >
        <Sparkles :size="22" class="shrink-0 text-[#1f63e9]" />
        <span class="text-[12px] leading-[1.35]">
          <strong>Болжам дәлірек болады</strong><br />
          <span class="text-[#657187]">тағы 20 сұрақтан кейін.</span>
        </span>
      </button>

      <div
        v-if="showDetails"
        class="mt-2 rounded-xl bg-[#111b34] px-3 py-2 text-[10px] leading-relaxed text-white shadow-lg"
        role="status"
      >
        Болжам жауап санына, дәлдікке және пәндер бойынша тұрақтылыққа сүйенеді.
      </div>
    </div>

    <BottomNav active="progress" />
  </section>
</template>
