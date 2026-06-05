import {
  View, Text, SectionList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useWorshipSchedule, WorshipAssignment } from '@/hooks/useWorshipSchedule'
import { useModules } from '@/hooks/useModules'
import { useAuth } from '@/context/AuthContext'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'

const EVENT_TYPE_LABEL: Record<string, string> = {
  service: 'Culto',
  rehearsal: 'Ensaio',
  meeting: 'Reunião',
  special: 'Especial',
}

const STATUS_CONFIG = {
  pending: { label: 'Aguardando', color: '#D97706', icon: 'time-outline' as const },
  confirmed: { label: 'Confirmado', color: '#059669', icon: 'checkmark-circle-outline' as const },
  declined: { label: 'Justificado', color: '#DC2626', icon: 'close-circle-outline' as const },
}

function formatEventDate(iso: string): string {
  const d = parseISO(iso)
  if (isToday(d)) return 'Hoje'
  if (isTomorrow(d)) return 'Amanhã'
  return format(d, "dd 'de' MMMM", { locale: ptBR })
}

function formatEventTime(iso: string): string {
  return format(parseISO(iso), 'HH:mm')
}

export default function LouvorScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { profile } = useAuth()
  const { upcoming, past, loading, error, refetch } = useWorshipSchedule()
  const { modules } = useModules(profile?.tenant_id)
  const worshipModule = modules.find(m => m.slug === 'worship')
  const isAdmin = worshipModule?.isAdmin ?? false

  const sections = [
    ...(upcoming.length > 0 ? [{ title: 'Próximas escalas', data: upcoming }] : []),
    ...(past.length > 0 ? [{ title: 'Histórico', data: past }] : []),
  ]

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.neutral[300]} />
        <Text style={styles.emptyTitle}>Erro ao carregar escalas</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (sections.length === 0) {
    return (
      <View style={styles.center}>
        {isAdmin && (
          <TouchableOpacity
            style={styles.adminBtn}
            onPress={() => router.push('/(app)/modulos/louvor/admin' as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="settings-outline" size={18} color="#fff" />
            <Text style={styles.adminBtnText}>Administrar módulo</Text>
          </TouchableOpacity>
        )}
        <Ionicons name="musical-notes-outline" size={48} color={colors.neutral[300]} />
        <Text style={styles.emptyTitle}>Nenhuma escala</Text>
        <Text style={styles.emptyBody}>Você ainda não está em nenhuma escala cadastrada.</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
    {isAdmin && (
      <TouchableOpacity
        style={styles.adminBanner}
        onPress={() => router.push('/(app)/modulos/louvor/admin' as any)}
        activeOpacity={0.85}
      >
        <Ionicons name="settings-outline" size={16} color={colors.brand.primary} />
        <Text style={styles.adminBannerText}>Administrar módulo</Text>
        <Ionicons name="chevron-forward-outline" size={16} color={colors.brand.primary} />
      </TouchableOpacity>
    )}
    <SectionList
      sections={sections}
      keyExtractor={item => item.id}
      contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.xl }]}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refetch} colors={[colors.brand.primary]} tintColor={colors.brand.primary} />
      }
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <AssignmentCard
          assignment={item}
          onPress={() => router.push(`/(app)/modulos/louvor/escala/${item.id}` as any)}
        />
      )}
      stickySectionHeadersEnabled={false}
    />
    </View>
  )
}

function AssignmentCard({ assignment: a, onPress }: { assignment: WorshipAssignment; onPress: () => void }) {
  const statusCfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.pending
  const isPast = new Date(a.event.starts_at) < new Date()

  return (
    <TouchableOpacity style={[styles.card, isPast && styles.cardPast]} onPress={onPress} activeOpacity={0.8}>
      {/* Linha de topo: data + tipo */}
      <View style={styles.cardTop}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateDay}>{format(parseISO(a.event.starts_at), 'dd')}</Text>
          <Text style={styles.dateMonth}>{format(parseISO(a.event.starts_at), 'MMM', { locale: ptBR })}</Text>
        </View>
        <View style={styles.cardMain}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{a.event.title}</Text>
            <View style={[styles.typeBadge, { backgroundColor: colors.brand.primarySoft }]}>
              <Text style={styles.typeText}>{EVENT_TYPE_LABEL[a.event.event_type] ?? 'Evento'}</Text>
            </View>
          </View>
          <View style={styles.cardMeta}>
            <Ionicons name="time-outline" size={13} color={colors.neutral[400]} />
            <Text style={styles.metaText}>{formatEventDate(a.event.starts_at)} • {formatEventTime(a.event.starts_at)}</Text>
          </View>
          {a.event.location && (
            <View style={styles.cardMeta}>
              <Ionicons name="location-outline" size={13} color={colors.neutral[400]} />
              <Text style={styles.metaText} numberOfLines={1}>{a.event.location}</Text>
            </View>
          )}
          {a.role_name && (
            <View style={styles.cardMeta}>
              <Ionicons name="musical-notes-outline" size={13} color={colors.neutral[400]} />
              <Text style={styles.metaText}>{a.role_name}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Rodapé: status */}
      <View style={[styles.cardFooter, { borderTopColor: colors.neutral[100] }]}>
        <Ionicons name={statusCfg.icon} size={15} color={statusCfg.color} />
        <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        {!isPast && a.status === 'pending' && (
          <View style={styles.actionHint}>
            <Text style={styles.actionHintText}>Responder →</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.neutral[700], marginTop: spacing.sm },
  emptyBody: { fontSize: fontSize.sm, color: colors.neutral[400], textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.brand.primarySoft,
    borderRadius: radius.md,
  },
  retryText: { fontSize: fontSize.sm, color: colors.brand.primary, fontWeight: '600' },
  adminBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.brand.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.lg, marginBottom: spacing.md,
  },
  adminBtnText: { fontSize: fontSize.sm, color: '#fff', fontWeight: '700' },
  adminBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.brand.primarySoft, padding: spacing.md,
    marginHorizontal: spacing.lg, marginTop: spacing.sm, borderRadius: radius.md,
  },
  adminBannerText: { flex: 1, fontSize: fontSize.sm, color: colors.brand.primary, fontWeight: '600' },
  list: { paddingTop: spacing.sm },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutral[50],
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    backgroundColor: colors.neutral.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPast: { opacity: 0.65 },
  cardTop: { flexDirection: 'row', padding: spacing.md, gap: spacing.md },
  dateBadge: {
    width: 44,
    height: 52,
    backgroundColor: colors.brand.primarySoft,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dateDay: { fontSize: fontSize.xl, fontWeight: '700', color: colors.brand.primary, lineHeight: 24 },
  dateMonth: { fontSize: fontSize.xs, fontWeight: '600', color: colors.brand.primary, textTransform: 'uppercase' },
  cardMain: { flex: 1, gap: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  cardTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.neutral[950], flex: 1 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.sm },
  typeText: { fontSize: 11, fontWeight: '600', color: colors.brand.primary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: fontSize.xs, color: colors.neutral[500] },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  statusText: { fontSize: fontSize.sm, fontWeight: '600', flex: 1 },
  actionHint: { paddingHorizontal: spacing.sm, paddingVertical: 3, backgroundColor: colors.brand.primary, borderRadius: radius.sm },
  actionHintText: { fontSize: 11, color: '#fff', fontWeight: '600' },
})
