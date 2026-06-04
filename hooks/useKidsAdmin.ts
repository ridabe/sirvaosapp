import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { KidsChild } from './useKids'

export type KidsGroup = {
  id: string
  name: string
  color: string | null
  childCount: number
}

export function useKidsAdmin() {
  const { profile } = useAuth()
  const [allChildren, setAllChildren] = useState<KidsChild[]>([])
  const [groups, setGroups] = useState<KidsGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!profile?.tenant_id) return
    setLoading(true)
    setError(null)
    try {
      const [childrenRes, groupsRes] = await Promise.all([
        (supabase as any)
          .from('kids_children')
          .select('id, name, date_of_birth, allergies, special_needs, notes, is_active, group_id, kids_groups!group_id(id, name, color)')
          .eq('tenant_id', profile.tenant_id)
          .order('name'),
        (supabase as any)
          .from('kids_groups')
          .select('id, name, color')
          .eq('tenant_id', profile.tenant_id)
          .order('name'),
      ])

      if (childrenRes.error) throw childrenRes.error
      if (groupsRes.error) throw groupsRes.error

      const children: KidsChild[] = (childrenRes.data ?? []).map((c: any) => ({
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

      const countByGroup: Record<string, number> = {}
      children.forEach(c => {
        if (c.group?.id) countByGroup[c.group.id] = (countByGroup[c.group.id] ?? 0) + 1
      })

      const grps: KidsGroup[] = (groupsRes.data ?? []).map((g: any) => ({
        id: g.id,
        name: g.name,
        color: g.color,
        childCount: countByGroup[g.id] ?? 0,
      }))

      setAllChildren(children)
      setGroups(grps)
    } catch {
      setError('Não foi possível carregar os dados.')
    } finally {
      setLoading(false)
    }
  }, [profile?.tenant_id])

  useEffect(() => { fetch() }, [fetch])

  async function createChild(data: {
    name: string
    date_of_birth?: string | null
    group_id?: string | null
    allergies?: string | null
    special_needs?: string | null
  }) {
    if (!profile?.tenant_id) throw new Error('Sem tenant')
    const { error: err } = await (supabase as any)
      .from('kids_children')
      .insert({
        tenant_id: profile.tenant_id,
        name: data.name.trim(),
        date_of_birth: data.date_of_birth || null,
        group_id: data.group_id || null,
        allergies: data.allergies?.trim() || null,
        special_needs: data.special_needs?.trim() || null,
        is_active: true,
      })
    if (err) throw err
    await fetch()
  }

  async function createGroup(name: string, color: string) {
    if (!profile?.tenant_id) throw new Error('Sem tenant')
    const { error: err } = await (supabase as any)
      .from('kids_groups')
      .insert({ tenant_id: profile.tenant_id, name: name.trim(), color })
    if (err) throw err
    await fetch()
  }

  async function getAttendanceForDate(date: string): Promise<Set<string>> {
    if (!profile?.tenant_id || allChildren.length === 0) return new Set()
    const childIds = allChildren.filter(c => c.is_active).map(c => c.id)
    const { data } = await (supabase as any)
      .from('kids_attendance')
      .select('child_id')
      .in('child_id', childIds)
      .eq('attendance_date', date)
    return new Set((data ?? []).map((r: any) => r.child_id as string))
  }

  async function saveAttendance(date: string, presentIds: string[]) {
    if (!profile?.tenant_id) throw new Error('Sem tenant')
    const activeIds = allChildren.filter(c => c.is_active).map(c => c.id)

    // Remove registros existentes para essa data neste tenant
    await (supabase as any)
      .from('kids_attendance')
      .delete()
      .in('child_id', activeIds)
      .eq('attendance_date', date)

    if (presentIds.length > 0) {
      const rows = presentIds.map(child_id => ({ child_id, attendance_date: date }))
      const { error: err } = await (supabase as any).from('kids_attendance').insert(rows)
      if (err) throw err
    }
  }

  return {
    allChildren,
    groups,
    loading,
    error,
    refetch: fetch,
    createChild,
    createGroup,
    getAttendanceForDate,
    saveAttendance,
  }
}
