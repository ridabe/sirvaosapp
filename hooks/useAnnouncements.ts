import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type Announcement = {
  id: string
  title: string
  message: string
  published_at: string
  expires_at: string | null
}

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  async function fetchAnnouncements() {
    setLoading(true)
    setError(null)
    try {
      const now = new Date().toISOString()
      const { data, error: err } = await supabase
        .from('tenant_announcements')
        .select('id, title, message, published_at, expires_at')
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('published_at', { ascending: false })
        .limit(3)

      if (err) throw err
      setAnnouncements(data ?? [])
    } catch {
      setError('offline')
    } finally {
      setLoading(false)
    }
  }

  return { announcements, loading, error, refetch: fetchAnnouncements }
}
