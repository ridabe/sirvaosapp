import { supabase } from './supabase'

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.toLowerCase().trim(),
    { redirectTo: 'sirvaosapp://reset-password' }
  )
  if (error) throw error
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

// Extrai a mensagem de erro do corpo da resposta da Edge Function
async function extractFunctionError(error: unknown): Promise<Error> {
  try {
    const ctx = (error as { context?: Response }).context
    if (ctx) {
      const body = await ctx.json()
      const msg = body?.error || body?.message || body?.msg
      if (msg) return new Error(String(msg))
    }
  } catch {
    // ignora erro ao parsear body
  }
  return error instanceof Error ? error : new Error(String(error))
}

// Chama a Edge Function first-access (mesma usada pelo portal web)
export async function firstAccessStart(email: string, birthDate?: string) {
  const body: Record<string, string> = { action: 'start', email: email.toLowerCase().trim() }
  if (birthDate) body.birth_date = birthDate
  const { data, error } = await supabase.functions.invoke('first-access', { body })
  if (error) throw await extractFunctionError(error)
  return data as { requiresBirthDate: boolean; token?: string }
}

export async function firstAccessComplete(params: {
  email: string
  token: string
  password: string
  birthDate?: string
}) {
  const body: Record<string, string> = {
    action: 'complete',
    email: params.email.toLowerCase().trim(),
    token: params.token,
    password: params.password,
  }
  if (params.birthDate) body.birth_date = params.birthDate
  const { data, error } = await supabase.functions.invoke('first-access', { body })
  if (error) throw await extractFunctionError(error)
  return data
}
