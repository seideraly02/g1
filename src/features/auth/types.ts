export interface RegistrationProfile {
  fullName: string
  city: string
  phone: string
}

export interface AuthenticatedUser extends RegistrationProfile {
  id: string
  verifiedAt: string
}

export interface CodeRequest {
  requestId: string
  expiresAt: string
  resendAfterSeconds: number
}

export interface VerifyCodeInput {
  requestId: string
  code: string
}

export type AuthErrorCode =
  | 'configuration'
  | 'invalid-code'
  | 'expired-code'
  | 'rate-limited'
  | 'telegram-not-linked'
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
