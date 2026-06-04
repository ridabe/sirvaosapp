import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile, MemberRecord } from '@/hooks/useMember'

type AuthContextType = {
  session: Session | null
  loading: boolean
  profile: Profile | null
  member: MemberRecord | null
  profileLoading: boolean
  refetchProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  profile: null,
  member: null,
  profileLoading: true,
  refetchProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [member, setMember] = useState<MemberRecord | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const fetchProfile = useCallback(async (userId?: string) => {
    const uid = userId ?? (await supabase.auth.getUser()).data.user?.id
    if (!uid) { setProfileLoading(false); return }

    setProfileLoading(true)
    const { data: profileData } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, email, avatar_url, tenant_id, member_id, tenant_role')
      .eq('id', uid)
      .single()

    setProfile(profileData)

    if (profileData?.member_id) {
      const { data: memberData } = await (supabase as any)
        .from('members')
        .select('id, name, phone, status, date_of_birth, created_at')
        .eq('id', profileData.member_id)
        .single()
      setMember(memberData)
    } else {
      setMember(null)
    }

    setProfileLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        // Token inválido/revogado — limpa a sessão corrompida e redireciona para login
        supabase.auth.signOut().finally(() => {
          setLoading(false)
          setProfileLoading(false)
        })
        return
      }
      setSession(data.session)
      setLoading(false)
      if (data.session?.user) fetchProfile(data.session.user.id)
      else setProfileLoading(false)
    }).catch(() => {
      supabase.auth.signOut().finally(() => {
        setLoading(false)
        setProfileLoading(false)
      })
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, sess) => {
      // TOKEN_REFRESHED com sessão nula = refresh token inválido
      if (event === 'TOKEN_REFRESHED' && !sess) {
        supabase.auth.signOut()
        return
      }
      setSession(sess)
      if (sess?.user) fetchProfile(sess.user.id)
      else { setProfile(null); setMember(null); setProfileLoading(false) }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading, profile, member, profileLoading, refetchProfile: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
