import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { cacheGet, cacheSet, cacheGetStale } from '@/lib/cache'

// Valores idênticos ao banco e ao web
export type AssignmentStatus = 'pending' | 'interceding' | 'done'
export type PrayerRequestStatus = 'new' | 'assigned' | 'interceding' | 'done'

export type PrayerAssignment = {
  id: string
  prayer_request_id: string
  status: AssignmentStatus
  assigned_at: string
  started_at: string | null
  completed_at: string | null
  // Null quando status = 'done' — RLS bloqueia leitura por privacidade
  prayer_requests: {
    id: string
    content: string
    is_anonymous: boolean
    member_id: string | null
    profile_id: string | null
  } | null
}

export type MyPrayerRequest = {
  id: string
  content: string
  // RLS "Requester reads own requests" só retorna is_anonymous = false
  is_anonymous: false
  status: PrayerRequestStatus
  created_at: string
}

export function useIntercession() {
  const { profile } = useAuth()

  const [assignments, setAssignments] = useState<PrayerAssignment[]>([])
  const [myRequests, setMyRequests] = useState<MyPrayerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    setError(null)
    const cacheKey = `intercession:${profile.id}`

    const cached = await cacheGet<{
      assignments: PrayerAssignment[]
      myRequests: MyPrayerRequest[]
    }>(cacheKey)
    if (cached) {
      setAssignments(cached.assignments)
      setMyRequests(cached.myRequests)
    }

    try {
      const [assignmentsRes, requestsRes] = await Promise.all([
        // Apenas designações ativas (pending + interceding) — igual ao web
        // Quando 'done', desaparece da lista (o intercessor conclui e a tarefa some)
        (supabase as any)
          .from('prayer_assignments')
          .select('id, prayer_request_id, status, assigned_at, started_at, completed_at, prayer_requests(id, content, is_anonymous, member_id, profile_id)')
          .eq('assigned_member_id', profile.member_id)
          .in('status', ['pending', 'interceding'])
          .order('assigned_at', { ascending: false }),

        // Pedidos enviados pelo usuário — RLS filtra is_anonymous = false automaticamente
        (supabase as any)
          .from('prayer_requests')
          .select('id, content, is_anonymous, status, created_at')
          .eq('profile_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      const assignmentList: PrayerAssignment[] = (assignmentsRes.data ?? []).map((row: any) => ({
        id: row.id,
        prayer_request_id: row.prayer_request_id,
        status: row.status as AssignmentStatus,
        assigned_at: row.assigned_at,
        started_at: row.started_at,
        completed_at: row.completed_at,
        prayer_requests: row.prayer_requests ?? null,
      }))

      const requestList: MyPrayerRequest[] = (requestsRes.data ?? []).map((r: any) => ({
        id: r.id,
        content: r.content,
        is_anonymous: r.is_anonymous,
        status: r.status as PrayerRequestStatus,
        created_at: r.created_at,
      }))

      setAssignments(assignmentList)
      setMyRequests(requestList)
      await cacheSet(cacheKey, { assignments: assignmentList, myRequests: requestList })
    } catch {
      const stale = await cacheGetStale<{
        assignments: PrayerAssignment[]
        myRequests: MyPrayerRequest[]
      }>(cacheKey)
      if (stale) {
        setAssignments(stale.assignments)
        setMyRequests(stale.myRequests)
        setError('Sem conexão — exibindo dados salvos.')
      } else {
        setError('Não foi possível carregar os dados.')
      }
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.member_id])

  useEffect(() => { fetch() }, [fetch])

  // Intercessor inicia oração — replica exatamente o web (MemberPortal handleAssignmentAction)
  async function markInterceding(assignment: PrayerAssignment) {
    // 1. Atualiza prayer_assignments.status (RLS permite para o intercessor)
    const { error: assignErr } = await (supabase as any)
      .from('prayer_assignments')
      .update({ status: 'interceding', started_at: new Date().toISOString() })
      .eq('id', assignment.id)

    if (assignErr) throw assignErr

    // 2. Tenta atualizar prayer_requests.status (pode falhar silenciosamente se não for admin)
    await (supabase as any)
      .from('prayer_requests')
      .update({ status: 'interceding' })
      .eq('id', assignment.prayer_request_id)

    // 3. Notifica o solicitante via push (se não for anônimo e tiver profile_id)
    const req = assignment.prayer_requests
    if (req && !req.is_anonymous && req.profile_id) {
      await (supabase as any).functions.invoke('send-push', {
        body: {
          profile_ids: [req.profile_id],
          title: 'Pedido de oração',
          body: 'Estão orando pelo seu pedido neste momento.',
          module_code: 'intercession',
          data: { tab: 'intercession' },
        },
      })
      // Erros de autorização (403) são ignorados — idêntico ao comportamento do web
    }

    // 4. Atualiza estado local
    setAssignments(prev => prev.map(a =>
      a.id === assignment.id
        ? { ...a, status: 'interceding' as AssignmentStatus, started_at: new Date().toISOString() }
        : a
    ))
  }

  // Intercessor conclui oração — remove da lista após confirmar (igual ao web)
  async function markDone(assignment: PrayerAssignment) {
    // 1. Atualiza prayer_assignments.status
    const { error: assignErr } = await (supabase as any)
      .from('prayer_assignments')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', assignment.id)

    if (assignErr) throw assignErr

    // 2. Tenta atualizar prayer_requests.status (pode falhar silenciosamente)
    await (supabase as any)
      .from('prayer_requests')
      .update({ status: 'done' })
      .eq('id', assignment.prayer_request_id)

    // 3. Notifica o solicitante via push
    const req = assignment.prayer_requests
    if (req && !req.is_anonymous && req.profile_id) {
      await (supabase as any).functions.invoke('send-push', {
        body: {
          profile_ids: [req.profile_id],
          title: 'Pedido de oração',
          body: 'Oramos pelo seu pedido. Deus seja glorificado!',
          module_code: 'intercession',
          data: { tab: 'intercession' },
        },
      })
    }

    // 4. Remove da lista local (status 'done' sai da query — igual ao web)
    setAssignments(prev => prev.filter(a => a.id !== assignment.id))
  }

  return {
    assignments,
    myRequests,
    loading,
    error,
    refetch: fetch,
    markInterceding,
    markDone,
  }
}
