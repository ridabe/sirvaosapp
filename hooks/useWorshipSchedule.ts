import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { cacheGet, cacheSet, cacheGetStale } from '@/lib/cache'

export type AssignmentStatus = 'pending' | 'confirmed' | 'declined'

export type WorshipAssignment = {
  id: string
  status: AssignmentStatus
  role_name: string | null
  arrival_at: string | null
  decline_reason: string | null
  notes: string | null
  viewed_at: string | null
  responded_at: string | null
  event: {
    id: string
    title: string
    event_type: string
    starts_at: string
    ends_at: string | null
    location: string | null
    notes: string | null
    status: string
  }
}

export function useWorshipSchedule() {
  const { member } = useAuth()
  const [upcoming, setUpcoming] = useState<WorshipAssignment[]>([])
  const [past, setPast] = useState<WorshipAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!member?.id) return
    setLoading(true)
    setError(null)
    const cacheKey = `worship:${member.id}`

    const cached = await cacheGet<{ upcoming: WorshipAssignment[]; past: WorshipAssignment[] }>(cacheKey)
    if (cached) { setUpcoming(cached.upcoming); setPast(cached.past) }

    try {
      const now = new Date().toISOString()

      const { data, error: err } = await (supabase as any)
        .from('worship_assignments')
        .select(`
          id, status, role_name, arrival_at, decline_reason, notes, viewed_at, responded_at,
          worship_events!event_id (id, title, event_type, starts_at, ends_at, location, notes, status)
        `)
        .eq('member_id', member.id)
        .order('worship_events(starts_at)', { ascending: true })

      if (err) throw err

      const all: WorshipAssignment[] = (data ?? [])
        .filter((row: any) => row.worship_events)
        .map((row: any) => ({
          id: row.id,
          status: row.status as AssignmentStatus,
          role_name: row.role_name,
          arrival_at: row.arrival_at,
          decline_reason: row.decline_reason,
          notes: row.notes,
          viewed_at: row.viewed_at,
          responded_at: row.responded_at,
          event: row.worship_events,
        }))

      const upcoming = all.filter(a => a.event.starts_at >= now)
      const past = all.filter(a => a.event.starts_at < now).reverse()
      setUpcoming(upcoming)
      setPast(past)
      await cacheSet(cacheKey, { upcoming, past })
    } catch {
      const stale = await cacheGetStale<{ upcoming: WorshipAssignment[]; past: WorshipAssignment[] }>(cacheKey)
      if (stale) {
        setUpcoming(stale.upcoming)
        setPast(stale.past)
        setError('Sem conexão — exibindo dados salvos.')
      } else {
        setError('Não foi possível carregar suas escalas.')
      }
    } finally {
      setLoading(false)
    }
  }, [member?.id])

  useEffect(() => { fetch() }, [fetch])

  async function markViewed(assignmentId: string) {
    if (!(await (supabase as any)
      .from('worship_assignments')
      .select('viewed_at').eq('id', assignmentId).single()
    ).data?.viewed_at) {
      await (supabase as any)
        .from('worship_assignments')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', assignmentId)
    }
  }

  async function respond(assignmentId: string, status: 'confirmed' | 'declined', declineReason?: string) {
    const { error: err } = await (supabase as any)
      .from('worship_assignments')
      .update({
        status,
        responded_at: new Date().toISOString(),
        decline_reason: declineReason ?? null,
      })
      .eq('id', assignmentId)

    if (err) throw err

    // Atualiza localmente
    const patch = (a: WorshipAssignment) =>
      a.id === assignmentId
        ? { ...a, status, responded_at: new Date().toISOString(), decline_reason: declineReason ?? null }
        : a

    setUpcoming(prev => prev.map(patch))
    setPast(prev => prev.map(patch))
  }

  return { upcoming, past, loading, error, refetch: fetch, markViewed, respond }
}
