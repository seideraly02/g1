<script setup lang="ts">
import { ArrowLeft, MessageCircle } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BrandMark from '../components/BrandMark.vue'
import {
  formatKazakhstanPhone,
  isVerificationCode,
  normalizeRegistration,
  validateRegistration,
  type RegistrationErrors,
} from '../features/auth/registrationValidation'
import type { RegistrationProfile } from '../features/auth/types'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const auth = useAuthStore()
const profile = ref<RegistrationProfile>({ fullName: '', city: '', phone: '' })
const errors = ref<RegistrationErrors>({})
const code = ref('')
const codeStep = computed(() => auth.codeRequest !== null)

function updatePhone(event: Event) {
  if (event.target instanceof HTMLInputElement) {
    profile.value.phone = formatKazakhstanPhone(event.target.value)
  }
}

async function sendCode() {
  errors.value = validateRegistration(profile.value)
  if (Object.keys(errors.value).length) return
  await auth.requestCode(normalizeRegistration(profile.value))
}

async function confirmCode() {
  if (isVerificationCode(code.value) && (await auth.verifyCode(code.value))) {
    await router.replace({ name: 'subjects-onboarding' })
  }
}
</script>

<template>
  <section class="screen-page flex min-h-[844px] flex-col bg-[#f1f5fb] px-4 pb-6">
    <header class="mx-auto flex min-h-20 w-full max-w-[920px] items-center justify-between">
      <BrandMark />
      <span class="text-xs font-bold text-[#6b768b]">ҰБТ дайындығы</span>
    </header>
    <main
      class="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center rounded-[20px] bg-white px-5 py-7 shadow-[0_12px_36px_rgba(31,63,114,.08)] sm:px-8"
    >
      <button
        v-if="codeStep"
        class="icon-button -ml-2 mb-4 min-h-11 min-w-11"
        type="button"
        aria-label="Артқа"
        @click="auth.editProfile()"
      >
        <ArrowLeft :size="21" />
      </button>
      <span class="mb-5 grid size-12 place-items-center rounded-[14px] bg-[#edf4ff] text-[#1f66d9]">
        <MessageCircle :size="25" aria-hidden="true" />
      </span>
      <h1 class="text-[28px] font-extrabold tracking-[-.03em] text-[#17223b]">
        {{ codeStep ? 'Телефонды раста' : 'Тіркелу' }}
      </h1>
      <p class="mt-2 text-sm leading-6 text-[#6b768b]">
        {{
          codeStep
            ? `Код ${profile.phone} нөміріне байланыстырылған Telegram-ға жіберілді.`
            : 'Прогресті тіркелгіге сақтау үшін барлық жолды толтыр.'
        }}
      </p>

      <form v-if="!codeStep" class="mt-7 space-y-4" novalidate @submit.prevent="sendCode">
        <label
          v-for="field in ['fullName', 'city', 'phone'] as const"
          :key="field"
          class="block text-[13px] font-bold"
        >
          {{ field === 'fullName' ? 'Аты-жөні' : field === 'city' ? 'Қала' : 'Телефон нөмірі' }}
          <input
            v-model="profile[field]"
            class="mt-2 min-h-[52px] w-full rounded-[14px] border border-[#cbd5e1] px-4 text-[15px] transition focus:border-[#1f66d9]"
            :type="field === 'phone' ? 'tel' : 'text'"
            :inputmode="field === 'phone' ? 'tel' : 'text'"
            :autocomplete="
              field === 'fullName' ? 'name' : field === 'city' ? 'address-level2' : 'tel'
            "
            :placeholder="field === 'phone' ? '+7 (7XX) - XXX - XX - XX' : ''"
            :maxlength="field === 'phone' ? 24 : undefined"
            :aria-invalid="Boolean(errors[field])"
            @input="field === 'phone' && updatePhone($event)"
          />
          <span v-if="errors[field]" class="mt-1 block text-xs text-[#c52835]">{{
            errors[field]
          }}</span>
        </label>
        <p v-if="auth.error" role="alert" class="text-[13px] text-[#c52835]">{{ auth.error }}</p>
        <button class="primary-button min-h-[52px]" type="submit" :disabled="auth.loading">
          {{ auth.loading ? 'Жіберіліп жатыр…' : 'Telegram-ға код жіберу' }}
        </button>
      </form>

      <form v-else class="mt-7" novalidate @submit.prevent="confirmCode">
        <label class="block text-[13px] font-bold">
          Растау коды
          <input
            v-model="code"
            class="mt-2 min-h-14 w-full rounded-[14px] border border-[#cbd5e1] px-3 text-center text-2xl font-bold tracking-[.3em] transition focus:border-[#1f66d9]"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            @input="code = code.replace(/\D/g, '').slice(0, 6)"
          />
        </label>
        <p v-if="auth.error" role="alert" class="mt-3 text-[13px] text-[#c52835]">
          {{ auth.error }}
        </p>
        <button
          class="primary-button mt-5 min-h-[52px]"
          type="submit"
          :disabled="auth.loading || !isVerificationCode(code)"
        >
          {{ auth.loading ? 'Тексеріліп жатыр…' : 'Растау және бастау' }}
        </button>
        <button
          class="text-button mx-auto mt-3 flex"
          type="button"
          :disabled="auth.loading"
          @click="sendCode"
        >
          Кодты қайта жіберу
        </button>
      </form>
    </main>
  </section>
</template>
