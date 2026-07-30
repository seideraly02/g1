<script setup lang="ts">
import { ArrowRight, BatteryMedium, CircleUserRound, Wifi } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BrandMark from '../components/BrandMark.vue'

const router = useRouter()
const selectedSubject = ref<'history' | 'math'>('history')

function start() {
  router.push({
    name: 'subjects-onboarding',
    query: { subject: selectedSubject.value },
  })
}
</script>

<template>
  <section class="screen-page flex min-h-[844px] flex-col overflow-hidden bg-white px-4 pb-4">
    <div
      class="pointer-events-none absolute -right-20 -top-20 size-[255px] rounded-full bg-[#f0eaff]"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -bottom-10 -left-24 size-[198px] rounded-full bg-[#eaf0ff]"
      aria-hidden="true"
    />

    <div
      class="relative z-10 flex h-[42px] shrink-0 items-center justify-between px-1 pt-1 text-[#111b34]"
    >
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

    <div class="relative z-10 mt-1 flex items-center">
      <BrandMark />
    </div>

    <div
      class="relative z-10 mt-[15px] h-[186px] shrink-0 overflow-hidden rounded-[27px] border border-[#d3e7ff] bg-[#eaf4ff]"
      aria-hidden="true"
    >
      <svg class="h-full w-full" viewBox="0 0 358 186" fill="none">
        <defs>
          <filter
            id="book-shadow"
            x="76"
            y="32"
            width="226"
            height="132"
            filterUnits="userSpaceOnUse"
          >
            <feDropShadow
              dx="0"
              dy="7"
              stdDeviation="7"
              flood-color="#8fb7e5"
              flood-opacity=".25"
            />
          </filter>
          <linearGradient
            id="blue-dot"
            x1="27"
            y1="110"
            x2="89"
            y2="172"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#75B6F5" />
            <stop offset="1" stop-color="#57A2EF" />
          </linearGradient>
          <linearGradient
            id="violet-dot"
            x1="248"
            y1="27"
            x2="322"
            y2="104"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#C7A6FF" />
            <stop offset="1" stop-color="#A67AF6" />
          </linearGradient>
        </defs>
        <circle cx="282" cy="66" r="44" fill="url(#violet-dot)" opacity=".84" />
        <circle cx="64" cy="135" r="29" fill="url(#blue-dot)" opacity=".9" />
        <g filter="url(#book-shadow)">
          <path
            d="M91 59.5C91 50.94 97.94 44 106.5 44H177C183.63 44 189 49.37 189 56V147.5C189 151.09 186.09 154 182.5 154H111C99.95 154 91 145.05 91 134V59.5Z"
            fill="white"
            stroke="#BBDDFD"
          />
          <path
            d="M189 56C189 49.37 194.37 44 201 44H271.5C280.06 44 287 50.94 287 59.5V134C287 145.05 278.05 154 267 154H195.5C191.91 154 189 151.09 189 147.5V56Z"
            fill="white"
            stroke="#BBDDFD"
          />
          <path d="M114 83H164" stroke="#CAD5E3" stroke-width="5" stroke-linecap="round" />
          <path d="M114 100H176" stroke="#CAD5E3" stroke-width="5" stroke-linecap="round" />
          <path d="M215 83H265" stroke="#CAD5E3" stroke-width="5" stroke-linecap="round" />
          <path d="M204 100H266" stroke="#CAD5E3" stroke-width="5" stroke-linecap="round" />
        </g>
        <g fill="#7B3FF2">
          <path d="M64 37 66 44 73 46 66 48 64 55 62 48 55 46 62 44 64 37Z" />
          <path
            d="M58 52 59.2 56.2 63.5 57.5 59.2 58.8 58 63 56.8 58.8 52.5 57.5 56.8 56.2 58 52Z"
          />
          <path d="M72 48 73 51.5 76.5 52.5 73 53.5 72 57 71 53.5 67.5 52.5 71 51.5 72 48Z" />
        </g>
        <circle cx="279" cy="145" r="10" stroke="#7B3FF2" stroke-width="2" />
        <circle cx="279" cy="145" r="5.5" stroke="#7B3FF2" stroke-width="2" />
        <circle cx="279" cy="145" r="2" fill="#7B3FF2" />
      </svg>
    </div>

    <div class="relative z-10 mt-[17px]">
      <p class="m-0 text-[12px] font-[850] uppercase tracking-[.04em] text-[#2468f2]">
        Жылдам диагностика
      </p>
      <h1
        class="mt-2 max-w-[350px] text-[26px] font-[900] leading-[1.16] tracking-[-.025em] text-[#0d1730]"
      >
        5 сұрақ арқылы деңгейіңді тексер
      </h1>
      <p class="mt-2 text-[15px] leading-[1.42] text-[#536178]">
        Тіркелудің қажеті жоқ — нәтижені бірден көресің
      </p>
    </div>

    <div class="relative z-10 mt-4">
      <p class="text-[13px] font-[800] text-[#111b34]">Неден бастаймыз?</p>
      <div class="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          class="min-h-[35px] rounded-full border px-4 text-[13px] font-[750] transition-colors"
          :class="
            selectedSubject === 'history'
              ? 'border-[#111b34] bg-[#111b34] text-white'
              : 'border-[#dbe2ec] bg-white text-[#536178]'
          "
          @click="selectedSubject = 'history'"
        >
          Қазақстан тарихы
        </button>
        <button
          type="button"
          class="min-h-[35px] rounded-full border px-4 text-[13px] font-[750] transition-colors"
          :class="
            selectedSubject === 'math'
              ? 'border-[#111b34] bg-[#111b34] text-white'
              : 'border-[#dbe2ec] bg-white text-[#536178]'
          "
          @click="selectedSubject = 'math'"
        >
          Математика
        </button>
      </div>
    </div>

    <div class="relative z-10 mt-auto space-y-2 pt-5">
      <button
        class="primary-button min-h-[52px] rounded-[16px] text-[16px]"
        type="button"
        @click="start"
      >
        Тіркелмей бастау
        <ArrowRight :size="20" :stroke-width="2" aria-hidden="true" />
      </button>
      <button
        class="secondary-button min-h-[52px] rounded-[16px] border-[#8cc6ff] text-[15px]"
        type="button"
        @click="start"
      >
        <CircleUserRound :size="18" :stroke-width="2" aria-hidden="true" />
        Google арқылы кіру
      </button>
    </div>
  </section>
</template>
