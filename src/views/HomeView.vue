<script setup lang="ts">
import { ArrowRight, Gauge } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import BottomNav from '../components/BottomNav.vue'
import { getForecastScreenModel } from '../features/forecast/forecastApplication'

const router = useRouter()
const forecast = getForecastScreenModel()

function startTraining() {
  void router.push({ name: 'training' })
}
</script>

<template>
  <section class="screen-page bg-[#f8faff]">
    <div class="screen-content px-4 pt-8">
      <p class="eyebrow">{{ forecast.eyebrow }}</p>
      <h1 class="mt-2 text-[26px] font-[850] leading-[1.16] tracking-[-0.025em] text-[#111b34]">
        {{ forecast.title }}
      </h1>
      <p class="mt-3 max-w-[34rem] text-[15px] leading-[1.45] text-[#536178]">
        {{ forecast.description }}
      </p>

      <div v-if="forecast.score" class="mt-4">
        <p class="text-[12px] font-[750] text-[#536178]">{{ forecast.score.label }}</p>
        <p class="metric-value mt-1 text-[24px] font-[850] tracking-[-0.025em] text-[#111b34]">
          {{ forecast.score.value }}
        </p>
        <p class="mt-1 text-[12px] text-[#536178]">{{ forecast.score.detail }}</p>
      </div>

      <section
        class="soft-card mt-6 p-4"
        :data-status="forecast.status"
        aria-labelledby="forecast-next-step-title"
        role="status"
      >
        <Gauge :size="24" :stroke-width="2" class="text-[#2468f2]" aria-hidden="true" />
        <h2
          id="forecast-next-step-title"
          class="mt-1 text-[18px] font-[850] leading-[1.25] tracking-[-0.02em] text-[#111b34]"
        >
          Келесі қадам
        </h2>
        <p class="mt-2 text-[14px] leading-[1.45] text-[#536178]">
          {{ forecast.note }}
        </p>
      </section>

      <button
        class="primary-button mt-6 min-h-[52px] rounded-[16px] text-[16px]"
        type="button"
        @click="startTraining"
      >
        {{ forecast.actionLabel }}
        <ArrowRight :size="20" :stroke-width="2" aria-hidden="true" />
      </button>
    </div>

    <BottomNav active="home" />
  </section>
</template>
