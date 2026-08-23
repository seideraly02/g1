<script setup lang="ts">
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <button
    class="grid size-11 shrink-0 place-items-center rounded-xl border-0 bg-transparent p-0"
    type="button"
    role="switch"
    :aria-checked="model"
    @click="model = !model"
  >
    <span
      class="relative block h-[24px] w-[42px] rounded-full transition-colors"
      :class="model ? 'bg-[#1f66d9]' : 'bg-[#cbd4e3]'"
      aria-hidden="true"
    >
      <span
        class="absolute left-[3px] top-[3px] size-[18px] rounded-full bg-white shadow-sm transition-transform"
        :class="{ 'translate-x-[18px]': model }"
      />
    </span>
  </button>
</template>
