import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useFinancial, FinancialTransaction } from '@/hooks/useFinancial'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Dinheiro', pix: 'Pix', card: 'Cartão',
  transfer: 'Transferência', check: 'Cheque', other: 'Outro',
}

const TYPE_LABELS: Record<string, string> = {
  tithe: 'Dízimo', offering: 'Oferta', donation: 'Doação', income: 'Entrada',
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function FinanceiroScreen() {
  const insets = useSafeAreaInsets()
  const { transactions, total, loading, error, refetch } = useFinancial()

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

  return (
    <FlatList
      data={transactions}
      keyExtractor={t => t.id}
      contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.xl }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} colors={[colors.brand.primary]} tintColor={colors.brand.primary} />}
      ListHeaderComponent={
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total registrado</Text>
          <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
          <Text style={styles.summaryCount}>
            {transactions.length} {transactions.length === 1 ? 'contribuição' : 'contribuições'}
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={[styles.center, { marginTop: spacing.xxl }]}>
          <Ionicons name="wallet-outline" size={48} color={colors.neutral[300]} />
          <Text style={styles.emptyTitle}>Nenhuma contribuição</Text>
          <Text style={styles.emptyBody}>Seu histórico de dízimos e ofertas{'\n'}aparecerá aqui.</Text>
        </View>
      }
      renderItem={({ item }) => <TransactionCard tx={item} />}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
    />
  )
}

function TransactionCard({ tx }: { tx: FinancialTransaction }) {
  const categoryColor = tx.category?.color ?? colors.brand.primary

  return (
    <View style={styles.card}>
      <View style={[styles.colorBar, { backgroundColor: categoryColor }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Text style={styles.cardDescription} numberOfLines={1}>{tx.description}</Text>
          <Text style={styles.cardAmount}>{formatCurrency(Number(tx.amount))}</Text>
        </View>
        <View style={styles.cardPills}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{TYPE_LABELS[tx.type] ?? tx.type}</Text>
          </View>
          {tx.category && (
            <View style={[styles.pill, { backgroundColor: categoryColor + '22' }]}>
              <Text style={[styles.pillText, { color: categoryColor }]}>{tx.category.name}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardMeta}>
          <Ionicons name="calendar-outline" size={12} color={colors.neutral[400]} />
          <Text style={styles.metaText}>
            {format(parseISO(tx.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{PAYMENT_LABELS[tx.payment_method] ?? tx.payment_method}</Text>
        </View>
        {tx.notes && <Text style={styles.cardNotes}>{tx.notes}</Text>}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.neutral[700], marginTop: spacing.sm },
  emptyBody: { fontSize: fontSize.sm, color: colors.neutral[400], textAlign: 'center', lineHeight: 22 },
  retryBtn: { marginTop: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.brand.primarySoft, borderRadius: radius.md },
  retryText: { fontSize: fontSize.sm, color: colors.brand.primary, fontWeight: '600' },
  list: { padding: spacing.lg },
  summaryCard: {
    backgroundColor: colors.brand.primary, borderRadius: radius.xl,
    padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg, gap: 4,
  },
  summaryLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  summaryValue: { fontSize: 34, fontWeight: '800', color: '#fff' },
  summaryCount: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.6)' },
  card: {
    backgroundColor: colors.neutral.white, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.neutral[100],
    flexDirection: 'row', overflow: 'hidden',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3,
  },
  colorBar: { width: 4 },
  cardContent: { flex: 1, padding: spacing.md, gap: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  cardDescription: { flex: 1, fontSize: fontSize.md, fontWeight: '600', color: colors.neutral[950] },
  cardAmount: { fontSize: fontSize.lg, fontWeight: '800', color: colors.brand.primary },
  cardPills: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: colors.brand.primarySoft, borderRadius: radius.sm },
  pillText: { fontSize: 11, fontWeight: '600', color: colors.brand.primary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: fontSize.xs, color: colors.neutral[400] },
  metaDot: { fontSize: fontSize.xs, color: colors.neutral[300] },
  cardNotes: { fontSize: fontSize.xs, color: colors.neutral[500], fontStyle: 'italic' },
})
