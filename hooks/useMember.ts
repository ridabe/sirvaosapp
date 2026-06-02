import { useAuth } from '@/context/AuthContext'

export type Profile = {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  tenant_id: string | null
  member_id: string | null
  tenant_role: string | null
}

export type MemberRecord = {
  id: string
  name: string
  phone: string | null
  status: string | null
  date_of_birth: string | null
  created_at: string
}

export function useMember() {
  const { profile, member, profileLoading: loading, refetchProfile: refetch } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] ?? null
  return { profile, member, firstName, loading, refetch }
}
