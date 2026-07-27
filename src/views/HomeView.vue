<script setup lang="ts">
import {
  ArrowRight,
  Bell,
  Clock3,
  Code2,
  Flame,
  Gauge,
  Landmark,
  RotateCcw,
  Trophy,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import BottomNav from '../components/BottomNav.vue'
import type { AppRouteName } from '../router'

const router = useRouter()

function open(route: AppRouteName) {
  void router.push({ name: route })
}
</script>

<template>
  <section class="screen-page bg-[#f8faff]">
    <div class="screen-content px-4 pt-4">
      <header class="flex items-center gap-3">
        <button
          type="button"
          class="grid size-11 shrink-0 place-items-center rounded-[14px] border-0 bg-[linear-gradient(145deg,#c7ddff,#b8a4fb)] text-[18px] font-[800] text-[#245fd8] transition-transform active:scale-95"
          aria-label="Профильді ашу"
          @click="open('profile')"
        >
          С
        </button>

        <button
          type="button"
          class="min-w-0 flex-1 border-0 bg-transparent p-0 text-left"
          @click="open('profile')"
        >
          <span class="block text-[11px] font-[500] text-[#6f7a90]">Қайырлы таң</span>
          <span class="block truncate text-[18px] font-[800] tracking-[-0.02em]">Сәлем, Саят!</span>
        </button>

        <button
          type="button"
          class="flex h-10 items-center gap-1.5 rounded-full border border-[#f7d775] bg-[#fffaf0] px-3 text-[#b76605] transition-colors hover:bg-[#fff4d8]"
          aria-label="8 күндік серия"
          @click="open('streak')"
        >
          <Flame :size="18" :stroke-width="2.2" />
          <span class="text-[12px] font-[800]">8</span>
        </button>

        <button
          type="button"
          class="relative grid size-10 place-items-center rounded-[12px] border border-[#e3e9f2] bg-white text-[#111b34] transition-colors hover:bg-[#f5f8fd]"
          aria-label="Хабарландыруларды ашу"
          @click="open('notifications')"
        >
          <Bell :size="19" :stroke-width="2" />
          <span class="absolute right-[9px] top-[8px] size-1.5 rounded-full bg-[#ef4444]" />
        </button>
      </header>

      <div class="mt-3 flex items-center justify-between">
        <p class="m-0 text-[12px] font-[800]">
          ҰБТ-ға дейін:
          <span class="font-[500] text-[#637086]">329 күн</span>
        </p>
        <button
          type="button"
          class="rounded-full border-0 bg-[#f1e9ff] px-3 py-1 text-[10px] font-[800] text-[#7841d9]"
          @click="open('rating')"
        >
          Лига: Зерде
        </button>
      </div>

      <article
        class="mt-3 overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#1556dd_0%,#344ee3_54%,#593ee7_100%)] p-[18px] text-white shadow-[0_14px_28px_rgba(45,74,218,.22)]"
      >
        <div class="flex items-center justify-between">
          <p class="m-0 text-[11px] font-[800] tracking-[0.08em] text-[#bcd2ff]">
            БҮГІНГІ ЖОСПАР
          </p>
          <span class="rounded-lg bg-white/15 px-2.5 py-1 text-[10px] font-[800]">8 / 20</span>
        </div>

        <h2 class="mb-0 mt-5 text-[22px] font-[800] leading-[1.25] tracking-[-0.025em]">
          «Дүниежүзі тарихы» бөліміндегі әлсіз тақырыптар бойынша 20 сұрақ
        </h2>
        <p class="mb-0 mt-4 text-[11px] leading-[1.45] text-[#d9e4ff]">
          Соңғы жаттығулардағы қателер мен алдағы қайталауға сүйеніп құрастырылды.
        </p>

        <div class="mt-3 h-2 overflow-hidden rounded-full bg-white/20" aria-label="Жоспардың 40 пайызы орындалды">
          <div class="h-full w-2/5 rounded-full bg-white" />
        </div>

        <div class="mt-3 flex items-center justify-between text-[11px] text-[#dce7ff]">
          <span class="inline-flex items-center gap-1.5">
            <Clock3 :size="16" />
            Шамамен 7 минут қалды
          </span>
          <span class="font-[700]">40%</span>
        </div>

        <button
          type="button"
          class="mt-4 flex h-11 w-full items-center justify-center gap-3 rounded-[14px] border-0 bg-white text-[14px] font-[800] text-[#285add] transition-transform active:scale-[.99]"
          @click="open('training')"
        >
          Жалғастыру
          <ArrowRight :size="19" />
        </button>
      </article>

      <div class="-mx-4 mt-3 flex gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          class="card flex min-h-[82px] min-w-[143px] items-center gap-3 p-3 text-left transition-colors hover:bg-[#f8faff]"
          @click="open('forecast')"
        >
          <span class="grid size-10 shrink-0 place-items-center rounded-[12px] bg-[#f1edff] text-[#7959ed]">
            <Gauge :size="21" />
          </span>
          <span>
            <span class="block text-[10px] text-[#68758a]">Болжам</span>
            <strong class="mt-1 block text-[15px] leading-tight">75–85<br />балл</strong>
          </span>
        </button>

        <button
          type="button"
          class="card flex min-h-[82px] min-w-[143px] items-center gap-3 p-3 text-left transition-colors hover:bg-[#f8faff]"
          @click="open('mistakes')"
        >
          <span class="grid size-10 shrink-0 place-items-center rounded-[12px] bg-[#fff7e6] text-[#dd8507]">
            <RotateCcw :size="21" />
          </span>
          <span>
            <span class="block text-[10px] text-[#68758a]">Қайталау</span>
            <strong class="mt-1 block text-[15px] leading-tight">12<br />сұрақ</strong>
          </span>
        </button>

        <button
          type="button"
          class="card flex min-h-[82px] min-w-[143px] items-center gap-3 p-3 text-left transition-colors hover:bg-[#f8faff]"
          @click="open('rating')"
        >
          <span class="grid size-10 shrink-0 place-items-center rounded-[12px] bg-[#ecfbf3] text-[#18a75a]">
            <Trophy :size="21" />
          </span>
          <span>
            <span class="block text-[10px] text-[#68758a]">Лига</span>
            <strong class="mt-1 block text-[15px] leading-tight">6-орын</strong>
          </span>
        </button>
      </div>

      <div class="mt-3 flex items-center justify-between">
        <h2 class="m-0 text-[14px] font-[800]">Бейіндік пәндер</h2>
        <button type="button" class="text-button min-h-7 px-0" @click="open('subjects')">Барлығы</button>
      </div>

      <div class="mt-2 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          class="card flex min-h-[66px] items-center gap-3 p-3 text-left transition-colors hover:bg-[#faf8ff]"
          @click="open('subjects')"
        >
          <span class="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[#f1edff] text-[#7a4bec]">
            <Landmark :size="18" />
          </span>
          <span class="min-w-0">
            <strong class="block truncate text-[12px]">Математика</strong>
            <span class="mt-1 block text-[9px] text-[#6f7a90]">62% меңгерілді</span>
          </span>
        </button>

        <button
          type="button"
          class="card flex min-h-[66px] items-center gap-3 p-3 text-left transition-colors hover:bg-[#f4fcf7]"
          @click="open('subjects')"
        >
          <span class="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[#ecfbf3] text-[#17a65a]">
            <Code2 :size="18" />
          </span>
          <span class="min-w-0">
            <strong class="block truncate text-[12px]">Информатика</strong>
            <span class="mt-1 block text-[9px] text-[#6f7a90]">71% меңгерілді</span>
          </span>
        </button>
      </div>
    </div>

    <BottomNav active="home" />
  </section>
</template>
