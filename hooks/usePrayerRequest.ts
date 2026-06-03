import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function usePrayerRequest() {
  const { profile } = useAuth()

  async function submitPrayerRequest(payload: {
    content: string
    is_anonymous: boolean
  }) {
    if (!profile?.id || !profile?.tenant_id) throw new Error('Usuário não autenticado.')

    const { error } = await (supabase as any)
      .from('prayer_requests')
      .insert({
        tenant_id: profile.tenant_id,
        profile_id: profile.id,
        member_id: profile.member_id ?? null,
        content: payload.content,
        is_anonymous: payload.is_anonymous,
        source: 'app',
      })

    if (error) throw error
  }

  return { submitPrayerRequest }
}
