import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl, Linking,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useBibleSchool, BibleSchoolEnrollment, BibleSchoolMaterial, BibleSchoolSession } from '@/hooks/useBibleSchool'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'

const MATERIAL_ICONS: Record<string, any> = {
  pdf: 'document-text-outline',
  video: 'play-circle-outline',
  link: 'link-outline',
  image: 'image-outline',
  audio: 'musical-note-outline',
  other: 'attach-outline',
}

const STATUS_COLORS: Record<string, string> = {
  active: colors.brand.primary,
  completed: '#059669',
  cancelled: '#DC2626',
  pending: '#D97706',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Em curso',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  pending: 'Pendente',
}

export default function EscolaBiblicaScreen() {
  const insets = useSafeAreaInsets()
  const { enrollments, loading, error, refetch } = useBibleSchool()

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.brand.primary} /></View>
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.neutral[300]} />
        <Text style={styles.emptyTitle}>Erro ao carregar</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (enrollments.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="book-outline" size={48} color={colors.neutral[300]} />
        <Text style={styles.emptyTitle}>Nenhuma turma</Text>
        <Text style={styles.emptyBody}>Você ainda não está matriculado{'\n'}em nenhuma turma da Escola Bíblica.</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} colors={[colors.brand.primary]} tintColor={colors.brand.primary} />}
    >
      {enrollments.map(enrollment => (
        <ClassCard key={enrollment.id} enrollment={enrollment} />
      ))}
    </ScrollView>
  )
}

function ClassCard({ enrollment: e }: { enrollment: BibleSchoolEnrollment }) {
  const statusColor = STATUS_COLORS[e.status] ?? colors.neutral[500]
  const statusLabel = STATUS_LABELS[e.status] ?? e.status

  return (
    <View style={styles.classCard}>
      {/* Cabeçalho da turma */}
      <View style={[styles.classHeader, { backgroundColor: statusColor }]}>
        <View style={styles.classHeaderContent}>
          <Text style={styles.className}>{e.class.name}</Text>
          {e.class.description && (
            <Text style={styles.classDescription} numberOfLines={2}>{e.class.description}</Text>
          )}
        </View>
        <View style={styles.statusPill}>
          <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.classBody}>
        {/* Datas */}
        {(e.class.starts_at || e.class.ends_at) && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.neutral[400]} />
            <Text style={styles.infoText}>
              {e.class.starts_at
                ? format(parseISO(e.class.starts_at), "dd/MM/yyyy", { locale: ptBR })
                : '—'}
              {' → '}
              {e.class.ends_at
                ? format(parseISO(e.class.ends_at), "dd/MM/yyyy", { locale: ptBR })
                : 'Em aberto'}
            </Text>
          </View>
        )}

        {/* Frequência */}
        <View style={styles.attendanceSection}>
          <View style={styles.attendanceLabelRow}>
            <Text style={styles.sectionLabel}>Minha frequência</Text>
            <Text style={[styles.attendancePercent, { color: e.attendanceRate >= 75 ? '#059669' : '#D97706' }]}>
              {e.attendanceRate}%
            </Text>
          </View>
          <View style={styles.attendanceBar}>
            <View style={[styles.attendanceFill, {
              width: `${e.attendanceRate}%` as any,
              backgroundColor: e.attendanceRate >= 75 ? '#059669' : '#D97706',
            }]} />
          </View>
        </View>

        {/* Aulas recentes */}
        {e.sessions.length > 0 && (
          <View>
            <Text style={styles.sectionLabel}>Aulas recentes</Text>
            {e.sessions.slice(0, 5).map(s => <SessionRow key={s.id} session={s} />)}
          </View>
        )}

        {/* Materiais */}
        {e.materials.length > 0 && (
          <View>
            <Text style={styles.sectionLabel}>Materiais</Text>
            {e.materials.map(m => <MaterialRow key={m.id} material={m} />)}
          </View>
        )}
      </View>
    </View>
  )
}

function SessionRow({ session: s }: { session: BibleSchoolSession }) {
  const attended = s.attended
  const icon = attended === true ? 'checkmark-circle' : attended === false ? 'close-circle' : 'ellipse-outline'
  const iconColor = attended === true ? '#059669' : attended === false ? '#DC2626' : colors.neutral[300]

  return (
    <View style={styles.sessionRow}>
      <Ionicons name={icon} size={16} color={iconColor} />
      <Text style={styles.sessionDate}>
        {format(parseISO(s.session_date), 'dd/MM', { locale: ptBR })}
      </Text>
      {s.topic && <Text style={styles.sessionTopic} numberOfLines={1}>{s.topic}</Text>}
    </View>
  )
}

function MaterialRow({ material: m }: { material: BibleSchoolMaterial }) {
  const icon = MATERIAL_ICONS[m.kind] ?? 'attach-outline'

  function handleOpen() {
    if (m.url) Linking.openURL(m.url)
  }

  return (
    <TouchableOpacity
      style={styles.materialRow}
      onPress={handleOpen}
      disabled={!m.url}
      activeOpacity={m.url ? 0.7 : 1}
    >
      <Ionicons name={icon} size={18} color={colors.brand.primary} />
      <Text style={styles.materialTitle} numberOfLines={1}>{m.title}</Text>
      {m.url && <Ionicons name="open-outline" size={14} color={colors.neutral[400]} />}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  content: { padding: spacing.lg, gap: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.neutral[700], marginTop: spacing.sm },
  emptyBody: { fontSize: fontSize.sm, color: colors.neutral[400], textAlign: 'center', lineHeight: 22 },
  retryBtn: { marginTop: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.brand.primarySoft, borderRadius: radius.md },
  retryText: { fontSize: fontSize.sm, color: colors.brand.primary, fontWeight: '600' },
  classCard: {
    backgroundColor: colors.neutral.white, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.neutral[100], overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
  },
  classHeader: { padding: spacing.lg, flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  classHeaderContent: { flex: 1, gap: 4 },
  className: { fontSize: fontSize.lg, fontWeight: '700', color: '#fff' },
  classDescription: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
  statusPill: { backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  classBody: { padding: spacing.lg, gap: spacing.lg },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  infoText: { fontSize: fontSize.sm, color: colors.neutral[600] },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.xs },
  attendanceSection: { gap: spacing.xs },
  attendanceLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  attendancePercent: { fontSize: fontSize.lg, fontWeight: '800' },
  attendanceBar: { height: 8, backgroundColor: colors.neutral[100], borderRadius: 4, overflow: 'hidden' },
  attendanceFill: { height: '100%', borderRadius: 4 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.neutral[50] },
  sessionDate: { fontSize: fontSize.sm, fontWeight: '600', color: colors.neutral[600], width: 36 },
  sessionTopic: { flex: 1, fontSize: fontSize.sm, color: colors.neutral[700] },
  materialRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.neutral[50],
  },
  materialTitle: { flex: 1, fontSize: fontSize.sm, color: colors.neutral[800], fontWeight: '500' },
})
