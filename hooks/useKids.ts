import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { cacheGet, cacheSet, cacheGetStale } from '@/lib/cache'

export type KidsChild = {
  id: string
  name: string
  date_of_birth: string | null
  allergies: string | null
  special_needs: string | null
  notes: string | null
  is_active: boolean
  group: { id: string; name: string; color: string | null } | null
  attendanceCount: number
}

export type KidsCommunication = {
  id: string
  title: string
  message: string
  sent_at: string
  child_id: string | null
}

type CacheShape = {
  children: KidsChild[]
  allChildren: KidsChild[]
  communications: KidsCommunication[]
  isAdmin: boolean
}

// Charset sem caracteres ambíguos (sem 0/O, 1/I/L)
const TOKEN_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function randomToken(): string {
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += TOKEN_CHARS[Math.floor(Math.random() * TOKEN_CHARS.length)]
  }
  return result
}

export function useKids() {
  const { member, profile } = useAuth()
  const [children, setChildren] = useState<KidsChild[]>([])
  const [allChildren, setAllChildren] = useState<KidsChild[]>([])
  const [communications, setCommunications] = useState<KidsCommunication[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!member?.id) return
    setLoading(true)
    setError(null)
    const cacheKey = `kids:${member.id}`

    const cached = await cacheGet<CacheShape>(cacheKey)
    if (cached) {
      setChildren(cached.children)
      setAllChildren(cached.allChildren ?? [])
      setCommunications(cached.communications)
      setIsAdmin(cached.isAdmin ?? false)
    }

    try {
      // Detecta se o usuário é admin do módulo Kids
      const { data: adminRows } = await (supabase as any)
        .from('tenant_module_admins')
        .select('module_id, platform_modules!module_id(code)')
        .eq('member_id', member.id)

      const admin = (adminRows ?? []).some((r: any) => r.platform_modules?.code === 'kids')
      setIsAdmin(admin)

      // Busca filhos vinculados ao usuário via kids_guardians OU kids_children.member_id
      const [guardianRes, directRes] = await Promise.all([
        (supabase as any)
          .from('kids_guardians')
          .select('child_id')
          .eq('member_id', member.id),
        (supabase as any)
          .from('kids_children')
          .select('id')
          .eq('member_id', member.id),
      ])

      if (guardianRes.error) throw guardianRes.error

      const childIds: string[] = [
        ...new Set([
          ...(guardianRes.data ?? []).map((r: any) => r.child_id),
          ...(directRes.data ?? []).map((r: any) => r.id),
        ]),
      ]

      let myChildren: KidsChild[] = []
      let comms: KidsCommunication[] = []

      if (childIds.length > 0) {
        const [childrenRes, commsRes] = await Promise.all([
          (supabase as any)
            .from('kids_children')
            .select('id, name, date_of_birth, allergies, special_needs, notes, is_active, group_id, kids_groups!group_id(id, name, color)')
            .in('id', childIds),
          (supabase as any)
            .from('kids_communications')
            .select('id, title, message, sent_at, child_id')
            .or(`child_id.in.(${childIds.join(',')}),child_id.is.null`)
            .order('sent_at', { ascending: false })
            .limit(20),
        ])

        if (childrenRes.error) throw childrenRes.error

        const twelveWeeksAgo = new Date()
        twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)

        const attendanceCounts: Record<string, number> = {}
        await Promise.all(
          childIds.map(async (cid: string) => {
            const { count } = await (supabase as any)
              .from('kids_attendance')
              .select('id', { count: 'exact', head: true })
              .eq('child_id', cid)
              .gte('attendance_date', twelveWeeksAgo.toISOString().split('T')[0])
            attendanceCounts[cid] = count ?? 0
          })
        )

        myChildren = (childrenRes.data ?? []).map((c: any) => ({
          id: c.id,
          name: c.name,
          date_of_birth: c.date_of_birth,
          allergies: c.allergies,
          special_needs: c.special_needs,
          notes: c.notes,
          is_active: c.is_active,
          group: c.kids_groups ?? null,
          attendanceCount: attendanceCounts[c.id] ?? 0,
        }))
        comms = commsRes.data ?? []
      }

      setChildren(myChildren)
      setCommunications(comms)

      // Admin: busca todas as crianças do tenant
      let adminChildren: KidsChild[] = []
      if (admin && profile?.tenant_id) {
        const { data: allKidsData } = await (supabase as any)
          .from('kids_children')
          .select('id, name, date_of_birth, allergies, special_needs, notes, is_active, group_id, kids_groups!group_id(id, name, color)')
          .eq('tenant_id', profile.tenant_id)
          .order('name')

        adminChildren = (allKidsData ?? []).map((c: any) => ({
          id: c.id,
          name: c.name,
          date_of_birth: c.date_of_birth,
          allergies: c.allergies,
          special_needs: c.special_needs,
          notes: c.notes,
          is_active: c.is_active,
          group: c.kids_groups ?? null,
          attendanceCount: 0,
        }))
      }

      setAllChildren(adminChildren)

      await cacheSet(cacheKey, {
        children: myChildren,
        allChildren: adminChildren,
        communications: comms,
        isAdmin: admin,
      })
    } catch {
      const stale = await cacheGetStale<CacheShape>(cacheKey)
      if (stale) {
        setChildren(stale.children)
        setAllChildren(stale.allChildren ?? [])
        setCommunications(stale.communications)
        setIsAdmin(stale.isAdmin ?? false)
        setError('Sem conexão — exibindo dados salvos.')
      } else {
        setError('Não foi possível carregar os dados do Kids.')
      }
    } finally {
      setLoading(false)
    }
  }, [member?.id, profile?.tenant_id])

  useEffect(() => { fetch() }, [fetch])

  const generatePass = useCallback(async (childId: string): Promise<string | null> => {
    if (!member?.id || !profile?.tenant_id) return null
    try {
      // Reutiliza passe existente ainda válido e não utilizado
      const { data: existing } = await (supabase as any)
        .from('kids_checkin_passes')
        .select('pass_token')
        .eq('child_id', childId)
        .eq('guardian_member_id', member.id)
        .is('used_at', null)
        .gt('valid_until', new Date().toISOString())
        .order('valid_until', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing?.pass_token) return existing.pass_token

      // Cria novo passe com validade de 10 anos (passe genérico/permanente)
      const validUntil = new Date()
      validUntil.setFullYear(validUntil.getFullYear() + 10)

      const token = randomToken()
      const { data, error: insertErr } = await (supabase as any)
        .from('kids_checkin_passes')
        .insert({
          tenant_id: profile.tenant_id,
          child_id: childId,
          guardian_member_id: member.id,
          pass_token: token,
          valid_until: validUntil.toISOString(),
        })
        .select('pass_token')
        .single()

      if (insertErr) throw insertErr
      return data?.pass_token ?? null
    } catch {
      return null
    }
  }, [member?.id, profile?.tenant_id])

  return { children, allChildren, communications, isAdmin, loading, error, refetch: fetch, generatePass }
}
