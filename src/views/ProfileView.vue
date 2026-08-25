<script setup lang="ts">
import { Bell, BookOpen, ChevronRight, LogOut, MapPin, Phone, ShieldCheck } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import BottomNav from '../components/BottomNav.vue'
import { signOutAccount } from '../features/auth/accountSession'
import { formatKazakhstanPhone } from '../features/auth/registrationValidation'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const auth = useAuthStore()
const signingOut = ref(false)

const fullName = computed(() =>
  auth.user ? `${auth.user.firstName} ${auth.user.lastName}`.trim() : 'Оқушы',
)
const initials = computed(() => {
  const first = auth.user?.firstName.trim().charAt(0) ?? ''
  const last = auth.user?.lastName.trim().charAt(0) ?? ''
  return `${first}${last}`.toLocaleUpperCase('kk-KZ') || 'О'
})
const phone = computed(() =>
  auth.user?.phone ? formatKazakhstanPhone(auth.user.phone) : 'Көрсетілмеген',
)
const accountLabel = computed(() =>
  auth.user?.role === 'admin' ? 'Qadam әкімшісі' : 'Qadam оқушысы',
)

async function signOut() {
  if (signingOut.value) return
  signingOut.value = true
  try {
    if (!(await auth.signOut())) return
    signOutAccount()
    await router.replace({ name: 'register', query: { mode: 'login' } })
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <section class="screen-page w-full min-w-0 bg-[#f8f8f8]">
    <AppHeader title="Тіркелгі" />

    <div
      class="screen-content min-w-0 space-y-3 pt-3 xl:grid xl:grid-cols-12 xl:gap-4 xl:space-y-0"
    >
      <section class="card p-5 xl:col-span-7" aria-labelledby="profile-name">
        <div class="flex items-center gap-4">
          <div
            class="grid size-[74px] shrink-0 place-items-center rounded-[24px] bg-[#edf4ff] text-[24px] font-[900] text-[#1f66d9]"
            aria-hidden="true"
          >
            {{ initials }}
          </div>
          <div class="min-w-0 flex-1">
            <h1 id="profile-name" class="truncate text-[20px] font-[900] leading-tight">
              {{ fullName }}
            </h1>
            <p class="mt-1 text-[13px] text-[#536178]">{{ accountLabel }}</p>
          </div>
        </div>

        <dl class="mt-5 grid gap-3 border-t border-[#e6ebf2] pt-4 sm:grid-cols-2">
          <div class="flex min-w-0 items-center gap-3">
            <span
              class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf4ff] text-[#1f66d9]"
            >
              <MapPin :size="19" aria-hidden="true" />
            </span>
            <div class="min-w-0">
              <dt class="text-[11px] text-[#667085]">Қала</dt>
              <dd class="truncate text-[14px] font-[750] text-[#17223b]">
                {{ auth.user?.city || 'Көрсетілмеген' }}
              </dd>
            </div>
          </div>
          <div class="flex min-w-0 items-center gap-3">
            <span
              class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ecfbf3] text-[#168b4c]"
            >
              <Phone :size="19" aria-hidden="true" />
            </span>
            <div class="min-w-0">
              <dt class="text-[11px] text-[#667085]">Телефон нөмірі</dt>
              <dd class="truncate text-[14px] font-[750] text-[#17223b]">{{ phone }}</dd>
            </div>
          </div>
        </dl>
      </section>

      <nav class="card overflow-hidden xl:col-span-5" aria-label="Тіркелгі бөлімдері">
        <button
          v-if="auth.user?.role === 'admin'"
          class="flex min-h-[58px] w-full items-center gap-3 border-0 bg-white px-4 text-left"
          type="button"
          @click="router.push({ name: 'admin' })"
        >
          <span
            class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf4ff] text-[#1f66d9]"
          >
            <ShieldCheck :size="20" aria-hidden="true" />
          </span>
          <strong class="min-w-0 flex-1 text-[13px]">Әкімшілік</strong>
          <ChevronRight class="shrink-0 text-[#98a6b9]" :size="20" aria-hidden="true" />
        </button>
        <button
          class="flex min-h-[58px] w-full items-center gap-3 border-x-0 border-b-0 bg-white px-4 text-left"
          :class="auth.user?.role === 'admin' ? 'border-t border-[#e6ebf2]' : 'border-t-0'"
          type="button"
          @click="router.push({ name: 'subjects' })"
        >
          <span
            class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf4ff] text-[#1f66d9]"
          >
            <BookOpen :size="20" aria-hidden="true" />
          </span>
          <strong class="min-w-0 flex-1 text-[13px]">Пәндер мен мақсаттар</strong>
          <ChevronRight class="shrink-0 text-[#98a6b9]" :size="20" aria-hidden="true" />
        </button>
        <button
          class="flex min-h-[58px] w-full items-center gap-3 border-x-0 border-b-0 border-t border-[#e6ebf2] bg-white px-4 text-left"
          type="button"
          @click="router.push({ name: 'notifications' })"
        >
          <span
            class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ecfbf3] text-[#168b4c]"
          >
            <Bell :size="20" aria-hidden="true" />
          </span>
          <strong class="min-w-0 flex-1 text-[13px]">Хабарландырулар</strong>
          <ChevronRight class="shrink-0 text-[#98a6b9]" :size="20" aria-hidden="true" />
        </button>
      </nav>

      <section class="card p-4 xl:col-span-12" aria-labelledby="session-heading">
        <h2 id="session-heading" class="text-[13px] font-[850] text-[#17223b]">Сеанс</h2>
        <p class="mt-1 text-[12px] leading-5 text-[#667085]">
          Шыққаннан кейін қайта кіру үшін телефон нөмірі мен құпиясөз қажет.
        </p>
        <p v-if="auth.error" class="mt-3 text-[13px] text-[#c52835]" role="alert">
          {{ auth.error }}
        </p>
        <button
          class="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-[13px] border border-[#f0b8bd] bg-white px-4 text-[14px] font-[800] text-[#b4232a] transition-colors hover:bg-[#fff1f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b4232a] sm:w-auto"
          type="button"
          :disabled="signingOut"
          @click="signOut"
        >
          <LogOut :size="19" aria-hidden="true" />
          {{ signingOut ? 'Шығып жатыр…' : 'Тіркелгіден шығу' }}
        </button>
      </section>
    </div>

    <BottomNav active="profile" />
  </section>
</template>
