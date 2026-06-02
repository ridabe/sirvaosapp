import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useMember } from '@/hooks/useMember'
import { useModules, AppModule } from '@/hooks/useModules'
import { useEvents, TenantEvent } from '@/hooks/useEvents'
import { useAnnouncements, Announcement } from '@/hooks/useAnnouncements'
import { SkeletonBox } from '@/components/ui/SkeletonBox'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'
import { useState, useCallback } from 'react'

const MODULE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  louvor: 'musical-notes',
  financeiro: 'wallet',
  kids: 'happy',
  'escola-biblica': 'book',
  'acao-social': 'heart',
}

const MODULE_COLORS: Record<string, string> = {
  louvor: '#7C3AED',
  financeiro: '#059669',
  kids: '#D97706',
  'escola-biblica': '#2563EB',
  'acao-social': '#DC2626',
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  culto: 'Culto',
  ensaio: 'Ensaio',
  reuniao: 'Reunião',
  conferencia: 'Conferência',
  outro: 'Evento',
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function formatEventDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  if (d.toDateString() === today.toDateString()) return 'Hoje'
  if (d.toDateString() === tomorrow.toDateString()) return 'Amanhã'

  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatAnnouncementDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// ── Componente principal ────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter()
  const { profile, firstName, loading: memberLoading, refetch: refetchMember } = useMember()
  const { modules, loading: modulesLoading, error: modulesError, refetch: refetchModules } = useModules(
    profile?.tenant_id ?? (memberLoading ? undefined : null)
  )
  const { events, loading: eventsLoading, error: eventsError, refetch: refetchEvents } = useEvents()
  const { announcements, loading: announcementsLoading, error: announcementsError, refetch: refetchAnnouncements } = useAnnouncements()
  const [refreshing, setRefreshing] = useState(false)

  const isOffline = modulesError === 'offline' || eventsError === 'offline' || announcementsError === 'offline'

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchMember(), refetchModules(), refetchEvents(), refetchAnnouncements()])
    setRefreshing(false)
  }, [refetchMember, refetchModules, refetchEvents, refetchAnnouncements])

  const adminModules = modules.filter(m => m.isAdmin)

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.brand.primary]}
          tintColor={colors.brand.primary}
        />
      }
    >
      {/* Saudação */}
      <View style={styles.greetingCard}>
        <View style={styles.greetingLeft}>
          {memberLoading ? (
            <>
              <SkeletonBox width={120} height={14} style={{ marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.2)' }} />
              <SkeletonBox width={200} height={22} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
            </>
          ) : (
            <>
              <Text style={styles.greetingSubtitle}>{getGreeting()},</Text>
              <Text style={styles.greetingName}>{firstName ?? 'Membro'} 👋</Text>
            </>
          )}
        </View>
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => router.push('/(app)/perfil' as any)}
          activeOpacity={0.8}
        >
          {memberLoading ? (
            <SkeletonBox width={48} height={48} borderRadius={24} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          ) : profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {firstName?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Banner offline */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color={colors.semantic.warning} />
          <Text style={styles.offlineText}>
            Você está offline. Puxe para baixo para tentar novamente.
          </Text>
        </View>
      )}

      {/* Cards de admin — visíveis apenas para quem tem papel */}
      {!memberLoading && !modulesLoading && adminModules.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Administração" icon="shield-checkmark-outline" />
          <View style={styles.adminGrid}>
            {adminModules.map(mod => (
              <AdminCard
                key={mod.id}
                module={mod}
                onPress={() => router.push(`/(app)/modulos/${mod.slug}` as any)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Meus ministérios */}
      <View style={styles.section}>
        <SectionHeader title="Meus ministérios" icon="grid-outline" />
        {modulesLoading ? (
          <ModulesSkeleton />
        ) : modulesError && modulesError !== 'offline' ? (
          <ErrorState message="Não foi possível carregar os módulos." onRetry={refetchModules} />
        ) : modules.length === 0 ? (
          <EmptyState icon="grid-outline" message="Nenhum ministério ativo no momento." />
        ) : (
          <View style={styles.modulesGrid}>
            {modules.map(mod => (
              <ModuleCard
                key={mod.id}
                module={mod}
                onPress={() => router.push(`/(app)/modulos/${mod.slug}` as any)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Próximos eventos */}
      <View style={styles.section}>
        <SectionHeader title="Próximos eventos" icon="calendar-outline" />
        {eventsLoading ? (
          <EventsSkeleton />
        ) : events.length === 0 ? (
          <EmptyState icon="calendar-outline" message="Nenhum evento programado." muted />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventsScroll}>
            {events.map(ev => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Comunicados recentes */}
      <View style={[styles.section, styles.lastSection]}>
        <SectionHeader title="Comunicados recentes" icon="megaphone-outline" />
        {announcementsLoading ? (
          <AnnouncementsSkeleton />
        ) : announcements.length === 0 ? (
          <EmptyState icon="megaphone-outline" message="Nenhum comunicado recente." muted />
        ) : (
          <View style={styles.announcementsList}>
            {announcements.map(a => (
              <AnnouncementCard key={a.id} item={a} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

// ── Subcomponentes ──────────────────────────────────────────────────────────

function SectionHeader({ title, icon }: { title: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color={colors.neutral[500]} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  )
}

function ModuleCard({ module: mod, onPress }: { module: AppModule; onPress: () => void }) {
  const icon = MODULE_ICONS[mod.slug] ?? 'apps'
  const accent = MODULE_COLORS[mod.slug] ?? colors.brand.primary

  return (
    <TouchableOpacity style={styles.moduleCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.moduleIconWrap, { backgroundColor: accent + '18' }]}>
        <Ionicons name={icon} size={26} color={accent} />
      </View>
      <Text style={styles.moduleName} numberOfLines={2}>{mod.name}</Text>
      {mod.isAdmin && (
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

function AdminCard({ module: mod, onPress }: { module: AppModule; onPress: () => void }) {
  const icon = MODULE_ICONS[mod.slug] ?? 'apps'
  const accent = MODULE_COLORS[mod.slug] ?? colors.brand.primary

  return (
    <TouchableOpacity style={[styles.adminCard, { borderLeftColor: accent }]} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon} size={20} color={accent} />
      <View style={{ flex: 1 }}>
        <Text style={styles.adminCardTitle}>{mod.name}</Text>
        <Text style={styles.adminCardSub}>Painel de administração</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.neutral[300]} />
    </TouchableOpacity>
  )
}

function EventCard({ event: ev }: { event: TenantEvent }) {
  const accentColor = ev.color ?? colors.brand.primary
  const label = EVENT_TYPE_LABELS[ev.event_type] ?? 'Evento'

  return (
    <View style={[styles.eventCard, { borderTopColor: accentColor }]}>
      <View style={[styles.eventTypeBadge, { backgroundColor: accentColor + '20' }]}>
        <Text style={[styles.eventTypeText, { color: accentColor }]}>{label}</Text>
      </View>
      <Text style={styles.eventTitle} numberOfLines={2}>{ev.title}</Text>
      <View style={styles.eventMeta}>
        <Ionicons name="calendar-outline" size={12} color={colors.neutral[500]} />
        <Text style={styles.eventMetaText}>{formatEventDate(ev.event_date)}</Text>
        <Text style={styles.eventMetaDot}>·</Text>
        <Ionicons name="time-outline" size={12} color={colors.neutral[500]} />
        <Text style={styles.eventMetaText}>{formatEventTime(ev.event_date)}</Text>
      </View>
      {ev.location && (
        <View style={styles.eventMeta}>
          <Ionicons name="location-outline" size={12} color={colors.neutral[500]} />
          <Text style={styles.eventMetaText} numberOfLines={1}>{ev.location}</Text>
        </View>
      )}
    </View>
  )
}

function AnnouncementCard({ item }: { item: Announcement }) {
  return (
    <View style={styles.announcementCard}>
      <View style={styles.announcementDot} />
      <View style={{ flex: 1 }}>
        <Text style={styles.announcementTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.announcementMessage} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.announcementDate}>{formatAnnouncementDate(item.published_at)}</Text>
      </View>
    </View>
  )
}

// ── Skeletons ────────────────────────────────────────────────────────────────

function ModulesSkeleton() {
  return (
    <View style={styles.modulesGrid}>
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={styles.moduleCardSkeleton}>
          <SkeletonBox width={52} height={52} borderRadius={radius.lg} style={{ marginBottom: 10 }} />
          <SkeletonBox width={72} height={12} />
        </View>
      ))}
    </View>
  )
}

function EventsSkeleton() {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventsScroll}>
      {[1, 2].map(i => (
        <View key={i} style={styles.eventCardSkeleton}>
          <SkeletonBox width={60} height={20} borderRadius={radius.sm} style={{ marginBottom: 8 }} />
          <SkeletonBox width={140} height={14} style={{ marginBottom: 4 }} />
          <SkeletonBox width={100} height={14} style={{ marginBottom: 10 }} />
          <SkeletonBox width={80} height={11} />
        </View>
      ))}
    </ScrollView>
  )
}

function AnnouncementsSkeleton() {
  return (
    <View style={styles.announcementsList}>
      {[1, 2, 3].map(i => (
        <View key={i} style={[styles.announcementCard, { gap: spacing.md }]}>
          <View style={[styles.announcementDot, { backgroundColor: colors.neutral[200] }]} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBox width="80%" height={13} />
            <SkeletonBox width="100%" height={11} />
            <SkeletonBox width={60} height={10} />
          </View>
        </View>
      ))}
    </View>
  )
}

// ── Estados ──────────────────────────────────────────────────────────────────

function EmptyState({ icon, message, muted }: {
  icon: keyof typeof Ionicons.glyphMap
  message: string
  muted?: boolean
}) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={28} color={muted ? colors.neutral[200] : colors.neutral[300]} />
      <Text style={[styles.emptyText, muted && { color: colors.neutral[300] }]}>{message}</Text>
    </View>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorState}>
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity onPress={onRetry} style={styles.retryBtn} activeOpacity={0.7}>
        <Text style={styles.retryText}>Tentar novamente</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  content: { paddingBottom: spacing.xxl },

  // Saudação
  greetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl + 8,
  },
  greetingLeft: { flex: 1 },
  greetingSubtitle: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.75)', marginBottom: 2 },
  greetingName: { fontSize: fontSize.xl, fontWeight: '700', color: '#fff' },
  avatarBtn: { marginLeft: spacing.md },
  avatarImage: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: fontSize.lg, fontWeight: '700', color: '#fff' },

  // Offline
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  offlineText: { flex: 1, fontSize: fontSize.xs, color: '#92400E' },

  // Seções
  section: {
    marginTop: -16,
    backgroundColor: colors.neutral[50],
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  lastSection: { marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.sm, fontWeight: '600', color: colors.neutral[500],
    textTransform: 'uppercase', letterSpacing: 0.6,
  },

  // Grid de módulos
  modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  moduleCard: {
    width: '47%',
    backgroundColor: colors.neutral.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1, borderColor: colors.neutral[100],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  moduleIconWrap: {
    width: 52, height: 52, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  moduleName: { fontSize: fontSize.md, fontWeight: '600', color: colors.neutral[950] },
  adminBadge: {
    marginTop: spacing.xs, alignSelf: 'flex-start',
    backgroundColor: colors.brand.primarySoft,
    borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2,
  },
  adminBadgeText: {
    fontSize: 10, fontWeight: '700', color: colors.brand.primary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  moduleCardSkeleton: {
    width: '47%',
    backgroundColor: colors.neutral.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1, borderColor: colors.neutral[100],
    alignItems: 'flex-start',
  },

  // Cards de admin
  adminGrid: { gap: spacing.sm, marginBottom: spacing.sm },
  adminCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.neutral.white,
    borderRadius: radius.md, padding: spacing.md,
    borderLeftWidth: 4, borderWidth: 1, borderColor: colors.neutral[100],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  adminCardTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.neutral[950] },
  adminCardSub: { fontSize: fontSize.xs, color: colors.neutral[500], marginTop: 1 },

  // Eventos
  eventsScroll: { marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg },
  eventCard: {
    width: 180,
    backgroundColor: colors.neutral.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
    borderTopWidth: 3,
    borderWidth: 1, borderColor: colors.neutral[100],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  eventTypeBadge: {
    alignSelf: 'flex-start', borderRadius: radius.sm,
    paddingHorizontal: 8, paddingVertical: 3, marginBottom: spacing.sm,
  },
  eventTypeText: { fontSize: 11, fontWeight: '600' },
  eventTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.neutral[950], marginBottom: spacing.sm },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  eventMetaText: { fontSize: 11, color: colors.neutral[500] },
  eventMetaDot: { fontSize: 11, color: colors.neutral[300] },
  eventCardSkeleton: {
    width: 180, backgroundColor: colors.neutral.white,
    borderRadius: radius.lg, padding: spacing.md, marginRight: spacing.md,
    borderWidth: 1, borderColor: colors.neutral[100],
  },

  // Comunicados
  announcementsList: { gap: spacing.md },
  announcementCard: {
    flexDirection: 'row', gap: spacing.md,
    backgroundColor: colors.neutral.white,
    borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.neutral[100],
  },
  announcementDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.brand.primary, marginTop: 4,
  },
  announcementTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.neutral[950] },
  announcementMessage: { fontSize: fontSize.xs, color: colors.neutral[500], marginTop: 2 },
  announcementDate: { fontSize: 11, color: colors.neutral[300], marginTop: 4 },

  // Estados
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { fontSize: fontSize.sm, color: colors.neutral[500], textAlign: 'center' },
  errorState: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  errorText: { fontSize: fontSize.sm, color: colors.semantic.danger, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    backgroundColor: colors.brand.primarySoft, borderRadius: radius.md,
  },
  retryText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.brand.primary },
})
