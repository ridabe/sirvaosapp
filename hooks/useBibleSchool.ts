import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export type BibleSchoolMaterial = {
  id: string
  title: string
  kind: string
  url: string | null
  content: string | null
  created_at: string
}

export type BibleSchoolSession = {
  id: string
  session_date: string
  topic: string | null
  attended: boolean | null // null = não registrado
}

export type BibleSchoolEnrollment = {
  id: string
  enrolled_at: string
  status: string
  class: {
    id: string
    name: string
    description: string | null
    starts_at: string | null
    ends_at: string | null
    is_active: boolean
  }
  sessions: BibleSchoolSession[]
  materials: BibleSchoolMaterial[]
  attendanceRate: number // 0-100
}

export function useBibleSchool() {
  const { member } = useAuth()
  const [enrollments, setEnrollments] = useState<BibleSchoolEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!member?.id) return
    setLoading(true)
    setError(null)
    try {
      // Busca o student_id pelo member_id
      const { data: studentData } = await (supabase as any)
        .from('bible_school_students')
        .select('id')
        .eq('member_id', member.id)
        .single()

      if (!studentData) { setEnrollments([]); setLoading(false); return }

      const studentId = studentData.id

      // Busca matrículas com a turma
      const { data: enrollData, error: eErr } = await (supabase as any)
        .from('bible_school_enrollments')
        .select(`
          id, enrolled_at, status,
          bible_school_classes!class_id (id, name, description, starts_at, ends_at, is_active)
        `)
        .eq('student_id', studentId)
        .order('enrolled_at', { ascending: false })

      if (eErr) throw eErr

      // Para cada matrícula busca sessões + materiais + frequência
      const enriched = await Promise.all(
        (enrollData ?? []).map(async (row: any) => {
          const classId = row.bible_school_classes?.id
          if (!classId) return null

          const [sessionsRes, materialsRes, attendanceRes] = await Promise.all([
            (supabase as any)
              .from('bible_school_sessions')
              .select('id, session_date, topic')
              .eq('class_id', classId)
              .order('session_date', { ascending: false })
              .limit(10),
            (supabase as any)
              .from('bible_school_materials')
              .select('id, title, kind, url, content, created_at')
              .eq('class_id', classId)
              .order('created_at', { ascending: false }),
            (supabase as any)
              .from('bible_school_attendance')
              .select('session_id, status')
              .eq('enrollment_id', row.id),
          ])

          const attendanceMap = new Map(
            (attendanceRes.data ?? []).map((a: any) => [a.session_id, a.status])
          )

          const sessions: BibleSchoolSession[] = (sessionsRes.data ?? []).map((s: any) => ({
            id: s.id,
            session_date: s.session_date,
            topic: s.topic,
            attended: attendanceMap.has(s.id) ? attendanceMap.get(s.id) === 'present' : null,
          }))

          const attended = sessions.filter(s => s.attended === true).length
          const recorded = sessions.filter(s => s.attended !== null).length
          const attendanceRate = recorded > 0 ? Math.round((attended / recorded) * 100) : 0

          return {
            id: row.id,
            enrolled_at: row.enrolled_at,
            status: row.status,
            class: row.bible_school_classes,
            sessions,
            materials: materialsRes.data ?? [],
            attendanceRate,
          } as BibleSchoolEnrollment
        })
      )

      setEnrollments(enriched.filter(Boolean) as BibleSchoolEnrollment[])
    } catch {
      setError('Não foi possível carregar os dados da Escola Bíblica.')
    } finally {
      setLoading(false)
    }
  }, [member?.id])

  useEffect(() => { fetch() }, [fetch])

  return { enrollments, loading, error, refetch: fetch }
}
