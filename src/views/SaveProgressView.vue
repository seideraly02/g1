<script setup lang="ts">
import { ArrowRight, Cloud, ShieldCheck } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import { getLatestGuestDiagnosticSession } from '../features/session/sessionApplication'

const router = useRouter()
const session = getLatestGuestDiagnosticSession()
const hasSavedDiagnostic = session?.status === 'completed' && session.answers.length === 5

const steps = [
  ['Нәтиже құрылғыда сақталды', 'Жауаптар мен жұмсалған уақыт жоғалмайды', true],
  ['Диагностика аяқталды', 'Бастапқы оқу бағыты дайын', true],
  ['Жоспарға дайын', 'Күнделікті мақсатты таңдау қалды', false],
] as const
</script>

<template>
  <section class="screen-page flex min-h-[844px] flex-col bg-[#f8f8f8] pb-4">
    <AppHeader title="Ілгерілеуді сақтау" back />

    <main v-if="hasSavedDiagnostic" class="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
      <div class="mt-10 flex justify-center">
        <span
          class="grid size-[78px] place-items-center rounded-[27px] bg-[#edfbf3] text-[#16a757]"
        >
          <Cloud :size="39" :stroke-width="2.1" aria-hidden="true" />
        </span>
      </div>

      <h2 class="mt-5 text-center text-[22px] font-[900] tracking-[-.02em] text-[#111b34]">
        Нәтижең дайын
      </h2>
      <p class="mt-1 text-center text-[15px] text-[#536178]">Келесі қадам — оқу жоспары</p>

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
                  : 'border-[#dceaff] text-[#1f66d9] shadow-[0_0_0_4px_#e9f2ff]'
              "
              aria-hidden="true"
            >
              <span
                class="size-[15px] rounded-full"
                :class="step[2] ? 'bg-[#16a757]' : 'bg-[#1f66d9]'"
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
          class="shrink-0 text-[#1f66d9]"
          aria-hidden="true"
        />
        <div class="ml-5">
          <strong class="block text-[13px] font-[850] text-[#111b34]">Ештеңе жоғалмайды</strong>
          <p class="mt-1 text-[12px] leading-[1.4] text-[#536178]">
            Нәтиже осы құрылғыда сақталған. Тіркелсең, кейін оны аккаунтқа байланыстыра аласың.
          </p>
        </div>
      </div>
    </main>

    <main
      v-else
      class="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center px-4 text-center"
    >
      <span class="grid size-14 place-items-center rounded-[16px] bg-[#edf4ff] text-[#1f66d9]"
        ><Cloud :size="26"
      /></span>
      <h2 class="mt-4 text-[21px] font-[800]">Сақталған диагностика жоқ</h2>
      <p class="mt-2 text-[14px] leading-6 text-[#667085]">
        Алдымен пән таңдап, бастапқы тексеруді аяқта.
      </p>
      <button
        class="primary-button mt-6 max-w-[320px]"
        type="button"
        @click="router.push({ name: 'subjects-onboarding' })"
      >
        Пәнді таңдау
      </button>
    </main>

    <div v-if="hasSavedDiagnostic" class="px-4">
      <button
        class="primary-button mt-2 min-h-[52px] shrink-0 rounded-[16px] text-[16px]"
        type="button"
        @click="router.push({ name: 'personal-plan' })"
      >
        Жоспарымды баптау
        <ArrowRight :size="20" :stroke-width="2" aria-hidden="true" />
      </button>
    </div>
  </section>
</template>
