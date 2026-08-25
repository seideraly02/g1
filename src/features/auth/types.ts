export interface RegistrationInput {
  firstName: string
  lastName: string
  city: string
  phone: string
  password: string
  confirmPassword: string
}

export type RegistrationRequest = Omit<RegistrationInput, 'confirmPassword'>

export interface LoginInput {
  phone: string
  password: string
}

export type UserRole = 'student' | 'admin'

export interface AuthenticatedUser {
  id: string
  firstName: string
  lastName: string
  city: string
  phone: string
  role: UserRole
  createdAt: string
}

export type AuthErrorCode =
  | 'configuration'
  | 'invalid-credentials'
  | 'phone-already-registered'
  | 'rate-limited'
  | 'validation'
  | 'offline'
  | 'server'

export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}
