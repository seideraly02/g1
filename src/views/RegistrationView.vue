<script setup lang="ts">
import { ArrowLeft, Eye, EyeOff } from 'lucide-vue-next'
import { nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BrandMark from '../components/BrandMark.vue'
import {
  formatKazakhstanPhone,
  normalizeLogin,
  normalizeRegistration,
  validateLogin,
  validateRegistration,
  type LoginErrors,
  type RegistrationErrors,
} from '../features/auth/registrationValidation'
import type { LoginInput, RegistrationInput } from '../features/auth/types'
import {
  postRegistrationRouteName,
  resolvePostLoginDestination,
} from '../features/auth/authNavigation'
import { useAuthStore } from '../stores/authStore'

type AuthMode = 'register' | 'login'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const mode = ref<AuthMode>(route.query.mode === 'login' ? 'login' : 'register')
const registration = ref<RegistrationInput>({
  firstName: '',
  lastName: '',
  city: '',
  phone: '',
  password: '',
  confirmPassword: '',
})
const login = ref<LoginInput>({ phone: '', password: '' })
const registrationErrors = ref<RegistrationErrors>({})
const loginErrors = ref<LoginErrors>({})
const form = ref<HTMLFormElement | null>(null)
const showRegistrationPassword = ref(false)
const showConfirmPassword = ref(false)
const showLoginPassword = ref(false)

watch(
  () => route.query.mode,
  (queryMode) => {
    if (!auth.loading) mode.value = queryMode === 'login' ? 'login' : 'register'
  },
)

function selectMode(nextMode: AuthMode) {
  if (auth.loading) return
  mode.value = nextMode
  registrationErrors.value = {}
  loginErrors.value = {}
  auth.clearError()
  void router.replace({
    query: { ...route.query, mode: nextMode === 'login' ? 'login' : undefined },
  })
  void nextTick(() => form.value?.querySelector<HTMLInputElement>('input')?.focus())
}

function updatePhone(target: 'registration' | 'login', event: Event) {
  if (!(event.target instanceof HTMLInputElement)) return
  if (target === 'registration') {
    registration.value.phone = formatKazakhstanPhone(event.target.value)
  } else {
    login.value.phone = formatKazakhstanPhone(event.target.value)
  }
}

async function focusFirstError() {
  await nextTick()
  form.value?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()
}

async function submitRegistration() {
  registrationErrors.value = validateRegistration(registration.value)
  if (Object.keys(registrationErrors.value).length) {
    await focusFirstError()
    return
  }
  if (await auth.register(normalizeRegistration(registration.value))) {
    await router.replace({ name: postRegistrationRouteName })
  }
}

async function submitLogin() {
  loginErrors.value = validateLogin(login.value)
  if (Object.keys(loginErrors.value).length) {
    await focusFirstError()
    return
  }
  if (await auth.login(normalizeLogin(login.value))) {
    await router.replace(resolvePostLoginDestination(route.query.redirect))
  }
}
</script>

<template>
  <section class="min-h-dvh bg-[#f4f7fb] px-4 pb-8 text-[#17223b]">
    <header class="mx-auto flex min-h-20 w-full max-w-[1120px] items-center justify-between">
      <BrandMark />
      <button class="text-button min-h-11" type="button" @click="router.push({ name: 'welcome' })">
        <ArrowLeft :size="17" aria-hidden="true" /> Артқа
      </button>
    </header>

    <main class="mx-auto flex w-full max-w-[1120px] justify-center py-5 sm:py-10 lg:py-14">
      <section
        class="w-full max-w-[460px] rounded-[20px] border border-[#e2e8f0] bg-white px-5 py-7 shadow-[0_8px_28px_rgba(31,63,114,.06)] sm:px-9 sm:py-9"
        aria-labelledby="auth-heading"
      >
        <div
          class="grid grid-cols-2 rounded-[12px] bg-[#f1f5f9] p-1"
          role="group"
          aria-label="Кіру тәсілі"
        >
          <button
            class="min-h-11 rounded-[9px] border-0 text-sm font-bold transition"
            :class="
              mode === 'register'
                ? 'bg-white text-[#1f66d9] shadow-[0_1px_4px_rgba(31,63,114,.12)]'
                : 'bg-transparent text-[#667085]'
            "
            type="button"
            :disabled="auth.loading"
            :aria-pressed="mode === 'register'"
            @click="selectMode('register')"
          >
            Тіркелу
          </button>
          <button
            class="min-h-11 rounded-[9px] border-0 text-sm font-bold transition"
            :class="
              mode === 'login'
                ? 'bg-white text-[#1f66d9] shadow-[0_1px_4px_rgba(31,63,114,.12)]'
                : 'bg-transparent text-[#667085]'
            "
            type="button"
            :disabled="auth.loading"
            :aria-pressed="mode === 'login'"
            @click="selectMode('login')"
          >
            Кіру
          </button>
        </div>

        <h1 id="auth-heading" class="mt-7 text-[28px] font-extrabold tracking-[-.03em]">
          {{ mode === 'register' ? 'Тіркелгі ашу' : 'Тіркелгіге кіру' }}
        </h1>
        <p class="mt-2 text-sm leading-6 text-[#667085]">
          {{
            mode === 'register'
              ? 'Оқуды бастау үшін деректеріңді толтыр.'
              : 'Телефон нөмірі мен құпиясөзіңді енгіз.'
          }}
        </p>

        <form
          v-if="mode === 'register'"
          ref="form"
          class="mt-6 space-y-4"
          novalidate
          @submit.prevent="submitRegistration"
        >
          <label class="block text-[13px] font-bold" for="first-name">
            Аты
            <input
              id="first-name"
              v-model="registration.firstName"
              class="mt-2 min-h-[52px] w-full rounded-[13px] border border-[#cbd5e1] px-4 text-[15px] focus:border-[#1f66d9]"
              autocomplete="given-name"
              maxlength="60"
              :aria-invalid="Boolean(registrationErrors.firstName)"
              :aria-describedby="registrationErrors.firstName ? 'first-name-error' : undefined"
            />
            <span
              v-if="registrationErrors.firstName"
              id="first-name-error"
              class="mt-1 block text-xs text-[#c52835]"
              >{{ registrationErrors.firstName }}</span
            >
          </label>

          <label class="block text-[13px] font-bold" for="last-name">
            Тегі
            <input
              id="last-name"
              v-model="registration.lastName"
              class="mt-2 min-h-[52px] w-full rounded-[13px] border border-[#cbd5e1] px-4 text-[15px] focus:border-[#1f66d9]"
              autocomplete="family-name"
              maxlength="60"
              :aria-invalid="Boolean(registrationErrors.lastName)"
              :aria-describedby="registrationErrors.lastName ? 'last-name-error' : undefined"
            />
            <span
              v-if="registrationErrors.lastName"
              id="last-name-error"
              class="mt-1 block text-xs text-[#c52835]"
              >{{ registrationErrors.lastName }}</span
            >
          </label>

          <label class="block text-[13px] font-bold" for="registration-city">
            Қала
            <input
              id="registration-city"
              v-model="registration.city"
              class="mt-2 min-h-[52px] w-full rounded-[13px] border border-[#cbd5e1] px-4 text-[15px] focus:border-[#1f66d9]"
              autocomplete="address-level2"
              maxlength="80"
              :aria-invalid="Boolean(registrationErrors.city)"
              :aria-describedby="registrationErrors.city ? 'city-error' : undefined"
            />
            <span
              v-if="registrationErrors.city"
              id="city-error"
              class="mt-1 block text-xs text-[#c52835]"
              >{{ registrationErrors.city }}</span
            >
          </label>

          <label class="block text-[13px] font-bold" for="registration-phone">
            Телефон нөмірі
            <input
              id="registration-phone"
              :value="registration.phone"
              class="mt-2 min-h-[52px] w-full rounded-[13px] border border-[#cbd5e1] px-4 text-[15px] focus:border-[#1f66d9]"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              placeholder="+7 (7XX) - XXX - XX - XX"
              maxlength="24"
              :aria-invalid="Boolean(registrationErrors.phone)"
              :aria-describedby="registrationErrors.phone ? 'registration-phone-error' : undefined"
              @input="updatePhone('registration', $event)"
            />
            <span
              v-if="registrationErrors.phone"
              id="registration-phone-error"
              class="mt-1 block text-xs text-[#c52835]"
              >{{ registrationErrors.phone }}</span
            >
          </label>

          <label class="block text-[13px] font-bold" for="registration-password">
            Құпиясөз
            <span class="relative mt-2 block">
              <input
                id="registration-password"
                v-model="registration.password"
                class="min-h-[52px] w-full rounded-[13px] border border-[#cbd5e1] px-4 pr-12 text-[15px] focus:border-[#1f66d9]"
                :type="showRegistrationPassword ? 'text' : 'password'"
                autocomplete="new-password"
                maxlength="72"
                :aria-invalid="Boolean(registrationErrors.password)"
                :aria-describedby="
                  registrationErrors.password
                    ? 'registration-password-hint registration-password-error'
                    : 'registration-password-hint'
                "
              />
              <button
                class="absolute inset-y-0 right-1 flex min-w-11 items-center justify-center text-[#667085]"
                type="button"
                :aria-label="showRegistrationPassword ? 'Құпиясөзді жасыру' : 'Құпиясөзді көрсету'"
                @click="showRegistrationPassword = !showRegistrationPassword"
              >
                <EyeOff v-if="showRegistrationPassword" :size="18" aria-hidden="true" />
                <Eye v-else :size="18" aria-hidden="true" />
              </button>
            </span>
            <span
              id="registration-password-hint"
              class="mt-1 block text-xs font-normal text-[#667085]"
            >
              Кемінде 8 таңба.
            </span>
            <span
              v-if="registrationErrors.password"
              id="registration-password-error"
              class="mt-1 block text-xs text-[#c52835]"
              >{{ registrationErrors.password }}</span
            >
          </label>

          <label class="block text-[13px] font-bold" for="confirm-password">
            Құпиясөзді қайтала
            <span class="relative mt-2 block">
              <input
                id="confirm-password"
                v-model="registration.confirmPassword"
                class="min-h-[52px] w-full rounded-[13px] border border-[#cbd5e1] px-4 pr-12 text-[15px] focus:border-[#1f66d9]"
                :type="showConfirmPassword ? 'text' : 'password'"
                autocomplete="new-password"
                maxlength="72"
                :aria-invalid="Boolean(registrationErrors.confirmPassword)"
                :aria-describedby="
                  registrationErrors.confirmPassword ? 'confirm-password-error' : undefined
                "
              />
              <button
                class="absolute inset-y-0 right-1 flex min-w-11 items-center justify-center text-[#667085]"
                type="button"
                :aria-label="showConfirmPassword ? 'Құпиясөзді жасыру' : 'Құпиясөзді көрсету'"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <EyeOff v-if="showConfirmPassword" :size="18" aria-hidden="true" />
                <Eye v-else :size="18" aria-hidden="true" />
              </button>
            </span>
            <span
              v-if="registrationErrors.confirmPassword"
              id="confirm-password-error"
              class="mt-1 block text-xs text-[#c52835]"
              >{{ registrationErrors.confirmPassword }}</span
            >
          </label>

          <p v-if="auth.error" role="alert" class="text-[13px] leading-5 text-[#c52835]">
            {{ auth.error }}
          </p>
          <button class="primary-button min-h-[52px]" type="submit" :disabled="auth.loading">
            {{ auth.loading ? 'Тіркеліп жатыр…' : 'Тіркелу және бастау' }}
          </button>
        </form>

        <form v-else ref="form" class="mt-6 space-y-4" novalidate @submit.prevent="submitLogin">
          <label class="block text-[13px] font-bold" for="login-phone">
            Телефон нөмірі
            <input
              id="login-phone"
              :value="login.phone"
              class="mt-2 min-h-[52px] w-full rounded-[13px] border border-[#cbd5e1] px-4 text-[15px] focus:border-[#1f66d9]"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              placeholder="+7 (7XX) - XXX - XX - XX"
              maxlength="24"
              :aria-invalid="Boolean(loginErrors.phone)"
              :aria-describedby="loginErrors.phone ? 'login-phone-error' : undefined"
              @input="updatePhone('login', $event)"
            />
            <span
              v-if="loginErrors.phone"
              id="login-phone-error"
              class="mt-1 block text-xs text-[#c52835]"
              >{{ loginErrors.phone }}</span
            >
          </label>

          <label class="block text-[13px] font-bold" for="login-password">
            Құпиясөз
            <span class="relative mt-2 block">
              <input
                id="login-password"
                v-model="login.password"
                class="min-h-[52px] w-full rounded-[13px] border border-[#cbd5e1] px-4 pr-12 text-[15px] focus:border-[#1f66d9]"
                :type="showLoginPassword ? 'text' : 'password'"
                autocomplete="current-password"
                maxlength="72"
                :aria-invalid="Boolean(loginErrors.password)"
                :aria-describedby="loginErrors.password ? 'login-password-error' : undefined"
              />
              <button
                class="absolute inset-y-0 right-1 flex min-w-11 items-center justify-center text-[#667085]"
                type="button"
                :aria-label="showLoginPassword ? 'Құпиясөзді жасыру' : 'Құпиясөзді көрсету'"
                @click="showLoginPassword = !showLoginPassword"
              >
                <EyeOff v-if="showLoginPassword" :size="18" aria-hidden="true" />
                <Eye v-else :size="18" aria-hidden="true" />
              </button>
            </span>
            <span
              v-if="loginErrors.password"
              id="login-password-error"
              class="mt-1 block text-xs text-[#c52835]"
              >{{ loginErrors.password }}</span
            >
          </label>

          <p v-if="auth.error" role="alert" class="text-[13px] leading-5 text-[#c52835]">
            {{ auth.error }}
          </p>
          <button class="primary-button min-h-[52px]" type="submit" :disabled="auth.loading">
            {{ auth.loading ? 'Кіріп жатыр…' : 'Кіру' }}
          </button>
        </form>
      </section>
    </main>
  </section>
</template>
