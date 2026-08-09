<script setup lang="ts">
import { ArrowRight, BarChart3, BookOpenCheck, FlaskConical, Target } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import BrandMark from '../components/BrandMark.vue'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const auth = useAuthStore()

const benefits = [
  {
    icon: Target,
    title: 'Деңгейіңді анықта',
    text: 'Қысқа бастапқы тексеру арқылы қай тақырыптарға көбірек көңіл бөлу керегін көр.',
  },
  {
    icon: BookOpenCheck,
    title: 'Жеке жоспармен дайындал',
    text: 'Күн сайын орындауға ыңғайлы тапсырмалар мен әлсіз тақырыптарға арналған жаттығулар ал.',
  },
  {
    icon: BarChart3,
    title: 'Прогресті бақыла',
    text: 'Нәтижелеріңді, қателеріңді және дайындықтағы өзгерісті бір жерден қадағала.',
  },
] as const

function openRegistration() {
  void router.push({ name: 'register' })
}

function startTestMode() {
  auth.enterTestMode()
  void router.push({ name: 'subjects-onboarding' })
}
</script>

<template>
  <section class="min-h-dvh bg-[#f7f9fc] text-[#14203a]">
    <div class="mx-auto flex min-h-dvh w-full max-w-[1120px] flex-col px-4 pb-8 sm:px-6 lg:px-8">
      <header class="flex min-h-20 items-center justify-between">
        <BrandMark />
        <button
          class="min-h-11 rounded-lg px-3 text-sm font-bold text-[#2563eb] transition hover:bg-[#edf4ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2"
          type="button"
          @click="openRegistration"
        >
          Тіркелу
        </button>
      </header>

      <main class="flex flex-1 flex-col justify-center py-8 sm:py-12 lg:py-16">
        <div class="grid items-center gap-10 lg:grid-cols-[1.08fr_.92fr] lg:gap-16">
          <div class="max-w-[620px]">
            <p class="text-sm font-bold text-[#2563eb]">ҰБТ-ға жүйелі дайындық</p>
            <h1
              class="mt-3 max-w-[590px] text-[36px] font-extrabold leading-[1.08] tracking-[-.035em] sm:text-[46px] lg:text-[56px]"
            >
              Қай тақырыптан бастау керегін анықтап, күн сайын алға жылжы
            </h1>
            <p class="mt-5 max-w-[560px] text-[16px] leading-7 text-[#5f6b80] sm:text-[18px]">
              Qadam ҰБТ-ға дайындықты түсінікті қадамдарға бөледі: деңгейіңді тексересің,
              жеке жоспар аласың, жаттығу жасайсың және прогресіңді бақылайсың.
            </p>

            <div class="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                class="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-5 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(37,99,235,.18)] transition hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 sm:w-auto"
                type="button"
                @click="openRegistration"
              >
                Дайындықты бастау
                <ArrowRight :size="19" aria-hidden="true" />
              </button>
              <button
                class="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-[#cbd5e1] bg-white px-5 text-[15px] font-bold text-[#334155] transition hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 sm:w-auto"
                type="button"
                @click="startTestMode"
              >
                <FlaskConical :size="18" aria-hidden="true" />
                Тіркелмей тестілеу
              </button>
            </div>
            <p class="mt-3 text-xs leading-5 text-[#7a8598]">
              Тест режимі тек тексеруге арналған және браузер қойындысы жабылғанда өшеді.
            </p>
          </div>

          <div class="rounded-2xl bg-white p-5 shadow-[0_14px_40px_rgba(20,32,58,.08)] sm:p-7">
            <div class="flex items-start justify-between gap-4 border-b border-[#e8edf5] pb-5">
              <div>
                <p class="text-xs font-bold uppercase tracking-[.08em] text-[#8290a7]">Qadam жоспары</p>
                <h2 class="mt-2 text-xl font-extrabold tracking-[-.02em]">Дайындықтың қарапайым жолы</h2>
              </div>
              <span
                class="grid size-11 shrink-0 place-items-center rounded-xl bg-[#edf4ff] text-[#2563eb]"
                aria-hidden="true"
              >
                <Target :size="22" />
              </span>
            </div>

            <ol class="mt-5 space-y-5" aria-label="Дайындық кезеңдері">
              <li v-for="(benefit, index) in benefits" :key="benefit.title" class="flex gap-4">
                <span
                  class="grid size-10 shrink-0 place-items-center rounded-lg bg-[#f1f5f9] text-[#334155]"
                  aria-hidden="true"
                >
                  <component :is="benefit.icon" :size="20" />
                </span>
                <div>
                  <p class="text-[15px] font-extrabold">
                    <span class="mr-1 text-[#94a3b8]">{{ index + 1 }}.</span>{{ benefit.title }}
                  </p>
                  <p class="mt-1 text-sm leading-6 text-[#667085]">{{ benefit.text }}</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  </section>
</template>
