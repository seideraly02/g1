import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { clearAuthenticatedUser } from '../features/auth/authPersistence'
import { verifyServerSession } from '../features/auth/sessionVerification'
import {
  AuthError,
  type AuthenticatedUser,
  type CodeRequest,
  type RegistrationProfile,
} from '../features/auth/types'
import { authRepository } from '../services/api/apiAuthRepository'

const TEST_MODE_KEY = 'qadam.test-mode'

const message = (error: unknown) =>
  error instanceof AuthError ? error.message : 'Белгісіз қате болды. Қайта көр'

function readTestMode() {
  return typeof window !== 'undefined' && window.sessionStorage.getItem(TEST_MODE_KEY) === '1'
}

function createTestUser(): AuthenticatedUser {
  return {
    id: 'test-user',
    fullName: 'Тест қолданушы',
    city: 'Алматы',
    phone: '+7 700 000 00 00',
    verifiedAt: new Date().toISOString(),
  }
}

export const useAuthStore = defineStore('auth', () => {
  // Authentication state is authoritative on the server via the HttpOnly session cookie.
  // Remove any legacy persisted profile so PII is not retained in localStorage.
  clearAuthenticatedUser()

  const testMode = ref(readTestMode())
  const user = ref<AuthenticatedUser | null>(testMode.value ? createTestUser() : null)
  const codeRequest = ref<CodeRequest | null>(null)
  const pendingProfile = ref<RegistrationProfile | null>(null)
  const loading = ref(false)
  const error = ref('')
  const sessionChecked = ref(testMode.value)
  let sessionCheck: Promise<boolean> | null = null
  const isAuthenticated = computed(() => user.value !== null)

  function ensureSession(): Promise<boolean> {
    if (testMode.value) {
      if (!user.value) user.value = createTestUser()
      sessionChecked.value = true
      return Promise.resolve(true)
    }

    if (sessionChecked.value) return Promise.resolve(isAuthenticated.value)
    if (!sessionCheck) {
      sessionCheck = verifyServerSession(authRepository).then((verifiedUser) => {
        user.value = verifiedUser
        sessionChecked.value = true
        sessionCheck = null
        return verifiedUser !== null
      })
    }
    return sessionCheck
  }

  function enterTestMode() {
    testMode.value = true
    user.value = createTestUser()
    sessionChecked.value = true
    error.value = ''
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(TEST_MODE_KEY, '1')
    }
  }

  async function requestCode(profile: RegistrationProfile) {
    loading.value = true
    error.value = ''
    try {
      codeRequest.value = await authRepository.requestTelegramCode(profile)
      pendingProfile.value = profile
      return true
    } catch (cause) {
      error.value = message(cause)
      return false
    } finally {
      loading.value = false
    }
  }

  async function verifyCode(code: string) {
    if (!codeRequest.value) return false
    loading.value = true
    error.value = ''
    try {
      user.value = await authRepository.verifyTelegramCode({
        requestId: codeRequest.value.requestId,
        code,
      })
      sessionChecked.value = true
      codeRequest.value = null
      pendingProfile.value = null
      return true
    } catch (cause) {
      error.value = message(cause)
      return false
    } finally {
      loading.value = false
    }
  }

  function editProfile() {
    codeRequest.value = null
    error.value = ''
  }

  async function signOut() {
    if (!testMode.value) {
      try {
        await authRepository.signOut()
      } catch {
        /* Local sign-out still completes offline. */
      }
    }

    testMode.value = false
    user.value = null
    codeRequest.value = null
    pendingProfile.value = null
    clearAuthenticatedUser()
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(TEST_MODE_KEY)
    }
    sessionChecked.value = true
  }

  return {
    user,
    codeRequest,
    pendingProfile,
    loading,
    error,
    testMode,
    isAuthenticated,
    ensureSession,
    enterTestMode,
    requestCode,
    verifyCode,
    editProfile,
    signOut,
  }
})
