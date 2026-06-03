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

export function useKids() {
  const { member } = useAuth()
  const [children, setChildren] = useState<KidsChild[]>([])
  const [communications, setCommunications] = useState<KidsCommunication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!member?.id) return
    setLoading(true)
    setError(null)
    const cacheKey = `kids:${member.id}`

    const cached = await cacheGet<{ children: KidsChild[]; communications: KidsCommunication[] }>(cacheKey)
    if (cached) { setChildren(cached.children); setCommunications(cached.communications) }

    try {
      // Busca filhos via kids_guardians → kids_children
      const { data: guardianRows, error: gErr } = await (supabase as any)
        .from('kids_guardians')
        .select('child_id')
        .eq('member_id', member.id)

      if (gErr) throw gErr

      const childIds: string[] = (guardianRows ?? []).map((r: any) => r.child_id)

      if (childIds.length === 0) {
        setChildren([])
        setCommunications([])
        setLoading(false)
        return
      }

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

      // Conta frequência por filho (últimas 12 semanas)
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

      setChildren(
        (childrenRes.data ?? []).map((c: any) => ({
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
      )
      const comms = commsRes.data ?? []
      setCommunications(comms)
      await cacheSet(cacheKey, { children: (childrenRes.data ?? []).map((c: any) => ({
        id: c.id, name: c.name, date_of_birth: c.date_of_birth, allergies: c.allergies,
        special_needs: c.special_needs, notes: c.notes, is_active: c.is_active,
        group: c.kids_groups ?? null, attendanceCount: attendanceCounts[c.id] ?? 0,
      })), communications: comms })
    } catch {
      const stale = await cacheGetStale<{ children: KidsChild[]; communications: KidsCommunication[] }>(cacheKey)
      if (stale) {
        setChildren(stale.children)
        setCommunications(stale.communications)
        setError('Sem conexão — exibindo dados salvos.')
      } else {
        setError('Não foi possível carregar os dados do Kids.')
      }
    } finally {
      setLoading(false)
    }
  }, [member?.id])

  useEffect(() => { fetch() }, [fetch])

  return { children, communications, loading, error, refetch: fetch }
}
