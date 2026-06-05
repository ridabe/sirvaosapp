import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export type WorshipRole = {
  id: string
  name: string
  role_type: 'vocal' | 'instrument' | 'technical' | 'leadership' | 'other'
  sort_order: number
  is_active: boolean
}

export type WorshipEvent = {
  id: string
  title: string
  event_type: 'service' | 'rehearsal' | 'meeting' | 'other'
  starts_at: string
  ends_at: string | null
  location: string | null
  notes: string | null
  status: 'draft' | 'published' | 'completed' | 'cancelled'
  created_at: string
}

export type AdminWorshipAssignment = {
  id: string
  event_id: string
  member_id: string
  role_id: string | null
  role_name: string | null
  arrival_at: string | null
  status: 'pending' | 'confirmed' | 'declined' | 'standby'
  notes: string | null
  member_name: string
  member_email: string | null
  assigned_role: string | null
}

export type EligibleMember = {
  id: string
  name: string
  email: string | null
  phone: string | null
  ministry: string | null
}

const SCHEDULABLE_KEYWORDS = [
  'louvor', 'worship', 'dança', 'danca', 'mídia', 'midia', 'media',
  'som', 'áudio', 'audio', 'iluminação', 'iluminacao', 'luz',
  'transmissão', 'transmissao', 'stream', 'audiovisual', 'arte',
  'técnica', 'tecnica',
]

function isSchedulable(ministry: string | null): boolean {
  if (!ministry) return false
  const m = ministry.toLowerCase()
  return SCHEDULABLE_KEYWORDS.some(k => m.includes(k))
}

export type EventFormValues = {
  title: string
  event_type: WorshipEvent['event_type']
  starts_at: string
  ends_at: string
  location: string
  notes: string
  status: WorshipEvent['status']
}

export type AssignmentFormValues = {
  event_id: string
  member_id: string
  role_id: string
  role_name: string
  arrival_at: string
  notes: string
}

export function useWorshipAdmin() {
  const { profile } = useAuth()
  const [events, setEvents] = useState<WorshipEvent[]>([])
  const [roles, setRoles] = useState<WorshipRole[]>([])
  const [eligibleMembers, setEligibleMembers] = useState<EligibleMember[]>([])
  const [assignmentsByEvent, setAssignmentsByEvent] = useState<Record<string, AdminWorshipAssignment[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const tenantId = profile?.tenant_id

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    setError(null)
    try {
      const [eventsRes, rolesRes, membersRes] = await Promise.all([
        (supabase as any)
          .from('worship_events')
          .select('id, title, event_type, starts_at, ends_at, location, notes, status, created_at')
          .eq('tenant_id', tenantId)
          .order('starts_at', { ascending: false }),

        (supabase as any)
          .from('worship_roles')
          .select('id, name, role_type, sort_order, is_active')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),

        (supabase as any)
          .from('members')
          .select('id, name, email, phone, ministry')
          .eq('tenant_id', tenantId)
          .eq('status', 'active')
          .order('name', { ascending: true }),
      ])

      if (eventsRes.error) throw eventsRes.error
      if (rolesRes.error) throw rolesRes.error
      if (membersRes.error) throw membersRes.error

      setEvents(eventsRes.data ?? [])
      setRoles(rolesRes.data ?? [])
      setEligibleMembers(
        (membersRes.data ?? []).filter((m: any) => isSchedulable(m.ministry))
      )
    } catch {
      setError('Não foi possível carregar os dados.')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => { load() }, [load])

  async function loadAssignments(eventId: string): Promise<AdminWorshipAssignment[]> {
    const { data, error: err } = await (supabase as any)
      .from('worship_assignments')
      .select(`
        id, event_id, member_id, role_id, role_name, arrival_at, status, notes,
        members (name, email),
        worship_roles (name)
      `)
      .eq('event_id', eventId)

    if (err) return []

    const result: AdminWorshipAssignment[] = (data ?? []).map((row: any) => ({
      id: row.id,
      event_id: row.event_id,
      member_id: row.member_id,
      role_id: row.role_id,
      role_name: row.role_name,
      arrival_at: row.arrival_at,
      status: row.status,
      notes: row.notes,
      member_name: row.members?.name ?? '—',
      member_email: row.members?.email ?? null,
      assigned_role: row.worship_roles?.name ?? row.role_name ?? null,
    }))

    setAssignmentsByEvent(prev => ({ ...prev, [eventId]: result }))
    return result
  }

  async function createEvent(values: EventFormValues): Promise<{ ok: boolean; id?: string; error?: string }> {
    if (!tenantId || !profile?.id) return { ok: false, error: 'Sem sessão.' }
    const { data, error: err } = await (supabase as any)
      .from('worship_events')
      .insert({
        tenant_id: tenantId,
        created_by: profile.id,
        title: values.title.trim(),
        event_type: values.event_type,
        starts_at: new Date(values.starts_at).toISOString(),
        ends_at: values.ends_at ? new Date(values.ends_at).toISOString() : null,
        location: values.location.trim() || null,
        notes: values.notes.trim() || null,
        status: values.status,
      })
      .select('id')
      .single()

    if (err) return { ok: false, error: 'Não foi possível criar o evento.' }
    await load()
    return { ok: true, id: data.id }
  }

  async function updateEvent(id: string, values: EventFormValues): Promise<{ ok: boolean; error?: string }> {
    if (!tenantId) return { ok: false, error: 'Sem sessão.' }
    const { error: err } = await (supabase as any)
      .from('worship_events')
      .update({
        title: values.title.trim(),
        event_type: values.event_type,
        starts_at: new Date(values.starts_at).toISOString(),
        ends_at: values.ends_at ? new Date(values.ends_at).toISOString() : null,
        location: values.location.trim() || null,
        notes: values.notes.trim() || null,
        status: values.status,
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (err) return { ok: false, error: 'Não foi possível atualizar o evento.' }
    await load()
    return { ok: true }
  }

  async function deleteEvent(id: string): Promise<{ ok: boolean; error?: string }> {
    if (!tenantId) return { ok: false }
    const { error: err } = await (supabase as any)
      .from('worship_events')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (err) return { ok: false, error: 'Não foi possível excluir o evento.' }
    setEvents(prev => prev.filter(e => e.id !== id))
    return { ok: true }
  }

  async function createAssignment(values: AssignmentFormValues): Promise<{ ok: boolean; error?: string }> {
    if (!tenantId) return { ok: false, error: 'Sem sessão.' }

    const eligible = eligibleMembers.some(m => m.id === values.member_id)
    if (!eligible) return { ok: false, error: 'Membro não pertence a um ministério escalável.' }

    const { error: err } = await (supabase as any)
      .from('worship_assignments')
      .insert({
        tenant_id: tenantId,
        event_id: values.event_id,
        member_id: values.member_id,
        role_id: values.role_id || null,
        role_name: values.role_name.trim() || null,
        arrival_at: values.arrival_at ? new Date(values.arrival_at).toISOString() : null,
        notes: values.notes.trim() || null,
      })

    if (err) {
      if (err.code === '23505') return { ok: false, error: 'Este membro já está escalado para esta função neste evento.' }
      return { ok: false, error: 'Não foi possível adicionar à escala.' }
    }

    await loadAssignments(values.event_id)
    return { ok: true }
  }

  async function deleteAssignment(assignmentId: string, eventId: string): Promise<{ ok: boolean }> {
    const { error: err } = await (supabase as any)
      .from('worship_assignments')
      .delete()
      .eq('id', assignmentId)

    if (err) return { ok: false }
    await loadAssignments(eventId)
    return { ok: true }
  }

  return {
    events,
    roles,
    eligibleMembers,
    assignmentsByEvent,
    loading,
    error,
    refetch: load,
    loadAssignments,
    createEvent,
    updateEvent,
    deleteEvent,
    createAssignment,
    deleteAssignment,
  }
}
