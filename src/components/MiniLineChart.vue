<script setup lang="ts">
withDefaults(
  defineProps<{
    points?: string
    color?: string
    fill?: boolean
  }>(),
  {
    points: '3,37 27,31 51,33 75,20 99,23 123,12 147,7',
    color: '#2468f2',
    fill: false,
  },
)
</script>

<template>
  <svg viewBox="0 0 150 44" preserveAspectRatio="none" class="block h-full w-full" aria-label="Өсу динамикасы" role="img">
    <defs>
      <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="color" stop-opacity=".22" />
        <stop offset="1" :stop-color="color" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path d="M1 11.5H149M1 22H149M1 32.5H149" stroke="#e9edf4" stroke-width=".7" stroke-dasharray="2 3" />
    <path v-if="fill" :d="`M ${points} L147 44 L3 44 Z`" fill="url(#chartFill)" />
    <polyline
      :points="points"
      fill="none"
      :stroke="color"
      stroke-width="2.4"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="147" cy="7" r="3.5" :fill="color" />
  </svg>
</template>
