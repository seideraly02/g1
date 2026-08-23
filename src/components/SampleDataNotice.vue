<script setup lang="ts">
import { Info } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    text?: string
  }>(),
  {
    text: 'Төмендегі көрсеткіштер — интерфейс үлгісі. Олар сенің жеке нәтижеңе қосылмайды.',
  },
)
</script>

<template>
  <aside class="soft-card flex items-start gap-3 p-3 text-left" role="note">
    <Info class="mt-0.5 shrink-0 text-[#1f66d9]" :size="19" aria-hidden="true" />
    <p class="m-0 text-[12px] leading-5 text-[#526078]">{{ text }}</p>
  </aside>
</template>
