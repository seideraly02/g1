<script setup lang="ts">
import {
  ArrowRight,
  BookOpenCheck,
  ChartNoAxesCombined,
  Check,
  Clock3,
  Target,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import BrandMark from '../components/BrandMark.vue'

const router = useRouter()

const steps = [
  { icon: Target, title: 'Деңгейіңді тексер', text: '5 сұрақ · шамамен 2 минут' },
  { icon: BookOpenCheck, title: 'Жеке жоспарыңды ал', text: 'Әлсіз тақырыптарға басымдық береміз' },
  { icon: ChartNoAxesCombined, title: 'Күн сайын ілгеріле', text: 'Жаттығу, талдау және қайталау' },
] as const

function openRegistration() {
  void router.push({ name: 'register' })
}

function startPreparation() {
  void router.push({ name: 'register' })
}
</script>

<template>
  <section class="min-h-dvh bg-[#f1f5fb] text-[#17223b]">
    <header class="mx-auto flex min-h-20 w-full max-w-[1440px] items-center justify-between px-4">
      <BrandMark />
      <button class="text-button min-h-11 text-sm" type="button" @click="openRegistration">
        Тіркелу
      </button>
    </header>

    <main class="mx-auto w-full max-w-[1440px] px-4 pb-8">
      <section
        class="overflow-hidden rounded-[24px] bg-[#1f66d9] px-5 py-8 text-white sm:px-10 sm:py-12 lg:grid lg:min-h-[620px] lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,.8fr)] lg:items-center lg:gap-[clamp(48px,6vw,88px)] lg:px-[clamp(48px,5vw,80px)] lg:py-14"
      >
        <div>
          <p class="inline-flex items-center gap-2 text-sm font-bold text-white">
            <Clock3 :size="18" aria-hidden="true" /> ҰБТ-ға дайындықты бүгін баста
          </p>
          <h1
            class="mt-4 max-w-[650px] text-[34px] font-extrabold leading-[1.08] tracking-[-.04em] sm:text-[48px] lg:text-[52px]"
          >
            Қай тақырыпты қайталау керегін дәл қазір анықта
          </h1>
          <p class="mt-5 max-w-[580px] text-[16px] leading-7 text-white sm:text-[18px]">
            Қысқа диагностикадан өт. Qadam нәтижеңе сай күнделікті оқу бағытын ұсынады.
          </p>

          <div class="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              class="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-[14px] border-0 bg-white px-6 text-[15px] font-bold text-[#1d5bbd] transition hover:bg-[#f5f8ff] sm:w-auto"
              type="button"
              @click="startPreparation"
            >
              Дайындықты бастау
              <ArrowRight :size="19" aria-hidden="true" />
            </button>
          </div>
          <p class="mt-4 flex items-center gap-2 text-xs text-white">
            <Check :size="16" aria-hidden="true" /> Тіркелу қажет · карта қажет емес
          </p>
        </div>

        <div
          class="mt-8 w-full max-w-[460px] rounded-[20px] bg-white p-5 text-[#17223b] shadow-[0_14px_34px_rgba(14,44,94,.16)] lg:mt-0 lg:justify-self-end lg:p-6"
        >
          <p class="text-xs font-bold uppercase tracking-[.08em] text-[#1f66d9]">
            Қалай жұмыс істейді?
          </p>
          <ol class="mt-2 divide-y divide-[#e8edf5]" aria-label="Дайындық кезеңдері">
            <li v-for="(step, index) in steps" :key="step.title" class="flex gap-4 py-4">
              <span
                class="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[#edf4ff] text-[#1f66d9]"
                aria-hidden="true"
              >
                <component :is="step.icon" :size="21" />
              </span>
              <div>
                <p class="text-[15px] font-extrabold">
                  <span class="mr-1 text-[#98a2b3]">{{ index + 1 }}.</span>{{ step.title }}
                </p>
                <p class="mt-1 text-sm leading-5 text-[#667085]">{{ step.text }}</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <p class="mx-auto mt-6 max-w-[620px] text-center text-sm leading-6 text-[#667085]">
        5 сұрақтың нәтижесі нақты ҰБТ болжамы емес. Ол тек алғашқы оқу бағытын таңдауға көмектеседі.
      </p>
    </main>
  </section>
</template>
