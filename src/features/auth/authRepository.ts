import type { AuthenticatedUser, CodeRequest, RegistrationProfile, VerifyCodeInput } from './types'

export interface AuthRepository {
  requestTelegramCode(profile: RegistrationProfile): Promise<CodeRequest>
  verifyTelegramCode(input: VerifyCodeInput): Promise<AuthenticatedUser>
  getSession(): Promise<AuthenticatedUser | null>
  signOut(): Promise<void>
}
