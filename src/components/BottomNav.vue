<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import {
  isNavigationItemActive,
  primaryNavigationItems,
  type PrimaryNavigationKey,
} from './navigation'

const props = defineProps<{
  active?: PrimaryNavigationKey
}>()

const router = useRouter()
const route = useRoute()

function isActive(item: (typeof primaryNavigationItems)[number]) {
  return isNavigationItemActive(item, route.name, props.active)
}
</script>

<template>
  <nav
    class="bottom-navigation fixed inset-x-0 bottom-0 z-20 mx-auto flex h-[76px] w-full max-w-[720px] items-end justify-around border-t border-[#e2e8f0] bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur min-[521px]:absolute"
    aria-label="Негізгі мәзір"
  >
    <button
      v-for="item in primaryNavigationItems"
      :key="item.key"
      class="group relative flex h-[54px] w-[58px] flex-col items-center justify-end gap-1 border-0 pb-1 text-[11px] font-[650] leading-[1.1] transition-colors min-[521px]:w-[76px] min-[768px]:w-[96px]"
      :class="
        isActive(item)
          ? item.key === 'training'
            ? 'bg-transparent text-[#1f66d9]'
            : 'rounded-[14px] bg-[#edf4ff] text-[#1f66d9]'
          : 'bg-transparent text-[#69758a]'
      "
      type="button"
      :aria-current="isActive(item) ? 'page' : undefined"
      @click="router.push({ name: item.route })"
    >
      <span
        v-if="item.key === 'training'"
        class="absolute top-[-25px] grid size-[58px] place-items-center rounded-[18px] bg-[#1f66d9] text-white shadow-[0_9px_20px_rgba(31,102,217,.25)] transition-transform group-active:scale-95"
      >
        <component :is="item.icon" :size="21" :stroke-width="2" fill="currentColor" />
      </span>
      <component :is="item.icon" v-else :size="19" :stroke-width="isActive(item) ? 2.4 : 1.9" />
      <span :class="{ 'mt-[34px]': item.key === 'training' }">{{ item.label }}</span>
    </button>
  </nav>
</template>
