import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert,
  TouchableOpacity, RefreshControl, Modal, LayoutAnimation,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { format, parseISO, differenceInYears } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState } from 'react'
import QRCode from 'react-native-qrcode-svg'
import { useKids, KidsChild, KidsCommunication } from '@/hooks/useKids'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'

function calcAgeLabel(dob: string | null): string {
  if (!dob) return ''
  const years = differenceInYears(new Date(), parseISO(dob))
  return `${years} ${years === 1 ? 'ano' : 'anos'}`
}

type QRTarget = { child: KidsChild; token: string }

export default function KidsScreen() {
  const insets = useSafeAreaInsets()
  const { children, communications, loading, error, refetch, generatePass } = useKids()
  const [qrTarget, setQrTarget] = useState<QRTarget | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)

  const handleGenerateQR = async (child: KidsChild) => {
    setGeneratingId(child.id)
    const token = await generatePass(child.id)
    setGeneratingId(null)
    if (token) {
      setQrTarget({ child, token })
    } else {
      Alert.alert('Erro', 'Não foi possível gerar o QR Code. Verifique sua conexão e tente novamente.')
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.brand.primary} /></View>
  }

  if (error && children.length === 0) {
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
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} colors={[colors.brand.primary]} tintColor={colors.brand.primary} />
        }
      >
        {error && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={14} color="#92400E" />
            <Text style={styles.offlineText}>{error}</Text>
          </View>
        )}

        <SectionHeader title="Meus filhos" icon="people-outline" accentColor={colors.brand.primary} />

        {children.map(child => (
          <ChildCard
            key={child.id}
            child={child}
            generatingQR={generatingId === child.id}
            onGenerateQR={() => handleGenerateQR(child)}
          />
        ))}

        {communications.length > 0 && (
          <>
            <SectionHeader title="Comunicados" icon="megaphone-outline" accentColor={colors.brand.accent} />
            {communications.map(c => <CommunicationCard key={c.id} item={c} />)}
          </>
        )}
      </ScrollView>

      <Modal visible={!!qrTarget} transparent animationType="fade" onRequestClose={() => setQrTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{qrTarget?.child.name}</Text>
              <TouchableOpacity onPress={() => setQrTarget(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalMeta}>
              {qrTarget?.child.date_of_birth && (
                <View style={styles.metaChip}>
                  <Ionicons name="person-outline" size={12} color={colors.neutral[500]} />
                  <Text style={styles.metaChipText}>{calcAgeLabel(qrTarget.child.date_of_birth)}</Text>
                </View>
              )}
              {qrTarget?.child.group ? (
                <View style={[styles.metaChip, { backgroundColor: (qrTarget.child.group.color ?? colors.brand.primary) + '22' }]}>
                  <Ionicons name="people-outline" size={12} color={qrTarget.child.group.color ?? colors.brand.primary} />
                  <Text style={[styles.metaChipText, { color: qrTarget.child.group.color ?? colors.brand.primary }]}>
                    {qrTarget.child.group.name}
                  </Text>
                </View>
              ) : (
                <View style={[styles.metaChip, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="alert-circle-outline" size={12} color="#D97706" />
                  <Text style={[styles.metaChipText, { color: '#D97706' }]}>Sem turma</Text>
                </View>
              )}
            </View>

            {qrTarget?.child.allergies && (
              <View style={styles.alertRow}>
                <Ionicons name="warning-outline" size={13} color="#D97706" />
                <Text style={styles.alertText}>Alergias: {qrTarget.child.allergies}</Text>
              </View>
            )}
            {qrTarget?.child.special_needs && (
              <View style={styles.alertRow}>
                <Ionicons name="heart-outline" size={13} color="#7C3AED" />
                <Text style={styles.alertText}>Necessidades: {qrTarget.child.special_needs}</Text>
              </View>
            )}

            <View style={styles.qrWrapper}>
              {qrTarget && <QRCode value={qrTarget.token} size={200} />}
            </View>
            <Text style={styles.qrCaption}>Mostre ao professor para registrar a presença</Text>
            <View style={styles.tokenBox}>
              <Text style={styles.tokenLabel}>Token manual</Text>
              <Text style={styles.tokenValue} selectable>
                {qrTarget ? `${qrTarget.token.slice(0, 3)}-${qrTarget.token.slice(3)}` : ''}
              </Text>
              <Text style={styles.tokenHint}>Use se a câmera não funcionar</Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

// ── Subcomponentes ──────────────────────────────────────────────────────────

function SectionHeader({ title, icon, accentColor }: { title: string; icon: any; accentColor: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <Ionicons name={icon} size={15} color={accentColor} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  )
}

function ChildCard({ child, generatingQR, onGenerateQR }: {
  child: KidsChild
  generatingQR: boolean
  onGenerateQR: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const groupColor = child.group?.color ?? colors.brand.primary

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpanded(e => !e)
  }

  return (
    <View style={[styles.childCard, { borderLeftColor: groupColor }]}>
      <TouchableOpacity style={styles.childCardHeader} onPress={toggle} activeOpacity={0.8}>
        <View style={[styles.childAvatar, { backgroundColor: groupColor + '22' }]}>
          <Text style={[styles.childInitial, { color: groupColor }]}>{child.name[0]?.toUpperCase()}</Text>
        </View>
        <View style={styles.childHeaderInfo}>
          <View style={styles.childTopRow}>
            <Text style={styles.childName}>{child.name}</Text>
            {!child.is_active && (
              <View style={styles.inactivePill}><Text style={styles.inactivePillText}>Inativo</Text></View>
            )}
          </View>
          <Text style={styles.childSubline}>
            {calcAgeLabel(child.date_of_birth)}
            {calcAgeLabel(child.date_of_birth) && child.group ? ' · ' : ''}
            {child.group ? child.group.name : (!calcAgeLabel(child.date_of_birth) ? 'Sem turma' : '')}
          </Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.neutral[400]} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.childDetails}>
          <View style={styles.detailDivider} />
          <View style={styles.childMeta}>
            <Ionicons name="checkmark-circle-outline" size={13} color={colors.neutral[400]} />
            <Text style={styles.metaText}>
              {child.attendanceCount} {child.attendanceCount === 1 ? 'presença' : 'presenças'} (últimas 12 semanas)
            </Text>
          </View>
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
          <TouchableOpacity style={styles.qrBtn} onPress={onGenerateQR} disabled={generatingQR} activeOpacity={0.7}>
            {generatingQR
              ? <ActivityIndicator size={14} color={colors.brand.primary} />
              : <Ionicons name="qr-code-outline" size={14} color={colors.brand.primary} />
            }
            <Text style={styles.qrBtnText}>{generatingQR ? 'Gerando…' : 'Gerar QR Code'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

function CommunicationCard({ item }: { item: KidsCommunication }) {
  const [expanded, setExpanded] = useState(false)
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpanded(e => !e)
  }
  return (
    <TouchableOpacity style={styles.commCard} onPress={toggle} activeOpacity={0.8}>
      <View style={styles.commHeader}>
        <Text style={styles.commTitle} numberOfLines={expanded ? undefined : 1}>{item.title}</Text>
        <View style={styles.commRight}>
          <Text style={styles.commDate}>{format(parseISO(item.sent_at), 'dd/MM', { locale: ptBR })}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.neutral[400]} />
        </View>
      </View>
      {expanded && <Text style={styles.commMessage}>{item.message}</Text>}
    </TouchableOpacity>
  )
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  content: { padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.neutral[700], marginTop: spacing.sm },
  emptyBody: { fontSize: fontSize.sm, color: colors.neutral[400], textAlign: 'center', lineHeight: 22 },
  retryBtn: { marginTop: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.brand.primarySoft, borderRadius: radius.md },
  retryText: { fontSize: fontSize.sm, color: colors.brand.primary, fontWeight: '600' },
  offlineBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF3C7', borderRadius: radius.sm, padding: spacing.sm },
  offlineText: { fontSize: fontSize.xs, color: '#92400E', flex: 1 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  accentBar: { width: 3, height: 16, borderRadius: 2 },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: '700', color: colors.neutral[600], textTransform: 'uppercase', letterSpacing: 0.8 },

  childCard: {
    backgroundColor: colors.neutral.white, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.neutral[100], borderLeftWidth: 4, overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  childCardHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  childAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  childInitial: { fontSize: fontSize.xl, fontWeight: '800' },
  childHeaderInfo: { flex: 1 },
  childTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  childName: { flex: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.neutral[950] },
  childSubline: { fontSize: fontSize.xs, color: colors.neutral[500], marginTop: 2 },
  inactivePill: { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: colors.neutral[100], borderRadius: radius.sm },
  inactivePillText: { fontSize: 10, fontWeight: '600', color: colors.neutral[500] },

  childDetails: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: 6 },
  detailDivider: { height: 1, backgroundColor: colors.neutral[100], marginBottom: spacing.xs },
  childMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: fontSize.xs, color: colors.neutral[500] },
  alertRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  alertText: { flex: 1, fontSize: fontSize.xs, color: colors.neutral[600] },
  qrBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: spacing.xs, alignSelf: 'flex-start',
    paddingHorizontal: spacing.md, paddingVertical: 7,
    backgroundColor: colors.brand.primarySoft, borderRadius: radius.md,
  },
  qrBtnText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.brand.primary },

  commCard: {
    backgroundColor: colors.neutral.white, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.neutral[100], padding: spacing.md, gap: spacing.xs,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2,
  },
  commHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  commTitle: { flex: 1, fontSize: fontSize.sm, fontWeight: '600', color: colors.neutral[950] },
  commRight: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  commDate: { fontSize: fontSize.xs, color: colors.neutral[400] },
  commMessage: { fontSize: fontSize.sm, color: colors.neutral[600], lineHeight: 20, marginTop: spacing.xs },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  modalCard: { backgroundColor: colors.neutral.white, borderRadius: radius.xl, padding: spacing.xl, width: '100%', maxWidth: 360, alignItems: 'center', gap: spacing.sm },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.neutral[950] },
  modalMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.neutral[100], borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  metaChipText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.neutral[600] },
  qrWrapper: { marginVertical: spacing.lg, padding: spacing.md, backgroundColor: '#fff', borderRadius: radius.md, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  qrCaption: { fontSize: fontSize.sm, color: colors.neutral[500], textAlign: 'center', lineHeight: 20 },
  tokenBox: { width: '100%', marginTop: spacing.xs, backgroundColor: colors.neutral[50], borderRadius: radius.md, borderWidth: 1, borderColor: colors.neutral[200], padding: spacing.sm, alignItems: 'center', gap: 4 },
  tokenLabel: { fontSize: fontSize.xs, color: colors.neutral[400], fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  tokenValue: { fontSize: 26, fontWeight: '800', color: colors.neutral[800], letterSpacing: 6, textAlign: 'center' },
  tokenHint: { fontSize: fontSize.xs, color: colors.neutral[400], textAlign: 'center', lineHeight: 16 },
})
