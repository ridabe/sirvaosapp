import { useState } from 'react'
import { signIn, signOut, firstAccessStart, firstAccessComplete, resetPassword } from '@/lib/auth'

type AuthError =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_FOUND'
  | 'FIRST_ACCESS_ACTIVE'
  | 'BIRTH_DATE_REQUIRED'
  | 'BIRTH_DATE_MISMATCH'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'

const ERROR_MESSAGES: Record<AuthError, string> = {
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  EMAIL_NOT_FOUND: 'Não encontramos esse e-mail. Verifique com a secretaria da igreja.',
  FIRST_ACCESS_ACTIVE: 'Você já possui acesso. Use a opção Entrar ou recupere sua senha.',
  BIRTH_DATE_REQUIRED: 'Informe sua data de nascimento para continuar.',
  BIRTH_DATE_MISMATCH: 'A data de nascimento não confere com o cadastro.',
  NETWORK_ERROR: 'Sem conexão. Verifique sua internet e tente novamente.',
  UNKNOWN: 'Algo deu errado. Tente novamente.',
}

function parseError(error: unknown): string {
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase()

  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) return ERROR_MESSAGES.INVALID_CREDENTIALS
  if (msg.includes('email not found') || msg.includes('member not found') || msg.includes('no member')) return ERROR_MESSAGES.EMAIL_NOT_FOUND
  if (msg.includes('profile already active') || msg.includes('already active') || msg.includes('already exists')) return ERROR_MESSAGES.FIRST_ACCESS_ACTIVE
  if (msg.includes('birth_date required') || msg.includes('birth date required')) return ERROR_MESSAGES.BIRTH_DATE_REQUIRED
  if (msg.includes('birth_date mismatch') || msg.includes('birth date mismatch') || msg.includes('data de nascimento')) return ERROR_MESSAGES.BIRTH_DATE_MISMATCH
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')) return ERROR_MESSAGES.NETWORK_ERROR

  // Mostra a mensagem original se vier em português (vinda da Edge Function)
  const original = error instanceof Error ? error.message : String(error)
  if (original.length > 0 && original.length < 200) return original

  return ERROR_MESSAGES.UNKNOWN
}

export function useSignIn() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function execute(email: string, password: string) {
    setLoading(true)
    setError(null)
    try {
      await signIn(email, password)
    } catch (e) {
      setError(parseError(e))
    } finally {
      setLoading(false)
    }
  }

  return { execute, loading, error, clearError: () => setError(null) }
}

export function useSignOut() {
  const [loading, setLoading] = useState(false)

  async function execute() {
    setLoading(true)
    try { await signOut() } finally { setLoading(false) }
  }

  return { execute, loading }
}

export function useFirstAccess() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start(email: string, birthDate?: string) {
    setLoading(true)
    setError(null)
    try {
      return await firstAccessStart(email, birthDate)
    } catch (e) {
      setError(parseError(e))
      return null
    } finally {
      setLoading(false)
    }
  }

  async function complete(email: string, token: string, password: string, birthDate?: string) {
    setLoading(true)
    setError(null)
    try {
      return await firstAccessComplete({ email, token, password, birthDate })
    } catch (e) {
      setError(parseError(e))
      return null
    } finally {
      setLoading(false)
    }
  }

  return { start, complete, loading, error, clearError: () => setError(null) }
}

export function useResetPassword() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function execute(email: string) {
    setLoading(true)
    setError(null)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (e) {
      setError(parseError(e))
    } finally {
      setLoading(false)
    }
  }

  return { execute, loading, sent, error, clearError: () => setError(null) }
}
