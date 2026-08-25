import type { AuthenticatedUser, LoginInput, RegistrationRequest } from './types'

export interface AuthRepository {
  register(input: RegistrationRequest): Promise<AuthenticatedUser>
  login(input: LoginInput): Promise<AuthenticatedUser>
  getSession(): Promise<AuthenticatedUser | null>
  signOut(): Promise<void>
}
