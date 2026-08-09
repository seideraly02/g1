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

const message = (error: unknown) =>
  error instanceof AuthError ? error.message : 'Белгісіз қате болды. Қайта көр'

export const useAuthStore = defineStore('auth', () => {
  // Authentication state comes only from the HttpOnly server session cookie.
  // Clear the legacy localStorage profile to avoid retaining PII on shared devices.
  clearAuthenticatedUser()

  const user = ref<AuthenticatedUser | null>(null)
  const codeRequest = ref<CodeRequest | null>(null)
  const pendingProfile = ref<RegistrationProfile | null>(null)
  const loading = ref(false)
  const error = ref('')
  const sessionChecked = ref(false)
  let sessionCheck: Promise<boolean> | null = null
  const isAuthenticated = computed(() => user.value !== null)

  function ensureSession(): Promise<boolean> {
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
    try {
      await authRepository.signOut()
    } catch {
      /* Local sign-out still completes offline. */
    }
    user.value = null
    codeRequest.value = null
    pendingProfile.value = null
    clearAuthenticatedUser()
    sessionChecked.value = true
  }

  return {
    user,
    codeRequest,
    pendingProfile,
    loading,
    error,
    isAuthenticated,
    ensureSession,
    requestCode,
    verifyCode,
    editProfile,
    signOut,
  }
})
