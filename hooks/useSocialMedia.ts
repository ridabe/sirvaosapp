import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useMember } from '@/hooks/useMember'
import { cacheGet, cacheSet, cacheGetStale } from '@/lib/cache'

const YT_API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY ?? ''
const YT_BASE = 'https://www.googleapis.com/youtube/v3'

export type SocialMediaChannel = {
  id: string
  name: string
  platform: string
  channel_type: string
  channel_id: string
  channel_url: string | null
  description: string | null
}

export type YoutubeVideo = {
  videoId: string
  title: string
  description: string
  publishedAt: string
  thumbnailUrl: string
  channelTitle: string
  duration?: string
}

type State = {
  channels: SocialMediaChannel[]
  videos: YoutubeVideo[]
  channelInfo: { title: string; thumbnail: string; subscriberCount?: string } | null
  loading: boolean
  loadingVideos: boolean
  error: string | null
  noApiKey: boolean
}

export function useSocialMedia() {
  const { profile } = useMember()
  const tenantId = profile?.tenant_id

  const [state, setState] = useState<State>({
    channels: [],
    videos: [],
    channelInfo: null,
    loading: true,
    loadingVideos: false,
    error: null,
    noApiKey: false,
  })

  useEffect(() => {
    if (!tenantId) return
    fetchChannels()
  }, [tenantId])

  async function fetchChannels() {
    if (!tenantId) return
    setState(s => ({ ...s, loading: true, error: null }))

    const cacheKey = `social_media:channels:${tenantId}`
    const cached = await cacheGet<SocialMediaChannel[]>(cacheKey)
    if (cached?.length) {
      setState(s => ({ ...s, channels: cached, loading: false }))
      fetchYoutubeVideos(cached)
      return
    }

    try {
      const { data, error: err } = await (supabase as any)
        .from('social_media_channels')
        .select('id, name, platform, channel_type, channel_id, channel_url, description')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (err) throw err
      const channels: SocialMediaChannel[] = data ?? []
      await cacheSet(cacheKey, channels, 5 * 60 * 1000)
      setState(s => ({ ...s, channels, loading: false }))

      if (channels.length > 0) {
        await fetchYoutubeVideos(channels)
      }
    } catch {
      const stale = await cacheGetStale<SocialMediaChannel[]>(cacheKey)
      if (stale?.length) {
        setState(s => ({ ...s, channels: stale, loading: false }))
        fetchYoutubeVideos(stale)
      } else {
        setState(s => ({ ...s, loading: false, error: 'offline' }))
      }
    }
  }

  async function fetchYoutubeVideos(channels: SocialMediaChannel[]) {
    const ytChannel = channels.find(c => c.platform === 'youtube')
    if (!ytChannel) return

    if (!YT_API_KEY) {
      setState(s => ({ ...s, noApiKey: true }))
      return
    }

    setState(s => ({ ...s, loadingVideos: true }))

    const videoCacheKey = `social_media:videos:${ytChannel.channel_id}`
    const cachedVideos = await cacheGet<YoutubeVideo[]>(videoCacheKey)
    if (cachedVideos?.length) {
      setState(s => ({ ...s, videos: cachedVideos, loadingVideos: false }))
      fetchChannelInfo(ytChannel.channel_id)
      return
    }

    try {
      // 1. Resolve handle or channel_id → get uploads playlist
      const channelRes = await fetch(
        `${YT_BASE}/channels?part=contentDetails,snippet,statistics&${
          ytChannel.channel_id.startsWith('@')
            ? `forHandle=${encodeURIComponent(ytChannel.channel_id)}`
            : `id=${encodeURIComponent(ytChannel.channel_id)}`
        }&key=${YT_API_KEY}`
      )
      const channelJson = await channelRes.json()
      const channelItem = channelJson.items?.[0]
      if (!channelItem) throw new Error('Canal não encontrado')

      const uploadsPlaylistId: string = channelItem.contentDetails?.relatedPlaylists?.uploads
      if (!uploadsPlaylistId) throw new Error('Playlist de uploads não encontrada')

      const channelTitle: string = channelItem.snippet?.title ?? ytChannel.name
      const channelThumb: string = channelItem.snippet?.thumbnails?.high?.url
        ?? channelItem.snippet?.thumbnails?.default?.url ?? ''
      const subscriberCount: string | undefined = channelItem.statistics?.subscriberCount

      setState(s => ({
        ...s,
        channelInfo: { title: channelTitle, thumbnail: channelThumb, subscriberCount },
      }))

      // 2. Busca vídeos da playlist de uploads
      const playlistRes = await fetch(
        `${YT_BASE}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=30&key=${YT_API_KEY}`
      )
      const playlistJson = await playlistRes.json()
      const items = playlistJson.items ?? []

      const videos: YoutubeVideo[] = items
        .filter((item: any) => item.snippet?.resourceId?.videoId)
        .map((item: any) => {
          const s = item.snippet
          const thumb =
            s.thumbnails?.maxres?.url ??
            s.thumbnails?.high?.url ??
            s.thumbnails?.medium?.url ??
            s.thumbnails?.default?.url ??
            ''
          return {
            videoId: s.resourceId.videoId,
            title: s.title ?? '',
            description: s.description ?? '',
            publishedAt: s.publishedAt ?? '',
            thumbnailUrl: thumb,
            channelTitle: s.channelTitle ?? channelTitle,
          } as YoutubeVideo
        })

      await cacheSet(videoCacheKey, videos, 15 * 60 * 1000)
      setState(s => ({ ...s, videos, loadingVideos: false }))
    } catch {
      const stale = await cacheGetStale<YoutubeVideo[]>(videoCacheKey)
      setState(s => ({
        ...s,
        videos: stale ?? [],
        loadingVideos: false,
        error: s.error ?? null,
      }))
    }
  }

  async function fetchChannelInfo(channelId: string) {
    if (!YT_API_KEY) return
    try {
      const res = await fetch(
        `${YT_BASE}/channels?part=snippet,statistics&${
          channelId.startsWith('@')
            ? `forHandle=${encodeURIComponent(channelId)}`
            : `id=${encodeURIComponent(channelId)}`
        }&key=${YT_API_KEY}`
      )
      const json = await res.json()
      const item = json.items?.[0]
      if (!item) return
      setState(s => ({
        ...s,
        channelInfo: {
          title: item.snippet?.title ?? '',
          thumbnail: item.snippet?.thumbnails?.high?.url ?? '',
          subscriberCount: item.statistics?.subscriberCount,
        },
      }))
    } catch {}
  }

  return { ...state, refetch: fetchChannels }
}
