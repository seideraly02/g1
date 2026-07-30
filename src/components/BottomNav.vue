<script setup lang="ts">
import { BarChart3, BookOpen, Home, Play, UserRound } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import type { AppRouteName } from '../router'

const props = defineProps<{
  active?: 'home' | 'subjects' | 'training' | 'progress' | 'profile'
}>()

const router = useRouter()
const route = useRoute()

const items: Array<{
  key: 'home' | 'subjects' | 'training' | 'progress' | 'profile'
  label: string
  route: AppRouteName
  icon: typeof Home
}> = [
  { key: 'home', label: 'Басты бет', route: 'home', icon: Home },
  { key: 'subjects', label: 'Пәндер', route: 'subjects', icon: BookOpen },
  { key: 'training', label: 'Жаттығу', route: 'training', icon: Play },
  { key: 'progress', label: 'Ілгерілеу', route: 'progress', icon: BarChart3 },
  { key: 'profile', label: 'Профиль', route: 'profile', icon: UserRound },
]

function isActive(item: (typeof items)[number]) {
  if (props.active) return props.active === item.key
  return route.name === item.route
}
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-20 mx-auto flex h-[76px] max-w-[390px] items-end justify-around border-t border-[#e8edf5] bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur min-[521px]:absolute"
    aria-label="Негізгі мәзір"
  >
    <button
      v-for="item in items"
      :key="item.key"
      class="group relative flex h-[54px] w-[58px] flex-col items-center justify-end gap-1 border-0 pb-1 text-[9px] font-[650] leading-none transition-colors"
      :class="
        isActive(item)
          ? item.key === 'training'
            ? 'bg-transparent text-[#2563eb]'
            : 'rounded-[14px] bg-[#edf4ff] text-[#2563eb]'
          : 'bg-transparent text-[#69758a]'
      "
      type="button"
      :aria-current="isActive(item) ? 'page' : undefined"
      @click="router.push({ name: item.route })"
    >
      <span
        v-if="item.key === 'training'"
        class="absolute top-[-25px] grid size-[58px] place-items-center rounded-[18px] bg-[#2563eb] text-white shadow-[0_9px_20px_rgba(37,99,235,.28)] transition-transform group-active:scale-95"
      >
        <component :is="item.icon" :size="21" :stroke-width="2" fill="currentColor" />
      </span>
      <component :is="item.icon" v-else :size="19" :stroke-width="isActive(item) ? 2.4 : 1.9" />
      <span :class="{ 'mt-[34px]': item.key === 'training' }">{{ item.label }}</span>
    </button>
  </nav>
</template>
