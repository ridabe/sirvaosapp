import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export type CatalogSong = {
  id: string
  tenant_id: string | null
  title: string
  artist: string
  genre: string
  source: 'seed' | 'manual' | 'cifraclub'
  cifraclub_url: string | null
  youtube_url: string | null
}

export type RepertoireItem = {
  id: string | null
  song: CatalogSong
  position: number
  key: string
  notes: string
}

export type MusicSearchResult = {
  id: string
  title: string
  artist: string
  album: string
  artworkUrl: string | null
}

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function buildCifraClubUrl(artist: string, title: string): string {
  return `https://www.cifraclub.com.br/${createSlug(artist)}/${createSlug(title)}/`
}

function buildYouTubeUrl(artist: string, title: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${title}`)}`
}

export async function searchMusicItunes(query: string): Promise<MusicSearchResult[]> {
  const q = query.trim()
  if (!q) return []
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=15&country=BR`,
      { headers: { Accept: 'application/json' } }
    )
    if (!res.ok) return []
    const json = await res.json() as { results?: any[] }
    const seen = new Set<string>()
    const results: MusicSearchResult[] = []
    for (const item of json.results ?? []) {
      const artist = String(item.artistName ?? '').trim()
      const title = String(item.trackName ?? '').trim()
      const album = String(item.collectionName ?? '').trim()
      const artworkUrl = String(item.artworkUrl60 ?? '').trim() || null
      if (!artist || !title) continue
      const key = `${artist}::${title}`.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      results.push({ id: key, title, artist, album, artworkUrl })
    }
    return results
  } catch {
    return []
  }
}

export function useWorshipRepertoire() {
  const { profile } = useAuth()
  const [catalogSongs, setCatalogSongs] = useState<CatalogSong[]>([])
  const [repertoire, setRepertoire] = useState<RepertoireItem[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [repertoireLoading, setRepertoireLoading] = useState(false)

  const tenantId = profile?.tenant_id

  const loadCatalog = useCallback(async () => {
    if (!tenantId) return
    setCatalogLoading(true)
    try {
      const { data } = await (supabase as any)
        .from('catalog_songs')
        .select('id, tenant_id, title, artist, genre, source, cifraclub_url, youtube_url')
        .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
        .order('title', { ascending: true })
      setCatalogSongs(data ?? [])
    } finally {
      setCatalogLoading(false)
    }
  }, [tenantId])

  async function loadEventRepertoire(eventId: string): Promise<RepertoireItem[]> {
    setRepertoireLoading(true)
    try {
      const { data } = await (supabase as any)
        .from('worship_event_songs')
        .select('id, position, key, notes, catalog_songs (id, tenant_id, title, artist, genre, source, cifraclub_url, youtube_url)')
        .eq('event_id', eventId)
        .order('position', { ascending: true })

      const items: RepertoireItem[] = (data ?? [])
        .filter((row: any) => row.catalog_songs)
        .map((row: any) => ({
          id: row.id,
          song: row.catalog_songs,
          position: row.position,
          key: row.key ?? '',
          notes: row.notes ?? '',
        }))

      setRepertoire(items)
      return items
    } catch {
      return []
    } finally {
      setRepertoireLoading(false)
    }
  }

  async function addSongToCatalog(
    title: string,
    artist: string
  ): Promise<{ ok: boolean; song?: CatalogSong; error?: string }> {
    if (!tenantId) return { ok: false, error: 'Sem sessão.' }

    const cifraclub_url = buildCifraClubUrl(artist, title)
    const youtube_url = buildYouTubeUrl(artist, title)

    const { data, error: err } = await (supabase as any)
      .from('catalog_songs')
      .insert({
        tenant_id: tenantId,
        title: title.trim(),
        artist: artist.trim(),
        genre: 'gospel_contemporaneo',
        source: 'manual',
        cifraclub_url,
        youtube_url,
        created_by: profile?.id,
      })
      .select('id, tenant_id, title, artist, genre, source, cifraclub_url, youtube_url')
      .single()

    if (err) {
      if (err.code === '23505') return { ok: false, error: 'Esta música já está no catálogo.' }
      return { ok: false, error: 'Não foi possível adicionar a música.' }
    }

    setCatalogSongs(prev => [...prev, data].sort((a, b) => a.title.localeCompare(b.title)))
    return { ok: true, song: data }
  }

  async function addSongToEvent(
    eventId: string,
    song: CatalogSong,
    key = '',
    notes = ''
  ): Promise<{ ok: boolean; error?: string }> {
    if (!tenantId) return { ok: false, error: 'Sem sessão.' }

    const nextPosition = repertoire.length > 0
      ? Math.max(...repertoire.map(r => r.position)) + 10
      : 10

    const { data, error: err } = await (supabase as any)
      .from('worship_event_songs')
      .insert({
        tenant_id: tenantId,
        event_id: eventId,
        song_id: song.id,
        position: nextPosition,
        key: key.trim() || null,
        notes: notes.trim() || null,
      })
      .select('id, position, key, notes')
      .single()

    if (err) {
      if (err.code === '23505') return { ok: false, error: 'Esta música já está no repertório deste evento.' }
      return { ok: false, error: 'Não foi possível adicionar a música ao evento.' }
    }

    setRepertoire(prev => [
      ...prev,
      { id: data.id, song, position: data.position, key: data.key ?? '', notes: data.notes ?? '' },
    ])
    return { ok: true }
  }

  async function removeSongFromEvent(repertoireItemId: string): Promise<{ ok: boolean }> {
    const { error: err } = await (supabase as any)
      .from('worship_event_songs')
      .delete()
      .eq('id', repertoireItemId)

    if (err) return { ok: false }
    setRepertoire(prev => prev.filter(r => r.id !== repertoireItemId))
    return { ok: true }
  }

  async function updateSongInEvent(
    repertoireItemId: string,
    key: string,
    notes: string
  ): Promise<{ ok: boolean }> {
    const { error: err } = await (supabase as any)
      .from('worship_event_songs')
      .update({ key: key.trim() || null, notes: notes.trim() || null })
      .eq('id', repertoireItemId)

    if (err) return { ok: false }
    setRepertoire(prev =>
      prev.map(r => r.id === repertoireItemId ? { ...r, key, notes } : r)
    )
    return { ok: true }
  }

  async function reorderRepertoire(eventId: string, items: RepertoireItem[]): Promise<{ ok: boolean }> {
    const newItems = items.map((item, index) => ({ ...item, position: (index + 1) * 10 }))
    setRepertoire(newItems)

    // Persist each position update
    const updates = newItems.map(item =>
      (supabase as any)
        .from('worship_event_songs')
        .update({ position: item.position })
        .eq('id', item.id)
    )
    await Promise.all(updates)
    return { ok: true }
  }

  return {
    catalogSongs,
    catalogLoading,
    repertoire,
    repertoireLoading,
    loadCatalog,
    loadEventRepertoire,
    addSongToCatalog,
    addSongToEvent,
    removeSongFromEvent,
    updateSongInEvent,
    reorderRepertoire,
    buildCifraClubUrl,
    buildYouTubeUrl,
  }
}

export { buildCifraClubUrl, buildYouTubeUrl }
