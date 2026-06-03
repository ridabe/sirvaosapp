import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { format, parseISO, differenceInYears } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useKids, KidsChild, KidsCommunication } from '@/hooks/useKids'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'

function calcAge(dob: string | null): string {
  if (!dob) return ''
  const years = differenceInYears(new Date(), parseISO(dob))
  return `${years} ${years === 1 ? 'ano' : 'anos'}`
}

export default function KidsScreen() {
  const insets = useSafeAreaInsets()
  const { children, communications, loading, error, refetch } = useKids()

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

  if (children.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="happy-outline" size={48} color={colors.neutral[300]} />
        <Text style={styles.emptyTitle}>Nenhuma criança vinculada</Text>
        <Text style={styles.emptyBody}>Fale com o responsável do ministério Kids{'\n'}para vincular seus filhos.</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} colors={[colors.brand.primary]} tintColor={colors.brand.primary} />}
    >
      {/* Crianças */}
      <SectionHeader title="Meus filhos" icon="people-outline" />
      {children.map(child => <ChildCard key={child.id} child={child} />)}

      {/* Comunicados */}
      {communications.length > 0 && (
        <>
          <SectionHeader title="Comunicados" icon="megaphone-outline" />
          {communications.map(c => <CommunicationCard key={c.id} item={c} />)}
        </>
      )}
    </ScrollView>
  )
}

function SectionHeader({ title, icon }: { title: string; icon: any }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color={colors.neutral[500]} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  )
}

function ChildCard({ child }: { child: KidsChild }) {
  const groupColor = child.group?.color ?? colors.brand.primary
  const age = calcAge(child.date_of_birth)

  return (
    <View style={[styles.childCard, { borderLeftColor: groupColor }]}>
      {/* Avatar inicial */}
      <View style={[styles.childAvatar, { backgroundColor: groupColor + '22' }]}>
        <Text style={[styles.childInitial, { color: groupColor }]}>
          {child.name[0]?.toUpperCase()}
        </Text>
      </View>

      <View style={styles.childInfo}>
        <View style={styles.childTopRow}>
          <Text style={styles.childName}>{child.name}</Text>
          {!child.is_active && (
            <View style={styles.inactivePill}>
              <Text style={styles.inactivePillText}>Inativo</Text>
            </View>
          )}
        </View>

        {age && (
          <View style={styles.childMeta}>
            <Ionicons name="person-outline" size={12} color={colors.neutral[400]} />
            <Text style={styles.metaText}>{age}</Text>
          </View>
        )}

        {child.group && (
          <View style={styles.childMeta}>
            <Ionicons name="people-outline" size={12} color={colors.neutral[400]} />
            <Text style={styles.metaText}>Turma: {child.group.name}</Text>
          </View>
        )}

        {/* Frequência últimas 12 semanas */}
        <View style={styles.attendanceRow}>
          <Ionicons name="checkmark-circle-outline" size={12} color={colors.neutral[400]} />
          <Text style={styles.metaText}>
            {child.attendanceCount} {child.attendanceCount === 1 ? 'presença' : 'presenças'} (últimas 12 semanas)
          </Text>
        </View>

        {/* Alertas */}
        {child.allergies && (
          <View style={styles.alertRow}>
            <Ionicons name="warning-outline" size={13} color="#D97706" />
            <Text style={styles.alertText}>Alergias: {child.allergies}</Text>
          </View>
        )}
        {child.special_needs && (
          <View style={styles.alertRow}>
            <Ionicons name="heart-outline" size={13} color="#7C3AED" />
            <Text style={styles.alertText}>Necessidades: {child.special_needs}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

function CommunicationCard({ item }: { item: KidsCommunication }) {
  return (
    <View style={styles.commCard}>
      <View style={styles.commHeader}>
        <Text style={styles.commTitle}>{item.title}</Text>
        <Text style={styles.commDate}>
          {format(parseISO(item.sent_at), "dd/MM/yyyy", { locale: ptBR })}
        </Text>
      </View>
      <Text style={styles.commMessage}>{item.message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  content: { padding: spacing.lg, gap: spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.neutral[700], marginTop: spacing.sm },
  emptyBody: { fontSize: fontSize.sm, color: colors.neutral[400], textAlign: 'center', lineHeight: 22 },
  retryBtn: { marginTop: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.brand.primarySoft, borderRadius: radius.md },
  retryText: { fontSize: fontSize.sm, color: colors.brand.primary, fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginTop: spacing.md, marginBottom: spacing.xs,
  },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.8 },
  childCard: {
    backgroundColor: colors.neutral.white, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.neutral[100], borderLeftWidth: 4,
    flexDirection: 'row', padding: spacing.md, gap: spacing.md,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3,
  },
  childAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  childInitial: { fontSize: fontSize.xl, fontWeight: '800' },
  childInfo: { flex: 1, gap: 4 },
  childTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  childName: { flex: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.neutral[950] },
  inactivePill: { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: colors.neutral[100], borderRadius: radius.sm },
  inactivePillText: { fontSize: 10, fontWeight: '600', color: colors.neutral[500] },
  childMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: fontSize.xs, color: colors.neutral[500] },
  attendanceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  alertRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 2 },
  alertText: { flex: 1, fontSize: fontSize.xs, color: colors.neutral[600] },
  commCard: {
    backgroundColor: colors.neutral.white, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.neutral[100], padding: spacing.md, gap: spacing.xs,
  },
  commHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  commTitle: { flex: 1, fontSize: fontSize.md, fontWeight: '600', color: colors.neutral[950] },
  commDate: { fontSize: fontSize.xs, color: colors.neutral[400] },
  commMessage: { fontSize: fontSize.sm, color: colors.neutral[600], lineHeight: 20 },
})
