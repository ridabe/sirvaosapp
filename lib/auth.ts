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

// Chama a Edge Function first-access (mesma usada pelo portal web)
export async function firstAccessStart(email: string) {
  const { data, error } = await supabase.functions.invoke('first-access', {
    body: { action: 'start', email: email.toLowerCase().trim() },
  })
  if (error) throw error
  return data as { requiresBirthDate: boolean; token?: string }
}

export async function firstAccessComplete(params: {
  token: string
  password: string
  birthDate?: string
}) {
  const { data, error } = await supabase.functions.invoke('first-access', {
    body: { action: 'complete', ...params },
  })
  if (error) throw error
  return data
}
