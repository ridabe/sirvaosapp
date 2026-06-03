import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity,
  RefreshControl, Modal, TextInput, ScrollView, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useFinancial, FinancialTransaction, FinancialCategory, NewTransaction } from '@/hooks/useFinancial'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Dinheiro', pix: 'Pix', card: 'Cartão',
  transfer: 'Transferência', check: 'Cheque', other: 'Outro',
}

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function today() {
  return new Date().toISOString().split('T')[0]
}

export default function FinanceiroScreen() {
  const insets = useSafeAreaInsets()
  const { transactions, categories, totalIncome, totalExpense, balance, monthlyData, loading, saving, error, refetch, addTransaction } = useFinancial()
  const [tab, setTab] = useState<'all' | 'income' | 'expense'>('all')
  const [showForm, setShowForm] = useState(false)

  const filtered = transactions.filter(t => tab === 'all' || t.type === tab)

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={colors.brand.primary} /></View>
  }

  if (error) {
    return (
      <View style={s.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.neutral[300]} />
        <Text style={s.emptyTitle}>Erro ao carregar</Text>
        <TouchableOpacity style={s.retryBtn} onPress={refetch}>
          <Text style={s.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={filtered}
        keyExtractor={t => t.id}
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 90 }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} colors={[colors.brand.primary]} tintColor={colors.brand.primary} />}
        ListHeaderComponent={
          <View style={s.header}>
            {/* Resumo */}
            <View style={s.summaryRow}>
              <View style={[s.summaryCard, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="arrow-down-circle-outline" size={20} color="#059669" />
                <Text style={s.summaryLabel}>Receitas</Text>
                <Text style={[s.summaryValue, { color: '#059669' }]}>{fmt(totalIncome)}</Text>
              </View>
              <View style={[s.summaryCard, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="arrow-up-circle-outline" size={20} color="#DC2626" />
                <Text style={s.summaryLabel}>Despesas</Text>
                <Text style={[s.summaryValue, { color: '#DC2626' }]}>{fmt(totalExpense)}</Text>
              </View>
            </View>
            <View style={[s.balanceCard, { borderColor: (balance >= 0 ? '#059669' : '#DC2626') + '40', backgroundColor: balance >= 0 ? '#F0FDF4' : '#FFF1F2' }]}>
              <Text style={s.balanceLabel}>Saldo atual</Text>
              <Text style={[s.balanceValue, { color: balance >= 0 ? '#059669' : '#DC2626' }]}>{fmt(balance)}</Text>
            </View>

            {/* Gráfico */}
            {monthlyData.some(m => m.income > 0 || m.expense > 0) && (
              <MonthlyChart data={monthlyData} />
            )}

            {/* Tabs */}
            <View style={s.tabs}>
              {(['all', 'income', 'expense'] as const).map(t => (
                <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
                  <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                    {t === 'all' ? 'Tudo' : t === 'income' ? 'Receitas' : 'Despesas'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.listLabel}>{filtered.length} {filtered.length === 1 ? 'lançamento' : 'lançamentos'}</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={[s.center, { marginTop: spacing.xl }]}>
            <Ionicons name="wallet-outline" size={48} color={colors.neutral[300]} />
            <Text style={s.emptyTitle}>Nenhum lançamento</Text>
            <Text style={s.emptyBody}>Use o botão + para registrar a primeira entrada.</Text>
          </View>
        }
        renderItem={({ item }) => <TransactionCard tx={item} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
      />

      {/* FAB */}
      <TouchableOpacity style={[s.fab, { bottom: insets.bottom + spacing.lg }]} onPress={() => setShowForm(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <AddTransactionModal
        visible={showForm}
        categories={categories}
        saving={saving}
        onClose={() => setShowForm(false)}
        onSave={async tx => {
          try {
            await addTransaction(tx)
            setShowForm(false)
          } catch {
            Alert.alert('Erro', 'Não foi possível salvar o lançamento.')
          }
        }}
      />
    </View>
  )
}

// ── Gráfico ───────────────────────────────────────────────────────────────────

function MonthlyChart({ data }: { data: ReturnType<typeof useFinancial>['monthlyData'] }) {
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1)
  return (
    <View style={s.chartCard}>
      <Text style={s.chartTitle}>Últimos 6 meses</Text>
      <View style={s.chartRow}>
        {data.map((bar, i) => (
          <View key={i} style={s.chartCol}>
            <View style={s.barsContainer}>
              <View style={s.barSlot}><View style={[s.bar, { height: Math.max(4, (bar.income / maxVal) * 80), backgroundColor: '#059669' }]} /></View>
              <View style={s.barSlot}><View style={[s.bar, { height: Math.max(4, (bar.expense / maxVal) * 80), backgroundColor: '#DC2626' }]} /></View>
            </View>
            <Text style={s.chartLabel}>{bar.label}</Text>
          </View>
        ))}
      </View>
      <View style={s.chartLegend}>
        <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: '#059669' }]} /><Text style={s.legendText}>Receitas</Text></View>
        <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: '#DC2626' }]} /><Text style={s.legendText}>Despesas</Text></View>
      </View>
    </View>
  )
}

// ── Card de transação ─────────────────────────────────────────────────────────

function TransactionCard({ tx }: { tx: FinancialTransaction }) {
  const isIncome = tx.type === 'income'
  const catColor = tx.category?.color ?? (isIncome ? '#059669' : '#DC2626')
  return (
    <View style={[s.card, { borderLeftColor: catColor }]}>
      <View style={[s.cardIcon, { backgroundColor: catColor + '18' }]}>
        <Ionicons name={isIncome ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'} size={22} color={catColor} />
      </View>
      <View style={s.cardContent}>
        <View style={s.cardTop}>
          <Text style={s.cardDesc} numberOfLines={1}>{tx.description}</Text>
          <Text style={[s.cardAmount, { color: isIncome ? '#059669' : '#DC2626' }]}>{isIncome ? '+' : '-'}{fmt(tx.amount)}</Text>
        </View>
        <View style={s.cardMeta}>
          {tx.category && <View style={[s.pill, { backgroundColor: catColor + '18' }]}><Text style={[s.pillText, { color: catColor }]}>{tx.category.name}</Text></View>}
          <View style={s.pill}><Text style={s.pillText}>{PAYMENT_LABELS[tx.payment_method] ?? tx.payment_method}</Text></View>
        </View>
        <Text style={s.cardDate}>{format(parseISO(tx.date), "dd 'de' MMM. yyyy", { locale: ptBR })}</Text>
        {tx.notes && <Text style={s.cardNotes}>{tx.notes}</Text>}
      </View>
    </View>
  )
}

// ── Modal novo lançamento ─────────────────────────────────────────────────────

type FormState = { type: 'income' | 'expense'; description: string; amount: string; date: string; payment_method: string; category_id: string; notes: string }

function AddTransactionModal({ visible, categories, saving, onClose, onSave }: {
  visible: boolean; categories: FinancialCategory[]; saving: boolean
  onClose: () => void; onSave: (tx: NewTransaction) => Promise<void>
}) {
  const insets = useSafeAreaInsets()
  const [form, setForm] = useState<FormState>({ type: 'income', description: '', amount: '', date: today(), payment_method: 'pix', category_id: '', notes: '' })

  const filteredCats = categories.filter(c => c.type === form.type)

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: val, ...(key === 'type' ? { category_id: '' } : {}) }))
  }

  async function handleSave() {
    if (!form.description.trim()) { Alert.alert('Campo obrigatório', 'Informe a descrição.'); return }
    const amount = parseFloat(form.amount.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) { Alert.alert('Valor inválido', 'Informe um valor maior que zero.'); return }
    if (!form.date.match(/^\d{4}-\d{2}-\d{2}$/)) { Alert.alert('Data inválida', 'Use o formato AAAA-MM-DD.'); return }
    await onSave({ type: form.type, description: form.description.trim(), amount, date: form.date, payment_method: form.payment_method, category_id: form.category_id || null, member_id: null, notes: form.notes.trim() || null })
    setForm({ type: 'income', description: '', amount: '', date: today(), payment_method: 'pix', category_id: '', notes: '' })
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[s.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={s.handle} />
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>Novo lançamento</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={colors.neutral[500]} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Label text="Tipo" />
            <View style={s.typeRow}>
              {(['income', 'expense'] as const).map(t => (
                <TouchableOpacity key={t} style={[s.typeBtn, form.type === t && { backgroundColor: t === 'income' ? '#059669' : '#DC2626' }]} onPress={() => set('type', t)}>
                  <Ionicons name={t === 'income' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'} size={18} color={form.type === t ? '#fff' : colors.neutral[500]} />
                  <Text style={[s.typeBtnText, form.type === t && { color: '#fff' }]}>{t === 'income' ? 'Receita' : 'Despesa'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Label text="Descrição *" />
            <TextInput style={s.input} placeholder="Ex: Dízimos do domingo" placeholderTextColor={colors.neutral[400]} value={form.description} onChangeText={v => set('description', v)} />

            <Label text="Valor (R$) *" />
            <TextInput style={s.input} placeholder="0,00" placeholderTextColor={colors.neutral[400]} keyboardType="decimal-pad" value={form.amount} onChangeText={v => set('amount', v)} />

            <Label text="Data * (AAAA-MM-DD)" />
            <TextInput style={s.input} placeholder={today()} placeholderTextColor={colors.neutral[400]} value={form.date} onChangeText={v => set('date', v)} maxLength={10} />

            <Label text="Forma de pagamento" />
            <View style={s.chips}>
              {Object.entries(PAYMENT_LABELS).map(([key, label]) => (
                <TouchableOpacity key={key} style={[s.chip, form.payment_method === key && s.chipActive]} onPress={() => set('payment_method', key)}>
                  <Text style={[s.chipText, form.payment_method === key && s.chipTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Label text="Categoria" />
            <View style={s.chips}>
              {filteredCats.map(cat => (
                <TouchableOpacity key={cat.id} style={[s.chip, form.category_id === cat.id && { backgroundColor: cat.color ?? colors.brand.primary, borderColor: cat.color ?? colors.brand.primary }]} onPress={() => set('category_id', form.category_id === cat.id ? '' : cat.id)}>
                  <Text style={[s.chipText, form.category_id === cat.id && { color: '#fff', fontWeight: '700' }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Label text="Observações" />
            <TextInput style={[s.input, { minHeight: 72, textAlignVertical: 'top' }]} placeholder="Detalhes adicionais..." placeholderTextColor={colors.neutral[400]} multiline value={form.notes} onChangeText={v => set('notes', v)} />

            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
              {saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="checkmark-circle-outline" size={20} color="#fff" /><Text style={s.saveBtnText}>Salvar lançamento</Text></>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function Label({ text }: { text: string }) {
  return <Text style={s.label}>{text}</Text>
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.neutral[700], marginTop: spacing.sm },
  emptyBody: { fontSize: fontSize.sm, color: colors.neutral[400], textAlign: 'center', lineHeight: 22 },
  retryBtn: { marginTop: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.brand.primarySoft, borderRadius: radius.md },
  retryText: { fontSize: fontSize.sm, color: colors.brand.primary, fontWeight: '600' },
  list: { padding: spacing.lg },
  header: { gap: spacing.md, marginBottom: spacing.md },
  listLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.neutral[400], textTransform: 'uppercase', letterSpacing: 0.8 },

  summaryRow: { flexDirection: 'row', gap: spacing.md },
  summaryCard: { flex: 1, borderRadius: radius.lg, padding: spacing.md, gap: 4 },
  summaryLabel: { fontSize: fontSize.xs, fontWeight: '600', color: colors.neutral[600] },
  summaryValue: { fontSize: fontSize.md, fontWeight: '800' },
  balanceCard: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, alignItems: 'center', gap: 2 },
  balanceLabel: { fontSize: fontSize.xs, fontWeight: '600', color: colors.neutral[500] },
  balanceValue: { fontSize: 28, fontWeight: '900' },

  chartCard: { backgroundColor: colors.neutral.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.neutral[100], padding: spacing.md },
  chartTitle: { fontSize: fontSize.xs, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.md },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100 },
  chartCol: { flex: 1, alignItems: 'center', gap: 4 },
  barsContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 80 },
  barSlot: { width: 10, justifyContent: 'flex-end', height: 80 },
  bar: { width: 10, borderRadius: 3 },
  chartLabel: { fontSize: 9, color: colors.neutral[500], fontWeight: '600' },
  chartLegend: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: fontSize.xs, color: colors.neutral[500] },

  tabs: { flexDirection: 'row', backgroundColor: colors.neutral[100], borderRadius: radius.lg, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.md },
  tabActive: { backgroundColor: colors.neutral.white, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
  tabText: { fontSize: fontSize.sm, color: colors.neutral[500], fontWeight: '500' },
  tabTextActive: { color: colors.neutral[900], fontWeight: '700' },

  card: { backgroundColor: colors.neutral.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.neutral[100], borderLeftWidth: 4, flexDirection: 'row', overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
  cardIcon: { width: 52, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1, padding: spacing.md, gap: 5 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  cardDesc: { flex: 1, fontSize: fontSize.md, fontWeight: '600', color: colors.neutral[950] },
  cardAmount: { fontSize: fontSize.md, fontWeight: '800' },
  cardMeta: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: colors.neutral[100], borderRadius: radius.sm },
  pillText: { fontSize: 11, fontWeight: '600', color: colors.neutral[600] },
  cardDate: { fontSize: fontSize.xs, color: colors.neutral[400] },
  cardNotes: { fontSize: fontSize.xs, color: colors.neutral[500], fontStyle: 'italic' },

  fab: { position: 'absolute', right: spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brand.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8 },

  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: colors.neutral.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, maxHeight: '92%' },
  handle: { width: 40, height: 4, backgroundColor: colors.neutral[200], borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  sheetTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.neutral[950] },
  label: { fontSize: fontSize.xs, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.7, marginTop: spacing.md, marginBottom: spacing.xs },
  input: { backgroundColor: colors.neutral[50], borderWidth: 1, borderColor: colors.neutral[200], borderRadius: radius.md, padding: spacing.md, fontSize: fontSize.md, color: colors.neutral[950] },
  typeRow: { flexDirection: 'row', gap: spacing.md },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.neutral[100], borderRadius: radius.lg },
  typeBtnText: { fontSize: fontSize.md, fontWeight: '600', color: colors.neutral[500] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 8, backgroundColor: colors.neutral[50], borderWidth: 1, borderColor: colors.neutral[200], borderRadius: radius.lg },
  chipActive: { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary },
  chipText: { fontSize: fontSize.sm, color: colors.neutral[600], fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.brand.primary, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.lg },
  saveBtnText: { fontSize: fontSize.md, fontWeight: '700', color: '#fff' },
})
