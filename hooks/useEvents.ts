import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type TenantEvent = {
  id: string
  title: string
  description: string | null
  location: string | null
  event_date: string
  ends_at: string | null
  event_type: string
  color: string
  cover_image_url: string | null
}

export function useEvents() {
  const [events, setEvents] = useState<TenantEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('tenant_events')
        .select('id, title, description, location, event_date, ends_at, event_type, color, cover_image_url')
        .eq('status', 'publicado')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(5)

      if (err) throw err
      setEvents(data ?? [])
    } catch {
      setError('offline')
    } finally {
      setLoading(false)
    }
  }

  return { events, loading, error, refetch: fetchEvents }
}
