import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { cacheGet, cacheSet, cacheGetStale } from '@/lib/cache'

// Valores idênticos ao web (MemberPortal statusMap)
export type PrayerRequestStatus = 'new' | 'assigned' | 'interceding' | 'done'

export type MyPrayerRequest = {
  id: string
  content: string
  status: PrayerRequestStatus
  created_at: string
}

export function useMyPrayerRequests() {
  const { profile } = useAuth()
  const [requests, setRequests] = useState<MyPrayerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    setError(null)
    const cacheKey = `my_prayer_requests:${profile.id}`

    const cached = await cacheGet<MyPrayerRequest[]>(cacheKey)
    if (cached) setRequests(cached)

    try {
      // RLS "Requester reads own requests": is_anonymous = false AND profile_id = auth.uid()
      // Pedidos anônimos são filtrados silenciosamente pelo banco
      const { data, error: err } = await (supabase as any)
        .from('prayer_requests')
        .select('id, content, status, created_at')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (err) throw err

      const list: MyPrayerRequest[] = (data ?? []).map((r: any) => ({
        id: r.id,
        content: r.content,
        status: r.status as PrayerRequestStatus,
        created_at: r.created_at,
      }))

      setRequests(list)
      await cacheSet(cacheKey, list)
    } catch {
      const stale = await cacheGetStale<MyPrayerRequest[]>(cacheKey)
      if (stale) {
        setRequests(stale)
        setError('offline')
      } else {
        setError('Não foi possível carregar seus pedidos.')
      }
    } finally {
      setLoading(false)
    }
  }, [profile?.id])

  useEffect(() => { fetch() }, [fetch])

  return { requests, loading, error, refetch: fetch }
}
