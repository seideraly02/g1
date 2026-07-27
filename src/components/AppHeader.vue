<script setup lang="ts">
import { ArrowLeft, X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{
    title: string
    back?: boolean
    close?: boolean
    border?: boolean
  }>(),
  {
    back: false,
    close: false,
    border: false,
  },
)

const router = useRouter()

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push({ name: 'home' })
  }
}
</script>

<template>
  <header
    class="safe-top flex min-h-[76px] items-end gap-2 px-4 pb-2"
    :class="{ 'border-b border-[#edf0f5]': props.border }"
  >
    <button
      v-if="back || close"
      class="icon-button"
      type="button"
      :aria-label="close ? 'Жабу' : 'Артқа'"
      @click="goBack"
    >
      <X v-if="close" :size="20" :stroke-width="2" />
      <ArrowLeft v-else :size="20" :stroke-width="2" />
    </button>
    <h1 class="min-w-0 flex-1 truncate pb-2 text-[18px] font-[700] tracking-[-.02em]">{{ title }}</h1>
    <div class="flex min-w-[38px] items-center justify-end gap-1">
      <slot name="actions" />
    </div>
  </header>
</template>
