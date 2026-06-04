import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, LayoutAnimation,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useMember } from '@/hooks/useMember'
import { useModules, AppModule } from '@/hooks/useModules'
import { useEvents, TenantEvent } from '@/hooks/useEvents'
import { useAnnouncements, Announcement } from '@/hooks/useAnnouncements'
import { SkeletonBox } from '@/components/ui/SkeletonBox'
import { SirvaOSMark } from '@/components/ui/SirvaOSMark'
import { getModuleRoute } from '@/constants/modules'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'
import { useState, useCallback } from 'react'
import { useMyPrayerRequests, MyPrayerRequest } from '@/hooks/useMyPrayerRequests'

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
  const { requests: prayerRequests, refetch: refetchPrayer } = useMyPrayerRequests()
  const [refreshing, setRefreshing] = useState(false)

  const isOffline = modulesError === 'offline' || eventsError === 'offline' || announcementsError === 'offline'

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchMember(), refetchModules(), refetchEvents(), refetchAnnouncements(), refetchPrayer()])
    setRefreshing(false)
  }, [refetchMember, refetchModules, refetchEvents, refetchAnnouncements])

  const adminModules = modules.filter(m => m.isAdmin)
  const ministryModules = modules.filter(m => m.category === 'ministry')
  const featureModules = modules.filter(m => m.category === 'feature')

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
      {/* Hero de saudação */}
      <GreetingHero
        memberLoading={memberLoading}
        firstName={firstName}
        profile={profile}
        onAvatarPress={() => router.push('/(app)/perfil' as any)}
      />

      {/* Offline */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color={colors.semantic.warning} />
          <Text style={styles.offlineText}>Você está offline. Puxe para baixo para tentar novamente.</Text>
        </View>
      )}

      {/* Corpo principal */}
      <View style={styles.body}>

        {/* Admin */}
        {!memberLoading && !modulesLoading && adminModules.length > 0 && (
          <>
            <CollapsibleSection title="Administração" icon="shield-checkmark-outline" accentColor="#D97706">
              <View style={styles.adminGrid}>
                {adminModules.map(mod => {
                  const cfg = getModuleRoute(mod.slug)
                  if (!cfg) return null
                  return (
                    <AdminCard
                      key={mod.id}
                      module={mod}
                      onPress={() => router.push(`/(app)/modulos/${cfg.adminRouteSlug ?? cfg.routeSlug}` as any)}
                    />
                  )
                })}
              </View>
            </CollapsibleSection>
            <SectionDivider />
          </>
        )}

        {/* Ministérios */}
        {((!modulesLoading && ministryModules.length > 0) || modulesLoading) && (
          <>
            <CollapsibleSection title="Meus ministérios" icon="grid-outline">
              {modulesLoading ? (
                <ModulesSkeleton />
              ) : modulesError && modulesError !== 'offline' ? (
                <ErrorState message="Não foi possível carregar os módulos." onRetry={refetchModules} />
              ) : (
                <View style={styles.modulesGrid}>
                  {ministryModules.map(mod => {
                    const cfg = getModuleRoute(mod.slug)
                    return (
                      <ModuleCard
                        key={mod.id}
                        module={mod}
                        onPress={cfg ? () => router.push(`/(app)/modulos/${cfg.routeSlug}` as any) : () => {}}
                      />
                    )
                  })}
                </View>
              )}
            </CollapsibleSection>
            <SectionDivider />
          </>
        )}

        {/* Funcionalidades */}
        {!modulesLoading && featureModules.length > 0 && (
          <>
            <CollapsibleSection title="Funcionalidades" icon="apps-outline">
              <View style={styles.modulesGrid}>
                {featureModules.map(mod => {
                  const cfg = getModuleRoute(mod.slug)
                  return (
                    <ModuleCard
                      key={mod.id}
                      module={mod}
                      onPress={cfg ? () => router.push(`/(app)/modulos/${cfg.routeSlug}` as any) : () => {}}
                    />
                  )
                })}
              </View>
            </CollapsibleSection>
            <SectionDivider />
          </>
        )}

        {/* Oração */}
        {!memberLoading && (
          <>
            <CollapsibleSection title="Oração" icon="hand-right-outline" accentColor="#8B5CF6">
              <TouchableOpacity
                style={styles.prayerCard}
                onPress={() => router.push('/(app)/modulos/intercessao/pedido/novo' as any)}
                activeOpacity={0.8}
              >
                <View style={styles.prayerIconWrap}>
                  <Ionicons name="add-circle-outline" size={26} color="#8B5CF6" />
                </View>
                <View style={styles.prayerInfo}>
                  <Text style={styles.prayerTitle}>Enviar pedido de oração</Text>
                  <Text style={styles.prayerDesc}>
                    Compartilhe um pedido com o ministério de intercessão.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.neutral[300]} />
              </TouchableOpacity>

              {prayerRequests.length > 0 && (
                <PrayerRequestsAccordion requests={prayerRequests} onPress={(id) =>
                  router.push(`/(app)/modulos/intercessao/pedido/${id}` as any)
                } />
              )}
            </CollapsibleSection>
            <SectionDivider />
          </>
        )}

        {/* Eventos */}
        <CollapsibleSection title="Próximos eventos" icon="calendar-outline">
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
        </CollapsibleSection>

        <SectionDivider />

        {/* Comunicados */}
        <CollapsibleSection title="Comunicados recentes" icon="megaphone-outline">
          {announcementsLoading ? (
            <AnnouncementsSkeleton />
          ) : announcements.length === 0 ? (
            <EmptyState icon="megaphone-outline" message="Nenhum comunicado recente." muted />
          ) : (
            <AnnouncementsAccordion announcements={announcements} />
          )}
        </CollapsibleSection>

      </View>
    </ScrollView>
  )
}

// ── Subcomponentes ──────────────────────────────────────────────────────────

function GreetingHero({ memberLoading, firstName, profile, onAvatarPress }: {
  memberLoading: boolean
  firstName: string | null | undefined
  profile: any
  onAvatarPress: () => void
}) {
  return (
    <View style={styles.hero}>
      {/* Círculos decorativos */}
      <View style={styles.heroCircle1} />
      <View style={styles.heroCircle2} />
      <View style={styles.heroCircle3} />

      {/* Marca */}
      <View style={styles.heroMark}>
        <SirvaOSMark size={36} variant="gradient" />
        <Text style={styles.heroMarkText}>
          Sirva<Text style={styles.heroMarkAccent}>OS</Text>
        </Text>
      </View>

      {/* Saudação + avatar */}
      <View style={styles.heroGreeting}>
        <View style={styles.heroGreetingLeft}>
          {memberLoading ? (
            <>
              <SkeletonBox width={100} height={13} style={{ marginBottom: 6, backgroundColor: 'rgba(255,255,255,0.2)' }} />
              <SkeletonBox width={180} height={24} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
            </>
          ) : (
            <>
              <Text style={styles.heroSubtitle}>{getGreeting()},</Text>
              <Text style={styles.heroName}>{firstName ?? 'Membro'} 👋</Text>
            </>
          )}
        </View>
        <TouchableOpacity style={styles.avatarBtn} onPress={onAvatarPress} activeOpacity={0.8}>
          {memberLoading ? (
            <SkeletonBox width={52} height={52} borderRadius={26} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          ) : profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{firstName?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

function CollapsibleSection({
  title, icon, accentColor, defaultExpanded = true, children,
}: {
  title: string
  icon: keyof typeof Ionicons.glyphMap
  accentColor?: string
  defaultExpanded?: boolean
  children: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const accent = accentColor ?? colors.brand.primary

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpanded(e => !e)
  }

  return (
    <View style={styles.collapsible}>
      <TouchableOpacity style={styles.collapsibleHeader} onPress={toggle} activeOpacity={0.7}>
        <View style={[styles.collapsibleAccentBar, { backgroundColor: accent }]} />
        <Ionicons name={icon} size={16} color={accent} />
        <Text style={styles.collapsibleTitle}>{title}</Text>
        <View style={{ flex: 1 }} />
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.neutral[400]}
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.collapsibleBody}>
          {children}
        </View>
      )}
    </View>
  )
}

function SectionDivider() {
  return <View style={styles.divider} />
}

function ModuleCard({ module: mod, onPress }: { module: AppModule; onPress: () => void }) {
  const cfg = getModuleRoute(mod.slug)
  const icon = cfg?.icon ?? 'apps'
  const accent = cfg?.accentColor ?? colors.brand.primary

  return (
    <TouchableOpacity style={styles.moduleCard} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.moduleIconWrap, { backgroundColor: accent + '1A' }]}>
        <Ionicons name={icon} size={28} color={accent} />
      </View>
      <Text style={styles.moduleName} numberOfLines={2}>{mod.name}</Text>
    </TouchableOpacity>
  )
}

function AdminCard({ module: mod, onPress }: { module: AppModule; onPress: () => void }) {
  const cfg = getModuleRoute(mod.slug)
  const icon = cfg?.icon ?? 'apps'
  const accent = cfg?.accentColor ?? '#D97706'

  return (
    <TouchableOpacity style={[styles.adminCard, { borderLeftColor: accent }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.adminIconWrap, { backgroundColor: accent + '18' }]}>
        <Ionicons name={icon} size={20} color={accent} />
      </View>
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

function AnnouncementCard({ item, expanded, onToggle }: { item: Announcement; expanded: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity style={styles.announcementCard} onPress={onToggle} activeOpacity={0.8}>
      <View style={styles.announcementLeft}>
        <View style={styles.announcementDot} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.announcementTopRow}>
          <Text style={styles.announcementTitle} numberOfLines={expanded ? undefined : 1}>{item.title}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.neutral[400]} />
        </View>
        {expanded && (
          <Text style={styles.announcementMessage}>{item.message}</Text>
        )}
        <Text style={styles.announcementDate}>{formatAnnouncementDate(item.published_at)}</Text>
      </View>
    </TouchableOpacity>
  )
}

function AnnouncementsAccordion({ announcements }: { announcements: Announcement[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const visible = showAll ? announcements : announcements.slice(0, 3)

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <View style={styles.announcementsList}>
      {visible.map(a => (
        <AnnouncementCard
          key={a.id}
          item={a}
          expanded={expandedId === a.id}
          onToggle={() => toggle(a.id)}
        />
      ))}
      {announcements.length > 3 && (
        <TouchableOpacity
          style={styles.showMoreBtn}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
            setShowAll(v => !v)
          }}
        >
          <Text style={styles.showMoreText}>
            {showAll ? 'Ver menos' : `Ver mais ${announcements.length - 3} comunicados`}
          </Text>
          <Ionicons name={showAll ? 'chevron-up' : 'chevron-down'} size={14} color={colors.brand.primary} />
        </TouchableOpacity>
      )}
    </View>
  )
}

const PRAYER_STATUS: Record<string, { label: string; color: string }> = {
  new:         { label: 'Aguardando um intercessor',            color: '#3578A8' },
  assigned:    { label: 'O intercessor já está com seu pedido', color: '#e08b00' },
  interceding: { label: 'Alguém está orando por você agora',    color: '#c07000' },
  done:        { label: 'Seu pedido foi intercedido 🙏',         color: '#2F8A5F' },
}

function PrayerRequestsAccordion({ requests, onPress }: { requests: MyPrayerRequest[]; onPress: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpanded(e => !e)
  }

  return (
    <View style={styles.prayerRequestsWrap}>
      <TouchableOpacity style={styles.prayerRequestsToggle} onPress={toggle} activeOpacity={0.7}>
        <Ionicons name="list-outline" size={14} color={colors.neutral[500]} />
        <Text style={styles.prayerRequestsLabel}>
          {expanded ? 'Ocultar meus pedidos' : `Meus pedidos (${requests.length})`}
        </Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.neutral[400]} />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.prayerRequestsList}>
          {requests.map(req => {
            const s = PRAYER_STATUS[req.status] ?? PRAYER_STATUS.new
            return (
              <TouchableOpacity key={req.id} style={styles.prayerRow} onPress={() => onPress(req.id)} activeOpacity={0.8}>
                <Text style={styles.prayerRowContent} numberOfLines={1}>{req.content}</Text>
                <View style={[styles.prayerRowBadge, { backgroundColor: s.color + '18' }]}>
                  <Text style={[styles.prayerRowBadgeText, { color: s.color }]}>{s.label}</Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      )}
    </View>
  )
}

// ── Skeletons ────────────────────────────────────────────────────────────────

function ModulesSkeleton() {
  return (
    <View style={styles.modulesGrid}>
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={styles.moduleCardSkeleton}>
          <SkeletonBox width={56} height={56} borderRadius={radius.lg} style={{ marginBottom: 10 }} />
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

  // Hero
  hero: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl + 4,
    overflow: 'hidden',
    gap: spacing.md,
  },
  heroCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#087C7A', opacity: 0.35, right: -40, top: -80,
  },
  heroCircle2: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: '#00A7C4', opacity: 0.08, right: -60, bottom: -120,
  },
  heroCircle3: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#00C4A7', opacity: 0.12, left: -20, top: -30,
  },
  heroMark: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  heroMarkText: {
    fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.4,
  },
  heroMarkAccent: { color: '#00A7C4' },
  heroGreeting: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  heroGreetingLeft: { flex: 1 },
  heroSubtitle: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.72)', marginBottom: 3 },
  heroName: { fontSize: fontSize.xl + 2, fontWeight: '700', color: '#fff' },
  avatarBtn: { marginLeft: spacing.md },
  avatarImage: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)',
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)',
  },
  avatarText: { fontSize: fontSize.lg, fontWeight: '700', color: '#fff' },

  // Offline
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: '#FDE68A',
  },
  offlineText: { flex: 1, fontSize: fontSize.xs, color: '#92400E' },

  // Body
  body: {
    backgroundColor: colors.neutral[50],
    paddingTop: spacing.md,
  },

  // Collapsible section
  collapsible: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  collapsibleHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  collapsibleAccentBar: {
    width: 3, height: 16, borderRadius: 2,
  },
  collapsibleTitle: {
    fontSize: fontSize.sm, fontWeight: '700', color: colors.neutral[700],
    textTransform: 'uppercase', letterSpacing: 0.7,
  },
  collapsibleBody: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },

  // Divider
  divider: {
    height: 1, backgroundColor: colors.neutral[100],
    marginHorizontal: spacing.lg, marginVertical: spacing.xs,
  },

  // Grid de módulos
  modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  moduleCard: {
    width: '47%',
    backgroundColor: colors.neutral.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1, borderColor: colors.neutral[100],
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  moduleIconWrap: {
    width: 56, height: 56, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  moduleName: { fontSize: fontSize.md, fontWeight: '600', color: colors.neutral[900] },
  moduleCardSkeleton: {
    width: '47%',
    backgroundColor: colors.neutral.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1, borderColor: colors.neutral[100],
    alignItems: 'flex-start',
  },

  // Admin cards
  adminGrid: { gap: spacing.sm },
  adminCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.neutral.white,
    borderRadius: radius.md, padding: spacing.md,
    borderLeftWidth: 4, borderWidth: 1, borderColor: colors.neutral[100],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  adminIconWrap: {
    width: 40, height: 40, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  adminCardTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.neutral[950] },
  adminCardSub: { fontSize: fontSize.xs, color: colors.neutral[500], marginTop: 1 },

  // Oração
  prayerCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.neutral.white,
    borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: '#EDE9FE',
    shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  prayerIconWrap: {
    width: 48, height: 48, borderRadius: radius.lg,
    backgroundColor: '#EDE9FE',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  prayerInfo: { flex: 1 },
  prayerTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.neutral[950] },
  prayerDesc: { fontSize: fontSize.xs, color: colors.neutral[500], marginTop: 2, lineHeight: 18 },

  prayerRequestsWrap: { marginTop: spacing.sm },
  prayerRequestsToggle: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  prayerRequestsLabel: {
    fontSize: fontSize.xs, fontWeight: '600', color: colors.neutral[500],
    flex: 1,
  },
  prayerRequestsList: { marginTop: spacing.xs, gap: spacing.xs },
  prayerRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.neutral.white,
    borderWidth: 1, borderColor: colors.neutral[100],
    borderRadius: radius.md, padding: spacing.sm,
  },
  prayerRowContent: { flex: 1, fontSize: fontSize.sm, color: colors.neutral[800] },
  prayerRowBadge: {
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: radius.sm, flexShrink: 0,
  },
  prayerRowBadgeText: { fontSize: 11, fontWeight: '700' },

  // Eventos
  eventsScroll: { marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg },
  eventCard: {
    width: 190,
    backgroundColor: colors.neutral.white,
    borderRadius: radius.lg, padding: spacing.md,
    marginRight: spacing.md, borderTopWidth: 4,
    borderWidth: 1, borderColor: colors.neutral[100],
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 5, elevation: 3,
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
    width: 190, backgroundColor: colors.neutral.white,
    borderRadius: radius.lg, padding: spacing.md, marginRight: spacing.md,
    borderWidth: 1, borderColor: colors.neutral[100],
  },

  // Comunicados
  announcementsList: { gap: spacing.sm },
  announcementCard: {
    flexDirection: 'row', gap: spacing.md,
    backgroundColor: colors.neutral.white,
    borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.neutral[100],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  announcementLeft: { paddingTop: 4 },
  announcementDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand.primary,
  },
  announcementTopRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm,
  },
  announcementTitle: { flex: 1, fontSize: fontSize.sm, fontWeight: '600', color: colors.neutral[950] },
  announcementMessage: { fontSize: fontSize.xs, color: colors.neutral[500], marginTop: spacing.xs, lineHeight: 18 },
  announcementDate: { fontSize: 11, color: colors.neutral[300], marginTop: 4 },

  showMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.neutral[200],
    borderRadius: radius.md, backgroundColor: colors.neutral.white,
  },
  showMoreText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.brand.primary },

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
