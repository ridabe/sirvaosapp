import React from 'react'
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
import { getModuleRoute } from '@/constants/modules'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius, elevation } from '@/lib/theme'
import { useState, useCallback } from 'react'
import { useMyPrayerRequests, MyPrayerRequest } from '@/hooks/useMyPrayerRequests'

// ── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<string, string> = {
  culto: 'Culto',
  ensaio: 'Ensaio',
  reuniao: 'Reunião',
  conferencia: 'Conferência',
  outro: 'Evento',
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  culto: '#2563EB',
  ensaio: '#7C3AED',
  reuniao: '#059669',
  conferencia: '#D97706',
  outro: colors.brand.primary,
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function formatEventDayMonth(iso: string): { day: string; month: string; weekday: string } {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) {
    return { day: 'Hoje', month: '', weekday: '' }
  }
  if (d.toDateString() === tomorrow.toDateString()) {
    return { day: 'Amanhã', month: '', weekday: '' }
  }
  return {
    day: d.toLocaleDateString('pt-BR', { day: '2-digit' }),
    month: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
    weekday: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
  }
}

function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatAnnouncementDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Ontem'
  if (diff < 7) return `${diff} dias atrás`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// ── Quick Actions ─────────────────────────────────────────────────────────────

type QuickAction = {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
  route: string
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Oração', icon: 'hand-right-outline', color: '#8B5CF6', route: '/(app)/modulos/intercessao/pedido/novo' },
  { label: 'Eventos', icon: 'calendar-outline', color: '#2563EB', route: '/(app)/' },
  { label: 'Avisos', icon: 'megaphone-outline', color: '#D97706', route: '/(app)/' },
  { label: 'Perfil', icon: 'person-outline', color: colors.brand.primary, route: '/(app)/perfil' },
]

// ── Componente principal ──────────────────────────────────────────────────────

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
      {/* ── Hero compacto ── */}
      <HeroSection
        memberLoading={memberLoading}
        firstName={firstName}
        profile={profile}
        onAvatarPress={() => router.push('/(app)/perfil' as any)}
      />

      {/* ── Offline banner ── */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={14} color="#92400E" />
          <Text style={styles.offlineText}>Sem conexão. Puxe para atualizar.</Text>
        </View>
      )}

      {/* ── Quick Actions ── */}
      <View style={styles.quickActionsCard}>
        {QUICK_ACTIONS.map(action => (
          <TouchableOpacity
            key={action.label}
            style={styles.quickAction}
            onPress={() => router.push(action.route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
              <Ionicons name={action.icon} size={20} color={action.color} />
            </View>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Corpo ── */}
      <View style={styles.body}>

        {/* Administração */}
        {!memberLoading && !modulesLoading && adminModules.length > 0 && (
          <Section title="Administração" icon="shield-checkmark-outline" accentColor="#D97706">
            <View style={styles.adminList}>
              {adminModules.map(mod => {
                const cfg = getModuleRoute(mod.slug)
                if (!cfg) return null
                return (
                  <AdminRow
                    key={mod.id}
                    module={mod}
                    onPress={() => router.push(`/(app)/modulos/${cfg.adminRouteSlug ?? cfg.routeSlug}` as any)}
                  />
                )
              })}
            </View>
          </Section>
        )}

        {/* Ministérios */}
        {((!modulesLoading && ministryModules.length > 0) || modulesLoading) && (
          <Section title="Meus ministérios" icon="grid-outline">
            {modulesLoading ? (
              <View style={styles.modulesGrid}>
                {[1, 2, 3, 4].map(i => (
                  <View key={i} style={styles.moduleItemSkeleton}>
                    <SkeletonBox width={44} height={44} borderRadius={radius.lg} style={{ marginBottom: 6 }} />
                    <SkeletonBox width={52} height={10} />
                  </View>
                ))}
              </View>
            ) : modulesError && modulesError !== 'offline' ? (
              <ErrorState message="Não foi possível carregar os módulos." onRetry={refetchModules} />
            ) : (
              <View style={styles.modulesGrid}>
                {ministryModules.map(mod => {
                  const cfg = getModuleRoute(mod.slug)
                  return (
                    <ModuleItem
                      key={mod.id}
                      module={mod}
                      onPress={cfg ? () => router.push(`/(app)/modulos/${cfg.routeSlug}` as any) : () => {}}
                    />
                  )
                })}
              </View>
            )}
          </Section>
        )}

        {/* Funcionalidades */}
        {!modulesLoading && featureModules.length > 0 && (
          <Section title="Funcionalidades" icon="apps-outline">
            <View style={styles.modulesGrid}>
              {featureModules.map(mod => {
                const cfg = getModuleRoute(mod.slug)
                return (
                  <ModuleItem
                    key={mod.id}
                    module={mod}
                    onPress={cfg ? () => router.push(`/(app)/modulos/${cfg.routeSlug}` as any) : () => {}}
                  />
                )
              })}
            </View>
          </Section>
        )}

        {/* Oração */}
        {!memberLoading && (
          <Section title="Intercessão" icon="hand-right-outline" accentColor="#8B5CF6">
            <TouchableOpacity
              style={styles.prayerRow}
              onPress={() => router.push('/(app)/modulos/intercessao/pedido/novo' as any)}
              activeOpacity={0.8}
            >
              <View style={styles.prayerIconWrap}>
                <Ionicons name="add-circle-outline" size={22} color="#8B5CF6" />
              </View>
              <View style={styles.prayerInfo}>
                <Text style={styles.prayerTitle}>Enviar pedido de oração</Text>
                <Text style={styles.prayerSub}>Compartilhe com o ministério de intercessão</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.neutral[300]} />
            </TouchableOpacity>

            {prayerRequests.length > 0 && (
              <PrayerRequestsAccordion
                requests={prayerRequests}
                onPress={(id) => router.push(`/(app)/modulos/intercessao/pedido/${id}` as any)}
              />
            )}
          </Section>
        )}

        {/* Próximos eventos */}
        <Section title="Próximos eventos" icon="calendar-outline">
          {eventsLoading ? (
            <View style={styles.eventList}>
              {[1, 2, 3].map(i => (
                <View key={i} style={styles.eventRowSkeleton}>
                  <SkeletonBox width={40} height={44} borderRadius={radius.md} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <SkeletonBox width="70%" height={13} />
                    <SkeletonBox width="45%" height={11} />
                  </View>
                </View>
              ))}
            </View>
          ) : events.length === 0 ? (
            <EmptyState icon="calendar-outline" message="Nenhum evento programado." />
          ) : (
            <View style={styles.eventList}>
              {events.slice(0, 5).map((ev, idx) => (
                <EventRow key={ev.id} event={ev} isLast={idx === Math.min(events.length, 5) - 1} />
              ))}
              {events.length > 5 && (
                <TouchableOpacity style={styles.seeMoreBtn} activeOpacity={0.7}>
                  <Text style={styles.seeMoreText}>Ver todos os {events.length} eventos</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.brand.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </Section>

        {/* Comunicados */}
        <Section title="Comunicados" icon="megaphone-outline" accentColor="#D97706">
          {announcementsLoading ? (
            <View>
              {[1, 2, 3].map(i => (
                <View key={i} style={styles.announcementRowSkeleton}>
                  <SkeletonBox width={32} height={32} borderRadius={radius.md} />
                  <View style={{ flex: 1, gap: 5 }}>
                    <SkeletonBox width="75%" height={13} />
                    <SkeletonBox width="40%" height={10} />
                  </View>
                </View>
              ))}
            </View>
          ) : announcements.length === 0 ? (
            <EmptyState icon="megaphone-outline" message="Nenhum comunicado recente." />
          ) : (
            <AnnouncementsAccordion announcements={announcements} />
          )}
        </Section>

      </View>
    </ScrollView>
  )
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

function HeroSection({ memberLoading, firstName, profile, onAvatarPress }: {
  memberLoading: boolean
  firstName: string | null | undefined
  profile: any
  onAvatarPress: () => void
}) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroCircle1} />
      <View style={styles.heroCircle2} />
      <View style={styles.heroContent}>
        <View style={styles.heroLeft}>
          {memberLoading ? (
            <>
              <SkeletonBox width={80} height={12} style={{ marginBottom: 5, backgroundColor: 'rgba(255,255,255,0.2)' }} />
              <SkeletonBox width={160} height={22} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
            </>
          ) : (
            <>
              <Text style={styles.heroGreeting}>{getGreeting()},</Text>
              <Text style={styles.heroName}>{firstName ?? 'Membro'} 👋</Text>
            </>
          )}
        </View>
        <TouchableOpacity style={styles.avatarBtn} onPress={onAvatarPress} activeOpacity={0.8}>
          {memberLoading ? (
            <SkeletonBox width={48} height={48} borderRadius={24} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          ) : profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{firstName?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

// Section wrapper com cabeçalho compacto e separador
function Section({
  title, icon, accentColor, children,
}: {
  title: string
  icon: keyof typeof Ionicons.glyphMap
  accentColor?: string
  children: React.ReactNode
}) {
  const accent = accentColor ?? colors.brand.primary
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionAccent, { backgroundColor: accent }]} />
        <Ionicons name={icon} size={14} color={accent} />
        <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  )
}

// Módulo no estilo launcher — ícone + nome abaixo, 4 colunas
function ModuleItem({ module: mod, onPress }: { module: AppModule; onPress: () => void }) {
  const cfg = getModuleRoute(mod.slug)
  const icon = cfg?.icon ?? 'apps-outline'
  const accent = cfg?.accentColor ?? colors.brand.primary

  return (
    <TouchableOpacity style={styles.moduleItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.moduleIconWrap, { backgroundColor: accent + '18' }]}>
        <Ionicons name={icon} size={24} color={accent} />
      </View>
      <Text style={styles.moduleName} numberOfLines={2}>{mod.name}</Text>
    </TouchableOpacity>
  )
}

// Admin — linha compacta com borda esquerda colorida
function AdminRow({ module: mod, onPress }: { module: AppModule; onPress: () => void }) {
  const cfg = getModuleRoute(mod.slug)
  const icon = cfg?.icon ?? 'apps-outline'
  const accent = cfg?.accentColor ?? '#D97706'

  return (
    <TouchableOpacity
      style={[styles.adminItem, { borderLeftColor: accent }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.adminIconWrap, { backgroundColor: accent + '15' }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.adminItemTitle}>{mod.name}</Text>
        <Text style={styles.adminItemSub}>Painel de administração</Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={colors.neutral[300]} />
    </TouchableOpacity>
  )
}

// Evento — linha compacta estilo agenda com bloco de data à esquerda
function EventRow({ event: ev, isLast }: { event: TenantEvent; isLast: boolean }) {
  const accent = ev.color ?? EVENT_TYPE_COLORS[ev.event_type] ?? colors.brand.primary
  const label = EVENT_TYPE_LABELS[ev.event_type] ?? 'Evento'
  const { day, month, weekday } = formatEventDayMonth(ev.event_date)
  const time = formatEventTime(ev.event_date)
  const isToday = day === 'Hoje'
  const isTomorrow = day === 'Amanhã'
  const isSpecial = isToday || isTomorrow

  return (
    <View style={[styles.eventRow, !isLast && styles.eventRowBorder]}>
      {/* Bloco de data */}
      <View style={[styles.eventDateBlock, { backgroundColor: accent + '15', borderColor: accent + '30' }]}>
        {isSpecial ? (
          <Text style={[styles.eventDateSpecial, { color: accent }]}>{day}</Text>
        ) : (
          <>
            <Text style={[styles.eventDateDay, { color: accent }]}>{day}</Text>
            <Text style={[styles.eventDateMonth, { color: accent }]}>{month}</Text>
          </>
        )}
      </View>

      {/* Linha vertical conectora */}
      <View style={[styles.eventConnector, { backgroundColor: accent + '40' }]} />

      {/* Conteúdo */}
      <View style={styles.eventContent}>
        <View style={styles.eventTopRow}>
          <Text style={styles.eventTitle} numberOfLines={1}>{ev.title}</Text>
          <View style={[styles.eventTypePill, { backgroundColor: accent + '18' }]}>
            <Text style={[styles.eventTypeText, { color: accent }]}>{label}</Text>
          </View>
        </View>
        <View style={styles.eventMeta}>
          <Ionicons name="time-outline" size={11} color={colors.neutral[400]} />
          <Text style={styles.eventMetaText}>{time}</Text>
          {!isSpecial && weekday && (
            <>
              <Text style={styles.eventMetaDot}>·</Text>
              <Text style={styles.eventMetaText}>{weekday}</Text>
            </>
          )}
          {ev.location && (
            <>
              <Text style={styles.eventMetaDot}>·</Text>
              <Ionicons name="location-outline" size={11} color={colors.neutral[400]} />
              <Text style={styles.eventMetaText} numberOfLines={1}>{ev.location}</Text>
            </>
          )}
        </View>
      </View>
    </View>
  )
}

// Comunicado — linha compacta com ícone colorido e expansão inline
function AnnouncementRow({ item, expanded, onToggle }: {
  item: Announcement
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <TouchableOpacity
      style={styles.announcementRow}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={styles.announcementIconWrap}>
        <Ionicons name="megaphone-outline" size={16} color="#D97706" />
      </View>
      <View style={styles.announcementContent}>
        <View style={styles.announcementTopRow}>
          <Text style={styles.announcementTitle} numberOfLines={expanded ? undefined : 1}>
            {item.title}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={13}
            color={colors.neutral[400]}
            style={{ flexShrink: 0 }}
          />
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
  const visible = showAll ? announcements : announcements.slice(0, 4)

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <View>
      {visible.map(a => (
        <AnnouncementRow
          key={a.id}
          item={a}
          expanded={expandedId === a.id}
          onToggle={() => toggle(a.id)}
        />
      ))}
      {announcements.length > 4 && (
        <TouchableOpacity
          style={styles.seeMoreBtn}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
            setShowAll(v => !v)
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.seeMoreText}>
            {showAll ? 'Ver menos' : `Ver mais ${announcements.length - 4} comunicados`}
          </Text>
          <Ionicons name={showAll ? 'chevron-up' : 'chevron-down'} size={13} color={colors.brand.primary} />
        </TouchableOpacity>
      )}
    </View>
  )
}

// Oração — linha de pedido compacta
function PrayerRequestsAccordion({ requests, onPress }: {
  requests: MyPrayerRequest[]
  onPress: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const PRAYER_STATUS: Record<string, { label: string; color: string }> = {
    new:         { label: 'Aguardando',         color: '#3578A8' },
    assigned:    { label: 'Designado',           color: '#e08b00' },
    interceding: { label: 'Orando por você',     color: '#c07000' },
    done:        { label: 'Intercedido 🙏',       color: '#2F8A5F' },
  }

  return (
    <View style={styles.prayerAccordion}>
      <TouchableOpacity
        style={styles.prayerAccordionToggle}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
          setExpanded(e => !e)
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="list-outline" size={13} color={colors.neutral[500]} />
        <Text style={styles.prayerAccordionLabel}>
          {expanded ? 'Ocultar pedidos' : `Meus pedidos (${requests.length})`}
        </Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={13} color={colors.neutral[400]} />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.prayerList}>
          {requests.map(req => {
            const s = PRAYER_STATUS[req.status] ?? PRAYER_STATUS.new
            return (
              <TouchableOpacity
                key={req.id}
                style={styles.prayerItem}
                onPress={() => onPress(req.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.prayerStatusDot, { backgroundColor: s.color }]} />
                <Text style={styles.prayerItemContent} numberOfLines={1}>{req.content}</Text>
                <Text style={[styles.prayerItemStatus, { color: s.color }]}>{s.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )}
    </View>
  )
}

function EmptyState({ icon, message }: { icon: keyof typeof Ionicons.glyphMap; message: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={28} color={colors.neutral[200]} />
      <Text style={styles.emptyText}>{message}</Text>
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

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  content: { paddingBottom: 100 },

  // ── Hero ──
  hero: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + 4,
    overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#087C7A', opacity: 0.35, right: -40, top: -70,
  },
  heroCircle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#00C4A7', opacity: 0.12, left: -20, bottom: -30,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  heroLeft: { flex: 1 },
  heroGreeting: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.72)', marginBottom: 2 },
  heroName: { fontSize: fontSize.xl, fontWeight: '700', color: '#fff' },
  avatarBtn: { marginLeft: spacing.md },
  avatarImage: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)',
  },
  avatarInitials: { fontSize: fontSize.base, fontWeight: '700', color: '#fff' },

  // ── Offline ──
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.lg, paddingVertical: 7,
    borderBottomWidth: 1, borderBottomColor: '#FDE68A',
  },
  offlineText: { fontSize: fontSize.xs, color: '#92400E' },

  // ── Quick Actions ──
  quickActionsCard: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.white,
    marginHorizontal: spacing.md,
    marginTop: -spacing.md,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    ...elevation.md,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    color: colors.neutral[600],
    fontWeight: '500',
    textAlign: 'center',
  },

  // ── Body ──
  body: {
    paddingTop: spacing.md,
  },

  // ── Section ──
  section: {
    marginBottom: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 6,
  },
  sectionAccent: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[500],
    letterSpacing: 0.8,
    flex: 1,
  },
  sectionBody: {
    backgroundColor: colors.neutral.white,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },

  // ── Módulos — grid 4 colunas estilo launcher ──
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  moduleItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    gap: 6,
  },
  moduleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleName: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.neutral[700],
    textAlign: 'center',
    lineHeight: 14,
  },
  moduleItemSkeleton: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: 6,
  },

  // ── Admin ──
  adminList: {
    gap: 0,
  },
  adminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderLeftWidth: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
  },
  adminIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  adminItemTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.neutral[900] },
  adminItemSub: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: 1 },

  // ── Oração ──
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
  },
  prayerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  prayerInfo: { flex: 1 },
  prayerTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.neutral[900] },
  prayerSub: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: 1 },
  prayerAccordion: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  prayerAccordionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
  },
  prayerAccordionLabel: {
    flex: 1,
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  prayerList: { gap: 1 },
  prayerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.sm,
  },
  prayerStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
  },
  prayerItemContent: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.neutral[700],
  },
  prayerItemStatus: {
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 0,
  },

  // ── Eventos — estilo agenda ──
  eventList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 0,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 10,
  },
  eventRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
  },
  eventDateBlock: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  eventDateDay: {
    fontSize: fontSize.base,
    fontWeight: '700',
    lineHeight: 18,
  },
  eventDateMonth: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    lineHeight: 12,
  },
  eventDateSpecial: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  eventConnector: {
    width: 2,
    height: 44,
    borderRadius: 1,
    marginTop: 0,
    flexShrink: 0,
  },
  eventContent: {
    flex: 1,
    paddingTop: 2,
  },
  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  eventTitle: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  eventTypePill: {
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexShrink: 0,
  },
  eventTypeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  eventMetaText: { fontSize: 11, color: colors.neutral[400] },
  eventMetaDot: { fontSize: 11, color: colors.neutral[300] },
  eventRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
  },

  // ── Comunicados — feed compacto ──
  announcementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
  },
  announcementIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  announcementContent: { flex: 1 },
  announcementTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 2,
  },
  announcementTitle: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.neutral[900],
    lineHeight: 18,
  },
  announcementMessage: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 2,
  },
  announcementDate: {
    fontSize: 11,
    color: colors.neutral[300],
    marginTop: 2,
  },
  announcementRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
  },

  // ── Ver mais ──
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[50],
  },
  seeMoreText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.brand.primary,
  },

  // ── Estados ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.neutral[300],
    textAlign: 'center',
  },
  errorState: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.semantic.danger,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.brand.primarySoft,
    borderRadius: radius.full,
  },
  retryText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.brand.primary,
  },
})
