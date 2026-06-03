import { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useIntercession } from '@/hooks/useIntercession'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'

const ACCENT = '#8B5CF6'

// Idêntico ao web (MemberPortal.tsx statusMap)
const REQUEST_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  new:         { label: 'Aguardando um intercessor',            color: '#3578A8', bg: '#E5F1FA', icon: 'time-outline' },
  assigned:    { label: 'O intercessor já está com seu pedido', color: '#e08b00', bg: '#FEF3C7', icon: 'person-outline' },
  interceding: { label: 'Alguém está orando por você agora',    color: '#c07000', bg: '#FEF3C7', icon: 'radio-button-on-outline' },
  done:        { label: 'Seu pedido foi intercedido 🙏',         color: '#2F8A5F', bg: '#D1FAE5', icon: 'checkmark-circle-outline' },
}

const ASSIGNMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Pendente — ore por este pedido quando possível.', color: '#3578A8' },
  interceding: { label: 'Em oração — obrigado por interceder!',            color: '#c07000' },
}

export default function PedidoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { myRequests, assignments, loading, markInterceding, markDone } = useIntercession()

  const [updating, setUpdating] = useState(false)

  // Pedido enviado pelo próprio usuário (is_anonymous = false, RLS filtra anônimos)
  const ownRequest = myRequests.find(r => r.id === id)

  // Designação ao intercessor — buscada pelo prayer_request_id
  const assignedItem = assignments.find(a => a.prayer_request_id === id)

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    )
  }

  if (!ownRequest && !assignedItem) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.neutral[300]} />
        <Text style={styles.emptyTitle}>Pedido não encontrado</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const content      = ownRequest?.content ?? assignedItem?.prayer_requests?.content ?? ''
  const isAnonymous  = assignedItem?.prayer_requests?.is_anonymous ?? false
  const createdAt    = ownRequest?.created_at ?? assignedItem?.assigned_at ?? ''

  async function handleMarkInterceding() {
    if (!assignedItem) return
    setUpdating(true)
    try {
      await markInterceding(assignedItem)
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar. Tente novamente.')
    } finally {
      setUpdating(false)
    }
  }

  async function handleMarkDone() {
    if (!assignedItem) return
    Alert.alert(
      'Conclui a intercessão?',
      'Após concluir, este pedido sairá da sua lista.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Conclui a intercessão',
          onPress: async () => {
            setUpdating(true)
            try {
              await markDone(assignedItem)
              router.back()
            } catch {
              Alert.alert('Erro', 'Não foi possível atualizar. Tente novamente.')
            } finally {
              setUpdating(false)
            }
          },
        },
      ],
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.neutral[700]} />
        </TouchableOpacity>
        <View style={styles.headerMeta}>
          <View style={styles.headerIcon}>
            <Ionicons name="hand-right-outline" size={22} color={ACCENT} />
          </View>
          <Text style={styles.headerLabel}>Pedido de Oração</Text>
        </View>
      </View>

      {/* Data e flags */}
      {createdAt ? (
        <View style={styles.metaRow}>
          <Text style={styles.date}>
            {format(parseISO(createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </Text>
          {isAnonymous && (
            <View style={styles.anonBadge}>
              <Ionicons name="eye-off-outline" size={12} color={colors.neutral[500]} />
              <Text style={styles.anonBadgeText}>Anônimo</Text>
            </View>
          )}
        </View>
      ) : null}

      {/* Conteúdo */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Pedido</Text>
        <Text style={styles.contentText}>{content}</Text>
      </View>

      {/* ── STATUS PARA O SOLICITANTE ────────────────────────── */}
      {ownRequest && (() => {
        const cfg = REQUEST_STATUS_CONFIG[ownRequest.status] ?? REQUEST_STATUS_CONFIG.new
        return (
          <>
            <View style={[styles.statusCard, { backgroundColor: cfg.bg }]}>
              <Ionicons name={cfg.icon} size={20} color={cfg.color} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                {ownRequest.status === 'assigned' && (
                  <Text style={[styles.statusNote, { color: cfg.color }]}>
                    Um intercessor recebeu seu pedido e vai orar por você.
                  </Text>
                )}
                {ownRequest.status === 'interceding' && (
                  <Text style={[styles.statusNote, { color: cfg.color }]}>
                    Neste momento alguém está intercedendo pelo seu pedido.
                  </Text>
                )}
                {ownRequest.status === 'done' && (
                  <Text style={[styles.statusNote, { color: cfg.color }]}>
                    Seu pedido foi intercedido. Que Deus atenda! 🙏
                  </Text>
                )}
              </View>
            </View>

            {ownRequest.status === 'new' && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color={colors.semantic.info} />
                <Text style={styles.infoText}>
                  Seu pedido será recebido e distribuído com cuidado pelo ministério de intercessão.
                </Text>
              </View>
            )}
          </>
        )
      })()}

      {/* ── AÇÕES DO INTERCESSOR ─────────────────────────────── */}
      {assignedItem && (() => {
        const cfg = ASSIGNMENT_STATUS_CONFIG[assignedItem.status] ?? ASSIGNMENT_STATUS_CONFIG.pending
        return (
          <>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Status da sua oração</Text>
              <Text style={[styles.assignmentStatus, { color: cfg.color }]}>{cfg.label}</Text>
              <Text style={styles.assignedAt}>
                Designado em {format(parseISO(assignedItem.assigned_at), 'dd/MM/yyyy', { locale: ptBR })}
              </Text>
            </View>

            {assignedItem.status === 'pending' && (
              <View style={styles.actionsCard}>
                <Text style={styles.actionsLabel}>O que você gostaria de fazer?</Text>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: ACCENT }]}
                  onPress={handleMarkInterceding}
                  disabled={updating}
                  activeOpacity={0.8}
                >
                  {updating
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <>
                        <Ionicons name="radio-button-on-outline" size={20} color="#fff" />
                        <Text style={styles.actionBtnTextLight}>Começar a interceder</Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
            )}

            {assignedItem.status === 'interceding' && (
              <View style={styles.actionsCard}>
                <Text style={styles.actionsLabel}>Oração em andamento</Text>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#2F8A5F' }]}
                  onPress={handleMarkDone}
                  disabled={updating}
                  activeOpacity={0.8}
                >
                  {updating
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                        <Text style={styles.actionBtnTextLight}>Conclui a intercessão</Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
            )}
          </>
        )
      })()}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  content: { padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.neutral[700] },
  backBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, backgroundColor: '#EDE9FE', borderRadius: radius.md },
  backBtnText: { color: ACCENT, fontWeight: '600' },

  header: { gap: spacing.md },
  headerBack: { alignSelf: 'flex-start' },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  headerLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.6 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  date: { fontSize: fontSize.xs, color: colors.neutral[400], flex: 1 },
  anonBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.neutral[100], borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  anonBadgeText: { fontSize: 11, color: colors.neutral[500] },

  card: {
    backgroundColor: colors.neutral.white, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.neutral[100], padding: spacing.lg, gap: spacing.sm,
  },
  cardLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.8 },
  contentText: { fontSize: fontSize.md, color: colors.neutral[800], lineHeight: 26 },
  assignmentStatus: { fontSize: fontSize.md, fontWeight: '600', lineHeight: 22 },
  assignedAt: { fontSize: fontSize.xs, color: colors.neutral[400] },

  statusCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    padding: spacing.md, borderRadius: radius.md,
  },
  statusLabel: { fontSize: fontSize.md, fontWeight: '700' },
  statusNote: { fontSize: fontSize.sm, fontWeight: '500', marginTop: 2, lineHeight: 20 },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs,
    backgroundColor: colors.semantic.infoSoft, borderRadius: radius.md, padding: spacing.md,
  },
  infoText: { flex: 1, fontSize: fontSize.xs, color: colors.semantic.info, lineHeight: 18 },

  actionsCard: {
    backgroundColor: colors.neutral.white, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.neutral[100], padding: spacing.lg, gap: spacing.md,
  },
  actionsLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.neutral[700] },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg,
  },
  actionBtnTextLight: { fontSize: fontSize.md, fontWeight: '700', color: '#fff' },
})
