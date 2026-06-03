import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, TextInput, ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useWorshipSchedule, WorshipAssignment } from '@/hooks/useWorshipSchedule'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'

const EVENT_TYPE_LABEL: Record<string, string> = {
  service: 'Culto',
  rehearsal: 'Ensaio',
  meeting: 'Reunião',
  special: 'Especial',
}

function formatFullDate(iso: string): string {
  const d = parseISO(iso)
  if (isToday(d)) return `Hoje, ${format(d, 'HH:mm')}`
  if (isTomorrow(d)) return `Amanhã, ${format(d, 'HH:mm')}`
  return format(d, "EEEE, dd 'de' MMMM • HH:mm", { locale: ptBR })
}

export default function EscalaDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { upcoming, past, loading, markViewed, respond } = useWorshipSchedule()

  const [responding, setResponding] = useState(false)
  const [declineModalVisible, setDeclineModalVisible] = useState(false)
  const [declineReason, setDeclineReason] = useState('')

  const assignment: WorshipAssignment | undefined =
    [...upcoming, ...past].find(a => a.id === id)

  useEffect(() => {
    if (id) markViewed(id)
  }, [id])

  async function handleConfirm() {
    setResponding(true)
    try {
      await respond(id, 'confirmed')
      Alert.alert('Presença confirmada!', 'Sua presença foi registrada com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch {
      Alert.alert('Erro', 'Não foi possível confirmar. Tente novamente.')
    } finally {
      setResponding(false)
    }
  }

  async function handleDecline() {
    if (!declineReason.trim()) {
      Alert.alert('Motivo obrigatório', 'Por favor, informe o motivo da ausência.')
      return
    }
    setResponding(true)
    try {
      await respond(id, 'declined', declineReason.trim())
      setDeclineModalVisible(false)
      Alert.alert('Justificativa enviada', 'Sua justificativa foi registrada.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a justificativa.')
    } finally {
      setResponding(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    )
  }

  if (!assignment) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.neutral[300]} />
        <Text style={styles.emptyTitle}>Escala não encontrada</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const ev = assignment.event
  const isEventPast = isPast(parseISO(ev.starts_at))
  const canRespond = !isEventPast && assignment.status === 'pending'
  const alreadyResponded = assignment.status !== 'pending'

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho do evento */}
        <View style={styles.eventHeader}>
          <View style={[styles.typePill, { backgroundColor: colors.brand.primarySoft }]}>
            <Text style={styles.typePillText}>{EVENT_TYPE_LABEL[ev.event_type] ?? 'Evento'}</Text>
          </View>
          <Text style={styles.eventTitle}>{ev.title}</Text>
          <Text style={styles.eventDate}>{formatFullDate(ev.starts_at)}</Text>
          {ev.ends_at && (
            <Text style={styles.eventDateSub}>Término: {format(parseISO(ev.ends_at), 'HH:mm')}</Text>
          )}
        </View>

        {/* Detalhes */}
        <View style={styles.card}>
          {assignment.role_name && (
            <DetailRow icon="musical-notes-outline" label="Função" value={assignment.role_name} />
          )}
          {ev.location && (
            <DetailRow icon="location-outline" label="Local" value={ev.location} />
          )}
          {assignment.arrival_at && (
            <DetailRow
              icon="log-in-outline"
              label="Chegada solicitada"
              value={format(parseISO(assignment.arrival_at), 'HH:mm')}
            />
          )}
          {ev.notes && (
            <DetailRow icon="document-text-outline" label="Observações do evento" value={ev.notes} />
          )}
          {assignment.notes && (
            <DetailRow icon="chatbubble-outline" label="Observações da escala" value={assignment.notes} />
          )}
        </View>

        {/* Status atual */}
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Status da sua resposta</Text>
          <StatusBadge status={assignment.status} />
          {assignment.decline_reason && (
            <View style={styles.declineReasonBox}>
              <Text style={styles.declineReasonLabel}>Motivo informado:</Text>
              <Text style={styles.declineReasonText}>{assignment.decline_reason}</Text>
            </View>
          )}
          {assignment.responded_at && (
            <Text style={styles.respondedAt}>
              Respondido em {format(parseISO(assignment.responded_at), "dd/MM/yyyy 'às' HH:mm")}
            </Text>
          )}
        </View>

        {/* Ações */}
        {canRespond && (
          <View style={styles.actions}>
            <Text style={styles.actionsLabel}>Como você estará nessa escala?</Text>
            <TouchableOpacity
              style={[styles.actionBtn, styles.confirmBtn]}
              onPress={handleConfirm}
              disabled={responding}
              activeOpacity={0.8}
            >
              {responding ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.confirmBtnText}>Confirmar presença</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={() => setDeclineModalVisible(true)}
              disabled={responding}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={20} color={colors.semantic.danger} />
              <Text style={styles.declineBtnText}>Justificar ausência</Text>
            </TouchableOpacity>
          </View>
        )}

        {alreadyResponded && !isEventPast && (
          <View style={styles.changeHint}>
            <Ionicons name="information-circle-outline" size={16} color={colors.neutral[400]} />
            <Text style={styles.changeHintText}>
              Já respondeu? Fale com o líder do ministério para alterações.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal de justificativa */}
      <Modal
        visible={declineModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDeclineModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Justificar ausência</Text>
            <Text style={styles.modalSubtitle}>
              Informe o motivo para que o líder do ministério possa reorganizar a escala.
            </Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Ex: Compromisso de trabalho, viagem..."
              placeholderTextColor={colors.neutral[400]}
              multiline
              numberOfLines={4}
              value={declineReason}
              onChangeText={setDeclineReason}
              maxLength={300}
            />
            <Text style={styles.charCount}>{declineReason.length}/300</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setDeclineModalVisible(false)}
                disabled={responding}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleDecline}
                disabled={responding}
                activeOpacity={0.8}
              >
                {responding
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalConfirmText}>Enviar justificativa</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  )
}

function DetailRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={colors.neutral[400]} style={styles.detailIcon} />
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = {
    pending: { label: 'Aguardando resposta', color: '#D97706', bg: '#FEF3C7', icon: 'time-outline' as const },
    confirmed: { label: 'Presença confirmada', color: '#059669', bg: '#D1FAE5', icon: 'checkmark-circle-outline' as const },
    declined: { label: 'Ausência justificada', color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline' as const },
  }[status] ?? { label: status, color: colors.neutral[500], bg: colors.neutral[100], icon: 'help-outline' as const }

  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon} size={18} color={cfg.color} />
      <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  content: { gap: spacing.md, padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.neutral[700] },
  backBtn: { marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, backgroundColor: colors.brand.primarySoft, borderRadius: radius.md },
  backBtnText: { color: colors.brand.primary, fontWeight: '600' },

  eventHeader: {
    backgroundColor: colors.brand.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  typePill: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  typePillText: { fontSize: 11, fontWeight: '700', color: colors.brand.primary },
  eventTitle: { fontSize: fontSize.xl, fontWeight: '700', color: '#fff', marginTop: 4 },
  eventDate: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.85)', marginTop: 2, textTransform: 'capitalize' },
  eventDateSub: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.6)' },

  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    overflow: 'hidden',
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.neutral[50] },
  detailIcon: { marginTop: 1, marginRight: spacing.md, width: 20 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: fontSize.xs, color: colors.neutral[400], fontWeight: '500', marginBottom: 2 },
  detailValue: { fontSize: fontSize.md, color: colors.neutral[800] },

  statusCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    padding: spacing.lg,
    gap: spacing.sm,
  },
  statusLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md },
  statusBadgeText: { fontSize: fontSize.md, fontWeight: '600' },
  declineReasonBox: { backgroundColor: colors.neutral[50], borderRadius: radius.md, padding: spacing.sm },
  declineReasonLabel: { fontSize: fontSize.xs, color: colors.neutral[400], marginBottom: 2 },
  declineReasonText: { fontSize: fontSize.sm, color: colors.neutral[700] },
  respondedAt: { fontSize: fontSize.xs, color: colors.neutral[400] },

  actions: {
    backgroundColor: colors.neutral.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    padding: spacing.lg,
    gap: spacing.md,
  },
  actionsLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.neutral[700], textAlign: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg },
  confirmBtn: { backgroundColor: colors.brand.primary },
  confirmBtnText: { fontSize: fontSize.md, fontWeight: '700', color: '#fff' },
  declineBtn: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  declineBtnText: { fontSize: fontSize.md, fontWeight: '600', color: colors.semantic.danger },

  changeHint: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.neutral[100], borderRadius: radius.md },
  changeHintText: { flex: 1, fontSize: fontSize.xs, color: colors.neutral[500] },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.neutral[200], borderRadius: 2, alignSelf: 'center', marginBottom: spacing.xs },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.neutral[950] },
  modalSubtitle: { fontSize: fontSize.sm, color: colors.neutral[500], lineHeight: 20 },
  reasonInput: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.neutral[950],
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: fontSize.xs, color: colors.neutral[400], textAlign: 'right' },
  modalActions: { flexDirection: 'row', gap: spacing.md },
  modalCancelBtn: { flex: 1, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.neutral[100], alignItems: 'center' },
  modalCancelText: { fontSize: fontSize.md, fontWeight: '600', color: colors.neutral[600] },
  modalConfirmBtn: { flex: 2, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.semantic.danger, alignItems: 'center' },
  modalConfirmText: { fontSize: fontSize.md, fontWeight: '700', color: '#fff' },
})
