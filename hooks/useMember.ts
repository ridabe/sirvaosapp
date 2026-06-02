import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Profile = {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  tenant_id: string | null
  member_id: string | null
  tenant_role: string | null
}

export function useMember() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, tenant_id, member_id, tenant_role')
      .eq('id', user.id)
      .single()

    setProfile(data)
    setLoading(false)
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? null

  return { profile, firstName, loading, refetch: fetchProfile }
}
