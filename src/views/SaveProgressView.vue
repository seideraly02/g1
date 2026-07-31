<script setup lang="ts">
import { ArrowLeft, ArrowRight, BatteryMedium, Cloud, ShieldCheck, Wifi } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()

const steps = [
  ['Тіркелгі расталды', 'Телефон нөмірі расталған', true],
  ['Диагностика сақталды', '5 жауап пен жұмсалған уақыт сақталды', true],
  ['Тақырыптар синхрондалды', 'Күшті және әлсіз тақырыптар дайын', true],
  ['Ұсыныстар бапталуда', 'Тағы бір қысқа қадам қалды', false],
] as const
</script>

<template>
  <section class="screen-page flex min-h-[844px] flex-col bg-white px-4 pb-4">
    <div class="flex h-[42px] shrink-0 items-center justify-between px-1 pt-1 text-[#111b34]">
      <span class="text-[12px] font-[850]">09:41</span>
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
        aria-label="Артқа"
        @click="router.push({ name: 'diagnostic-result' })"
      >
        <ArrowLeft :size="21" :stroke-width="2" />
      </button>
      <h1 class="ml-3 text-[21px] font-[900] tracking-[-.025em] text-[#111b34]">
        Ілгерілеуді сақтау
      </h1>
    </header>

    <main class="min-h-0 flex-1 overflow-y-auto pb-3">
      <div class="mt-10 flex justify-center">
        <span
          class="grid size-[78px] place-items-center rounded-[27px] bg-[#edfbf3] text-[#16a757]"
        >
          <Cloud :size="39" :stroke-width="2.1" aria-hidden="true" />
        </span>
      </div>

      <h2 class="mt-5 text-center text-[22px] font-[900] tracking-[-.02em] text-[#111b34]">
        Нәтиже сақталды
      </h2>
      <p class="mt-1 text-center text-[15px] text-[#536178]">Сол жерден жалғастырамыз</p>

      <div class="mt-5 rounded-[19px] border border-[#dce3ec] bg-white px-5 py-4">
        <ol class="relative">
          <li
            v-for="(step, index) in steps"
            :key="step[0]"
            class="relative flex min-h-[58px] pb-3 last:min-h-0 last:pb-0"
          >
            <span
              v-if="index < steps.length - 1"
              class="absolute left-[12px] top-[25px] h-[45px] w-[2px] bg-[#e2e9f2]"
              aria-hidden="true"
            />
            <span
              class="relative z-10 mt-0.5 grid size-[26px] shrink-0 place-items-center rounded-full border-2 bg-white"
              :class="
                step[2]
                  ? 'border-[#72e5a4] text-[#16a757]'
                  : 'border-[#dceaff] text-[#2468f2] shadow-[0_0_0_4px_#e9f2ff]'
              "
              aria-hidden="true"
            >
              <span
                class="size-[15px] rounded-full"
                :class="step[2] ? 'bg-[#16a757]' : 'bg-[#2468f2]'"
              />
            </span>
            <span class="ml-3 min-w-0">
              <strong class="block text-[14px] font-[850] leading-[1.25] text-[#111b34]">{{
                step[0]
              }}</strong>
              <span class="mt-1 block text-[12px] leading-[1.25] text-[#536178]">{{
                step[1]
              }}</span>
            </span>
          </li>
        </ol>
      </div>

      <div
        class="mt-5 flex items-center rounded-[18px] border border-[#aed5ff] bg-[#edf5ff] px-6 py-5"
      >
        <ShieldCheck
          :size="22"
          :stroke-width="2.1"
          class="shrink-0 text-[#2468f2]"
          aria-hidden="true"
        />
        <div class="ml-5">
          <strong class="block text-[13px] font-[850] text-[#111b34]">Ештеңе жоғалмайды</strong>
          <p class="mt-1 text-[12px] leading-[1.4] text-[#536178]">
            Ақау кезінде нәтиже құрылғыда сақталып, кейін синхрондалады.
          </p>
        </div>
      </div>
    </main>

    <button
      class="primary-button mt-2 min-h-[52px] shrink-0 rounded-[16px] text-[16px]"
      type="button"
      @click="router.push({ name: 'personal-plan' })"
    >
      Жоспарымды баптау
      <ArrowRight :size="20" :stroke-width="2" aria-hidden="true" />
    </button>
  </section>
</template>
