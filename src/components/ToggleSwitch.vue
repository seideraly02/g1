<script setup lang="ts">
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <button
    class="relative h-[24px] w-[42px] rounded-full border-0 p-0 transition-colors"
    :class="model ? 'bg-[#2468f2]' : 'bg-[#cbd4e3]'"
    type="button"
    role="switch"
    :aria-checked="model"
    @click="model = !model"
  >
    <span
      class="absolute top-[3px] size-[18px] rounded-full bg-white shadow-sm transition-transform"
      :class="model ? 'translate-x-[21px]' : 'translate-x-[3px]'"
    />
  </button>
</template>
