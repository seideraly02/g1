<script setup lang="ts">
import { LogOut } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { signOutAccount } from '../features/auth/accountSession'
import { useAuthStore } from '../stores/authStore'
import BrandMark from './BrandMark.vue'
import { isNavigationItemActive, primaryNavigationItems } from './navigation'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

async function signOut() {
  if (!(await auth.signOut())) return
  signOutAccount()
  await router.replace({ name: 'welcome' })
}
</script>

<template>
  <aside class="desktop-sidebar" aria-label="Негізгі мәзір">
    <button
      class="flex min-h-11 w-full items-center border-0 bg-transparent px-1 text-left"
      type="button"
      aria-label="Qadam ENT басты беті"
      @click="router.push({ name: 'home' })"
    >
      <BrandMark />
    </button>

    <nav class="mt-8 flex flex-1 flex-col gap-1" aria-label="Оқу бөлімдері">
      <button
        v-for="item in primaryNavigationItems"
        :key="item.key"
        class="flex min-h-12 w-full items-center gap-3 rounded-lg border-0 px-3 text-left text-[14px] font-[650] transition-colors"
        :class="
          isNavigationItemActive(item, route.name)
            ? 'bg-[#edf4ff] text-[#1f66d9]'
            : 'bg-transparent text-[#526078] hover:bg-[#f4f7fb] hover:text-[#14203a]'
        "
        type="button"
        :aria-current="isNavigationItemActive(item, route.name) ? 'page' : undefined"
        @click="router.push({ name: item.route })"
      >
        <component
          :is="item.icon"
          :size="20"
          :stroke-width="isNavigationItemActive(item, route.name) ? 2.3 : 1.9"
          aria-hidden="true"
        />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <div v-if="auth.isAuthenticated" class="mt-auto border-t border-[#e5eaf1] pt-3">
      <p v-if="auth.error" role="alert" class="px-3 pb-2 text-xs text-[#c52835]">
        {{ auth.error }}
      </p>
      <button
        class="flex min-h-11 w-full items-center gap-3 rounded-lg border-0 bg-transparent px-3 text-left text-[14px] font-[650] text-[#c52835] transition-colors hover:bg-[#fff1f2] hover:text-[#a71927] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c52835]"
        type="button"
        @click="signOut"
      >
        <LogOut :size="20" :stroke-width="1.9" aria-hidden="true" />
        <span>Аккаунттан шығу</span>
      </button>
    </div>
  </aside>
</template>
