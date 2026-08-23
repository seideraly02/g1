<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    size?: number
    stroke?: number
    color?: string
  }>(),
  {
    size: 100,
    stroke: 10,
    color: '#1f66d9',
  },
)

const radius = computed(() => (props.size - props.stroke) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const offset = computed(
  () => circumference.value * (1 - Math.min(100, Math.max(0, props.value)) / 100),
)
</script>

<template>
  <div
    class="relative inline-grid place-items-center"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <svg
      class="-rotate-90"
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
      aria-hidden="true"
    >
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        stroke="#e9eef6"
        :stroke-width="stroke"
      />
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="color"
        :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
      />
    </svg>
    <div class="absolute inset-0 grid place-items-center">
      <slot />
    </div>
  </div>
</template>
