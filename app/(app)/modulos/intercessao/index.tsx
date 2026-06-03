import {
  View, Text, SectionList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useIntercession, PrayerAssignment, MyPrayerRequest } from '@/hooks/useIntercession'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'

const ACCENT = '#8B5CF6'

const REQUEST_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new:         { label: 'Aguardando um intercessor',            color: '#3578A8' },
  assigned:    { label: 'O intercessor já está com seu pedido', color: '#e08b00' },
  interceding: { label: 'Alguém está orando por você agora',    color: '#c07000' },
  done:        { label: 'Seu pedido foi intercedido 🙏',         color: '#2F8A5F' },
}

// Labels para designações do intercessor
const ASSIGNMENT_STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:    { label: 'Pendente',     color: '#3578A8',  icon: 'time-outline' },
  interceding:{ label: 'Intercedendo', color: '#c07000',  icon: 'radio-button-on-outline' },
}

type Section =
  | { title: string; kind: 'assignment'; data: PrayerAssignment[] }
  | { title: string; kind: 'request';    data: MyPrayerRequest[]  }

export default function IntercessaoScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { assignments, myRequests, loading, error, refetch } = useIntercession()

  const sections: Section[] = [
    ...(assignments.length > 0
      ? [{ title: 'Minha intercessão', kind: 'assignment' as const, data: assignments }]
      : []),
    ...(myRequests.length > 0
      ? [{ title: 'Meus pedidos',      kind: 'request'    as const, data: myRequests  }]
      : []),
  ]

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    )
  }

  if (error && sections.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.neutral[300]} />
        <Text style={styles.emptyTitle}>Erro ao carregar dados</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (sections.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="hand-right-outline" size={48} color={colors.neutral[300]} />
        <Text style={styles.emptyTitle}>Nenhum dado ainda</Text>
        <Text style={styles.emptyBody}>
          Seus pedidos enviados e as designações de oração aparecerão aqui.
        </Text>
      </View>
    )
  }

  return (
    <SectionList
      sections={sections as any}
      keyExtractor={(item: any) => item.id}
      contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.xxl }]}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refetch} colors={[ACCENT]} tintColor={ACCENT} />
      }
      renderSectionHeader={({ section }: any) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{(section as Section).title}</Text>
        </View>
      )}
      renderItem={({ item, section }: any) =>
        (section as Section).kind === 'assignment' ? (
          <AssignmentCard
            assignment={item}
            onPress={() => router.push(`/(app)/modulos/intercessao/pedido/${item.prayer_request_id}` as any)}
          />
        ) : (
          <RequestCard
            request={item}
            onPress={() => router.push(`/(app)/modulos/intercessao/pedido/${item.id}` as any)}
          />
        )
      }
      stickySectionHeadersEnabled={false}
    />
  )
}

function AssignmentCard({ assignment: a, onPress }: { assignment: PrayerAssignment; onPress: () => void }) {
  const cfg = ASSIGNMENT_STATUS_CONFIG[a.status] ?? ASSIGNMENT_STATUS_CONFIG.pending

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Ionicons name="hand-right-outline" size={16} color={ACCENT} />
          <Text style={styles.cardText} numberOfLines={2}>
            {a.prayer_requests?.content ?? 'Pedido de oração'}
          </Text>
          {a.prayer_requests?.is_anonymous && (
            <Ionicons name="eye-off-outline" size={14} color={colors.neutral[400]} />
          )}
        </View>
        <Text style={styles.cardDate}>
          Designado em {format(parseISO(a.assigned_at), 'dd/MM/yyyy', { locale: ptBR })}
        </Text>
      </View>
      <View style={[styles.cardFooter, { borderTopColor: colors.neutral[100] }]}>
        <Ionicons name={cfg.icon} size={14} color={cfg.color} />
        <Text style={[styles.footerStatus, { color: cfg.color }]}>{cfg.label}</Text>
        <View style={styles.actionHint}>
          <Text style={styles.actionHintText}>Ver e responder →</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

function RequestCard({ request: r, onPress }: { request: MyPrayerRequest; onPress: () => void }) {
  const cfg = REQUEST_STATUS_CONFIG[r.status] ?? REQUEST_STATUS_CONFIG.new

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardContent}>
        <Text style={styles.cardText} numberOfLines={2}>{r.content}</Text>
        <Text style={styles.cardDate}>
          {format(parseISO(r.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </Text>
        {/* Mensagem contextual igual ao web */}
        {r.status === 'assigned' && (
          <Text style={[styles.statusNote, { color: '#e08b00' }]}>
            Um intercessor recebeu seu pedido e vai orar por você.
          </Text>
        )}
        {r.status === 'interceding' && (
          <Text style={[styles.statusNote, { color: '#c07000' }]}>
            Neste momento alguém está intercedendo pelo seu pedido.
          </Text>
        )}
        {r.status === 'done' && (
          <Text style={[styles.statusNote, { color: colors.semantic.success }]}>
            Seu pedido foi intercedido. Que Deus atenda! 🙏
          </Text>
        )}
      </View>
      <View style={[styles.cardFooter, { borderTopColor: colors.neutral[100] }]}>
        <View style={[styles.statusBadge, { backgroundColor: cfg.color + '18' }]}>
          <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, padding: spacing.xl,
  },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.neutral[700], marginTop: spacing.sm },
  emptyBody: { fontSize: fontSize.sm, color: colors.neutral[400], textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    marginTop: spacing.md, paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm, backgroundColor: '#EDE9FE', borderRadius: radius.md,
  },
  retryText: { fontSize: fontSize.sm, color: ACCENT, fontWeight: '600' },
  list: { paddingTop: spacing.sm },
  sectionHeader: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    backgroundColor: colors.neutral[50],
  },
  sectionTitle: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.neutral[500],
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  card: {
    marginHorizontal: spacing.lg, marginVertical: spacing.xs,
    backgroundColor: colors.neutral.white, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.neutral[100], overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardContent: { padding: spacing.md, gap: spacing.xs },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  cardText: { flex: 1, fontSize: fontSize.sm, color: colors.neutral[800], lineHeight: 20 },
  cardDate: { fontSize: fontSize.xs, color: colors.neutral[400] },
  statusNote: { fontSize: fontSize.xs, fontWeight: '600', marginTop: 2 },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: 10, borderTopWidth: 1,
  },
  footerStatus: { fontSize: fontSize.sm, fontWeight: '600', flex: 1 },
  actionHint: {
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    backgroundColor: ACCENT, borderRadius: radius.sm,
  },
  actionHintText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  statusBadge: {
    alignSelf: 'flex-start', paddingHorizontal: spacing.sm,
    paddingVertical: 3, borderRadius: radius.sm,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
})
