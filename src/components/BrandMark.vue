<script setup lang="ts">
defineProps<{
  compact?: boolean
}>()
</script>

<template>
  <div class="inline-flex items-center gap-2">
    <span
      class="grid size-[34px] place-items-center rounded-[11px] bg-gradient-to-br from-[#346ff4] to-[#765cf3] text-white shadow-[0_5px_12px_rgba(83,91,232,.22)]"
      aria-hidden="true"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M9 2.25 10.28 6.72 14.75 8 10.28 9.28 9 13.75 7.72 9.28 3.25 8l4.47-1.28L9 2.25Z"
          fill="currentColor"
        />
        <circle cx="13.8" cy="3.8" r="1.05" fill="currentColor" opacity=".82" />
        <circle cx="3.6" cy="13.8" r=".85" fill="currentColor" opacity=".7" />
      </svg>
    </span>
    <span v-if="!compact" class="text-[18px] font-[750] tracking-[-.025em] text-[#14203a]"
      >Qadam ENT</span
    >
  </div>
</template>
