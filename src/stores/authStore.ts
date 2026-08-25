import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { clearAuthenticatedUser } from '../features/auth/authPersistence'
import { verifyServerSession } from '../features/auth/sessionVerification'
import { AuthError, type AuthenticatedUser } from '../features/auth/types'
import type { LoginInput, RegistrationRequest } from '../features/auth/types'
import { authRepository } from '../services/api/apiAuthRepository'

const message = (error: unknown) =>
  error instanceof AuthError ? error.message : 'Белгісіз қате болды. Қайталап көр'

export const useAuthStore = defineStore('auth', () => {
  clearAuthenticatedUser()

  const user = ref<AuthenticatedUser | null>(null)
  const loading = ref(false)
  const error = ref('')
  const sessionChecked = ref(false)
  let sessionCheck: Promise<boolean> | null = null
  const isAuthenticated = computed(() => user.value !== null)

  function ensureSession(): Promise<boolean> {
    if (sessionChecked.value) return Promise.resolve(isAuthenticated.value)
    if (!sessionCheck) {
      sessionCheck = verifyServerSession(authRepository)
        .then((verifiedUser) => {
          user.value = verifiedUser
          sessionChecked.value = true
          return verifiedUser !== null
        })
        .catch((cause) => {
          error.value = message(cause)
          sessionChecked.value = false
          return false
        })
        .finally(() => {
          sessionCheck = null
        })
    }
    return sessionCheck
  }

  async function authenticate(action: () => Promise<AuthenticatedUser>) {
    loading.value = true
    error.value = ''
    try {
      user.value = await action()
      sessionChecked.value = true
      return true
    } catch (cause) {
      error.value = message(cause)
      return false
    } finally {
      loading.value = false
    }
  }

  function register(input: RegistrationRequest) {
    return authenticate(() => authRepository.register(input))
  }

  function login(input: LoginInput) {
    return authenticate(() => authRepository.login(input))
  }

  function clearError() {
    error.value = ''
  }

  async function signOut() {
    error.value = ''
    try {
      await authRepository.signOut()
    } catch (cause) {
      error.value = message(cause)
      return false
    }
    user.value = null
    clearAuthenticatedUser()
    sessionChecked.value = true
    return true
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    ensureSession,
    register,
    login,
    clearError,
    signOut,
  }
})
