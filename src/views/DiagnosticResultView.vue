<script setup lang="ts">
import {
  BatteryMedium,
  CircleUserRound,
  RefreshCcw,
  TrendingUp,
  Wifi,
  X,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import ProgressRing from '../components/ProgressRing.vue'

const router = useRouter()
</script>

<template>
  <section class="screen-page flex min-h-[844px] flex-col bg-white px-4 pb-4">
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

    <header class="flex h-[46px] shrink-0 items-center">
      <button
        class="icon-button -ml-1"
        type="button"
        aria-label="Жабу"
        @click="router.push({ name: 'welcome' })"
      >
        <X :size="21" :stroke-width="2" />
      </button>
      <h1 class="ml-3 flex-1 text-[21px] font-[900] tracking-[-.025em] text-[#111b34]">Нәтиже</h1>
      <span class="rounded-[10px] bg-[#deebff] px-2.5 py-1 text-[11px] font-[800] text-[#2468f2]">
        Алдын ала
      </span>
    </header>

    <main class="min-h-0 flex-1 overflow-y-auto pb-3">
      <div class="mt-5 flex justify-center">
        <ProgressRing :value="80" :size="124" :stroke="16" color="#2468f2">
          <div class="text-center">
            <strong class="block text-[31px] font-[900] leading-none tracking-[-.03em] text-[#111b34]">4/5</strong>
            <span class="mt-2 block text-[11px] text-[#536178]">дұрыс</span>
          </div>
        </ProgressRing>
      </div>

      <h2 class="mt-1 text-center text-[21px] font-[900] tracking-[-.02em] text-[#111b34]">
        Тамаша бастама!
      </h2>
      <p class="mt-1 text-center text-[15px] text-[#536178]">Алдын ала дәлдік — 80%</p>

      <div class="mt-1 grid grid-cols-3 gap-2">
        <div class="rounded-[17px] border border-[#dfe5ee] bg-[#f9fafc] px-2 py-3 text-center">
          <strong class="metric-value block text-[20px] font-[900] text-[#111b34]">3:42</strong>
          <span class="mt-1 block text-[10px] leading-tight text-[#536178]">уақыт</span>
        </div>
        <div class="rounded-[17px] border border-[#dfe5ee] bg-[#f9fafc] px-2 py-3 text-center">
          <strong class="metric-value block text-[20px] font-[900] text-[#111b34]">48 сек.</strong>
          <span class="mt-1 block text-[10px] leading-tight text-[#536178]">әр сұраққа</span>
        </div>
        <div class="rounded-[17px] border border-[#dfe5ee] bg-[#f9fafc] px-2 py-3 text-center">
          <strong class="metric-value block text-[20px] font-[900] text-[#111b34]">1</strong>
          <span class="mt-1 block text-[10px] leading-tight text-[#536178]">қайталауға</span>
        </div>
      </div>

      <div class="mt-1 space-y-1">
        <div class="flex min-h-[67px] items-center rounded-[18px] border border-[#8aebb3] bg-[#effcf5] px-5">
          <TrendingUp :size="19" :stroke-width="2.2" class="shrink-0 text-[#16a757]" aria-hidden="true" />
          <div class="ml-5">
            <strong class="block text-[13px] font-[850] text-[#111b34]">Күшті тақырып</strong>
            <span class="mt-0.5 block text-[12px] text-[#536178]">Қазақ хандығы</span>
          </div>
        </div>

        <div class="flex min-h-[67px] items-center rounded-[18px] border border-[#f4db6b] bg-[#fffbed] px-5">
          <RefreshCcw :size="19" :stroke-width="2.2" class="shrink-0 text-[#d17a00]" aria-hidden="true" />
          <div class="ml-5">
            <strong class="block text-[13px] font-[850] text-[#111b34]">Тағы тексерген жөн</strong>
            <span class="mt-0.5 block text-[12px] text-[#536178]">XX ғасыр оқиғалары</span>
          </div>
        </div>
      </div>

      <p class="mt-1 rounded-[14px] bg-[#f0f3f8] px-3 py-2.5 text-[11px] leading-[1.35] text-[#536178]">
        <strong class="font-[850] text-[#111b34]">Ұсыныс:</strong>
        тағы екі қысқа жаттығудан өт — сонда болжам дәлірек болады.
      </p>

      <h3 class="mx-auto mt-1 max-w-[320px] text-center text-[15px] font-[900] leading-[1.25] text-[#111b34]">
        Нәтижені сақтап, жеке дайындық жоспарын ал
      </h3>
    </main>

    <div class="shrink-0 space-y-1.5">
      <button
        class="primary-button min-h-[52px] rounded-[16px] text-[16px]"
        type="button"
        @click="router.push({ name: 'save-progress' })"
      >
        <CircleUserRound :size="18" :stroke-width="2" aria-hidden="true" />
        Google арқылы сақтау
      </button>
      <button
        class="text-button min-h-[38px] w-full text-[14px]"
        type="button"
        @click="router.push({ name: 'personal-plan' })"
      >
        Тіркелмей жалғастыру
      </button>
    </div>
  </section>
</template>
