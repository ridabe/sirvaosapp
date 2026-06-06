import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Linking, RefreshControl, Image,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSocialMedia, YoutubeVideo } from '@/hooks/useSocialMedia'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'

const ACCENT = '#EF4444'
const { width: SCREEN_W } = Dimensions.get('window')

function formatRelativeDate(isoDate: string): string {
  if (!isoDate) return ''
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} dias atrás`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks} sem. atrás`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} meses atrás`
  return `${Math.floor(months / 12)} anos atrás`
}

function formatSubscribers(count?: string): string {
  if (!count) return ''
  const n = parseInt(count, 10)
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M inscritos`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K inscritos`
  return `${n} inscritos`
}

function openVideo(videoId: string) {
  const appUrl = `vnd.youtube://www.youtube.com/watch?v=${videoId}`
  const webUrl = `https://www.youtube.com/watch?v=${videoId}`
  Linking.canOpenURL(appUrl)
    .then(can => Linking.openURL(can ? appUrl : webUrl))
    .catch(() => Linking.openURL(webUrl))
}

// ── Componente de card de vídeo ────────────────────────────────────────────
function VideoCard({ item, index }: { item: YoutubeVideo; index: number }) {
  const thumbW = SCREEN_W
  const thumbH = Math.round(thumbW * (9 / 16))

  return (
    <TouchableOpacity
      style={styles.videoCard}
      onPress={() => openVideo(item.videoId)}
      activeOpacity={0.9}
    >
      {/* Thumbnail */}
      <View style={[styles.thumbContainer, { height: thumbH }]}>
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        {/* Play overlay */}
        <View style={styles.playOverlay}>
          <View style={styles.playBtn}>
            <Ionicons name="play" size={22} color="#fff" />
          </View>
        </View>
      </View>

      {/* Info abaixo da thumbnail */}
      <View style={styles.videoInfo}>
        <View style={styles.videoMeta}>
          <View style={styles.channelDot} />
          <View style={styles.videoTexts}>
            <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
            <View style={styles.videoSubRow}>
              <Text style={styles.videoChannel}>{item.channelTitle}</Text>
              {item.publishedAt ? (
                <>
                  <Text style={styles.videoDot}>·</Text>
                  <Text style={styles.videoDate}>{formatRelativeDate(item.publishedAt)}</Text>
                </>
              ) : null}
            </View>
          </View>
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => openVideo(item.videoId)}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={colors.neutral[500]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Separador entre cards */}
      {index > 0 && <View style={styles.cardDivider} />}
    </TouchableOpacity>
  )
}

// ── Header do canal ────────────────────────────────────────────────────────
function ChannelHeader({
  channelInfo,
  channelId,
}: {
  channelInfo: { title: string; thumbnail: string; subscriberCount?: string } | null
  channelId: string
}) {
  const openChannel = () => {
    const url = channelId.startsWith('@')
      ? `https://www.youtube.com/${channelId}`
      : `https://www.youtube.com/channel/${channelId}`
    Linking.openURL(url).catch(() => {})
  }

  return (
    <View style={styles.channelHeader}>
      {/* Avatar do canal */}
      {channelInfo?.thumbnail ? (
        <Image
          source={{ uri: channelInfo.thumbnail }}
          style={styles.channelAvatar}
        />
      ) : (
        <View style={[styles.channelAvatar, styles.channelAvatarPlaceholder]}>
          <Ionicons name="play-circle" size={32} color={ACCENT} />
        </View>
      )}

      <View style={styles.channelHeaderInfo}>
        <Text style={styles.channelName} numberOfLines={1}>
          {channelInfo?.title ?? 'Canal'}
        </Text>
        {channelInfo?.subscriberCount ? (
          <Text style={styles.channelSubs}>
            {formatSubscribers(channelInfo.subscriberCount)}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity style={styles.subscribeBtn} onPress={openChannel} activeOpacity={0.8}>
        <Ionicons name="logo-youtube" size={14} color="#fff" style={{ marginRight: 4 }} />
        <Text style={styles.subscribeBtnText}>Abrir canal</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Tela principal ─────────────────────────────────────────────────────────
export default function MidiasSociaisScreen() {
  const insets = useSafeAreaInsets()
  const {
    channels, videos, channelInfo,
    loading, loadingVideos, error, noApiKey,
    refetch,
  } = useSocialMedia()

  const ytChannel = channels.find(c => c.platform === 'youtube')

  // Loading inicial
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    )
  }

  // Sem canal configurado
  if (!ytChannel) {
    return (
      <View style={styles.center}>
        <Ionicons name="play-circle-outline" size={64} color={colors.neutral[200]} />
        <Text style={styles.emptyTitle}>Nenhum canal configurado</Text>
        <Text style={styles.emptyBody}>
          O administrador ainda não adicionou{'\n'}um canal do YouTube a esta igreja.
        </Text>
      </View>
    )
  }

  // Sem chave da API
  if (noApiKey) {
    return (
      <View style={styles.center}>
        <Ionicons name="key-outline" size={56} color={colors.neutral[300]} />
        <Text style={styles.emptyTitle}>YouTube API não configurada</Text>
        <Text style={styles.emptyBody}>
          Adicione a variável{'\n'}
          <Text style={{ fontFamily: 'monospace', color: ACCENT }}>EXPO_PUBLIC_YOUTUBE_API_KEY</Text>
          {'\n'}no arquivo .env.local para listar os vídeos.
        </Text>
      </View>
    )
  }

  // Erro de conexão sem cache
  if (error === 'offline' && videos.length === 0 && !loadingVideos) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={56} color={colors.neutral[300]} />
        <Text style={styles.emptyTitle}>Sem conexão</Text>
        <Text style={styles.emptyBody}>Verifique sua internet e tente novamente.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const ListHeader = () => (
    <View>
      <ChannelHeader channelInfo={channelInfo} channelId={ytChannel.channel_id} />
      {/* Barra de seção */}
      <View style={styles.sectionBar}>
        <View style={[styles.sectionAccent, { backgroundColor: ACCENT }]} />
        <Text style={styles.sectionTitle}>Últimos vídeos</Text>
      </View>

      {loadingVideos && (
        <View style={styles.videosLoading}>
          <ActivityIndicator size="small" color={ACCENT} />
          <Text style={styles.videosLoadingText}>Carregando vídeos...</Text>
        </View>
      )}
    </View>
  )

  const ListEmpty = () => {
    if (loadingVideos) return null
    return (
      <View style={styles.emptyVideos}>
        <Ionicons name="videocam-outline" size={48} color={colors.neutral[300]} />
        <Text style={styles.emptyVideosText}>Nenhum vídeo encontrado</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={videos}
      keyExtractor={item => item.videoId}
      renderItem={({ item, index }) => <VideoCard item={item} index={index} />}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={ListEmpty}
      style={styles.list}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refetch}
          colors={[ACCENT]}
          tintColor={ACCENT}
        />
      }
    />
  )
}

// ── Estilos ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },

  center: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },

  // Channel header
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  channelAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2A2A2A',
  },
  channelAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelHeaderInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  channelSubs: {
    fontSize: fontSize.xs,
    color: '#AAAAAA',
    marginTop: 2,
  },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  subscribeBtnText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: '#fff',
  },

  // Section bar
  sectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: '#0F0F0F',
  },
  sectionAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: '#AAAAAA',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Videos loading
  videosLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  videosLoadingText: {
    fontSize: fontSize.sm,
    color: '#AAAAAA',
  },

  // Video card
  videoCard: {
    backgroundColor: '#0F0F0F',
    marginBottom: spacing.md,
  },
  cardDivider: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#1F1F1F',
  },
  thumbContainer: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  videoInfo: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  channelDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ACCENT + '30',
    marginTop: 2,
    flexShrink: 0,
  },
  videoTexts: {
    flex: 1,
  },
  videoTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 4,
  },
  videoSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  videoChannel: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  videoDot: {
    fontSize: 12,
    color: '#555555',
  },
  videoDate: {
    fontSize: 12,
    color: '#AAAAAA',
  },

  // Empty states
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: fontSize.sm,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: ACCENT,
    borderRadius: radius.full,
  },
  retryText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: '#fff',
  },
  emptyVideos: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyVideosText: {
    fontSize: fontSize.md,
    color: '#555555',
  },
})
