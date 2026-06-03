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
import {
  useFinancial, FinancialTransaction, FinancialCategory, MonthlyBar, NewTransaction,
} from '@/hooks/useFinancial'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'

// ── Utils ─────────────────────────────────────────────────────────────────────

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

// ── Tela principal ────────────────────────────────────────────────────────────

export default function FinanceiroScreen() {
  const insets = useSafeAreaInsets()
  const {
    isAdmin, transactions, categories, totalIncome, totalExpense, balance,
    monthlyData, loading, saving, error, refetch, addTransaction,
  } = useFinancial()

  const [tab, setTab] = useState<'all' | 'income' | 'expense'>('all')
  const [showForm, setShowForm] = useState(false)

  const filtered = transactions.filter(t =>
    tab === 'all' ? true : t.type === tab
  )

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
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + (isAdmin ? 90 : spacing.xl) }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} colors={[colors.brand.primary]} tintColor={colors.brand.primary} />}
        ListHeaderComponent={
          <View style={s.headerBlock}>
            {/* Cards de resumo */}
            {isAdmin ? (
              <AdminSummary income={totalIncome} expense={totalExpense} balance={balance} />
            ) : (
              <MemberSummary total={totalIncome + totalExpense} count={transactions.length} />
            )}

            {/* Gráfico mensal — só admin */}
            {isAdmin && monthlyData.some(m => m.income > 0 || m.expense > 0) && (
              <MonthlyChart data={monthlyData} />
            )}

            {/* Tabs de filtro — só admin */}
            {isAdmin && (
              <View style={s.tabs}>
                {(['all', 'income', 'expense'] as const).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[s.tab, tab === t && s.tabActive]}
                    onPress={() => setTab(t)}
                  >
                    <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                      {t === 'all' ? 'Tudo' : t === 'income' ? 'Receitas' : 'Despesas'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={s.listLabel}>
              {filtered.length} {filtered.length === 1 ? 'lançamento' : 'lançamentos'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={[s.center, { marginTop: spacing.xl }]}>
            <Ionicons name="wallet-outline" size={48} color={colors.neutral[300]} />
            <Text style={s.emptyTitle}>Nenhum lançamento</Text>
            <Text style={s.emptyBody}>
              {isAdmin
                ? 'Use o botão + para adicionar a primeira entrada.'
                : 'Seu histórico de contribuições aparecerá aqui.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => <TransactionCard tx={item} isAdmin={isAdmin} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
      />

      {/* FAB — só admin */}
      {isAdmin && (
        <TouchableOpacity
          style={[s.fab, { bottom: insets.bottom + spacing.lg }]}
          onPress={() => setShowForm(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Modal de novo lançamento */}
      {isAdmin && (
        <AddTransactionModal
          visible={showForm}
          categories={categories}
          saving={saving}
          onClose={() => setShowForm(false)}
          onSave={async (tx) => {
            try {
              await addTransaction(tx)
              setShowForm(false)
            } catch {
              Alert.alert('Erro', 'Não foi possível salvar o lançamento.')
            }
          }}
        />
      )}
    </View>
  )
}

// ── Cards de resumo ───────────────────────────────────────────────────────────

function AdminSummary({ income, expense, balance }: { income: number; expense: number; balance: number }) {
  const balanceColor = balance >= 0 ? '#059669' : '#DC2626'
  return (
    <View style={s.adminSummary}>
      <View style={[s.summaryCard, { backgroundColor: '#DCFCE7' }]}>
        <Ionicons name="arrow-down-circle-outline" size={22} color="#059669" />
        <Text style={s.summaryCardLabel}>Receitas</Text>
        <Text style={[s.summaryCardValue, { color: '#059669' }]}>{fmt(income)}</Text>
      </View>
      <View style={[s.summaryCard, { backgroundColor: '#FEE2E2' }]}>
        <Ionicons name="arrow-up-circle-outline" size={22} color="#DC2626" />
        <Text style={s.summaryCardLabel}>Despesas</Text>
        <Text style={[s.summaryCardValue, { color: '#DC2626' }]}>{fmt(expense)}</Text>
      </View>
      <View style={[s.summaryCardFull, { backgroundColor: balance >= 0 ? '#F0FDF4' : '#FFF1F2', borderColor: balanceColor + '40' }]}>
        <Text style={s.summaryCardLabel}>Saldo</Text>
        <Text style={[s.summaryBalanceValue, { color: balanceColor }]}>{fmt(balance)}</Text>
      </View>
    </View>
  )
}

function MemberSummary({ total, count }: { total: number; count: number }) {
  return (
    <View style={[s.memberSummary]}>
      <Text style={s.memberSummaryLabel}>Suas contribuições</Text>
      <Text style={s.memberSummaryValue}>{fmt(total)}</Text>
      <Text style={s.memberSummaryCount}>{count} {count === 1 ? 'lançamento' : 'lançamentos'}</Text>
    </View>
  )
}

// ── Gráfico mensal ────────────────────────────────────────────────────────────

function MonthlyChart({ data }: { data: MonthlyBar[] }) {
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1)

  return (
    <View style={s.chartCard}>
      <Text style={s.chartTitle}>Últimos 6 meses</Text>
      <View style={s.chartRow}>
        {data.map((bar, i) => (
          <View key={i} style={s.chartCol}>
            <View style={s.barsContainer}>
              {/* Receita */}
              <View style={s.barWrapper}>
                <View style={[
                  s.bar,
                  { height: Math.max(4, (bar.income / maxVal) * 80), backgroundColor: '#059669' }
                ]} />
              </View>
              {/* Despesa */}
              <View style={s.barWrapper}>
                <View style={[
                  s.bar,
                  { height: Math.max(4, (bar.expense / maxVal) * 80), backgroundColor: '#DC2626' }
                ]} />
              </View>
            </View>
            <Text style={s.chartLabel}>{bar.label}</Text>
          </View>
        ))}
      </View>
      <View style={s.chartLegend}>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: '#059669' }]} />
          <Text style={s.legendText}>Receitas</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: '#DC2626' }]} />
          <Text style={s.legendText}>Despesas</Text>
        </View>
      </View>
    </View>
  )
}

// ── Card de transação ─────────────────────────────────────────────────────────

function TransactionCard({ tx, isAdmin }: { tx: FinancialTransaction; isAdmin: boolean }) {
  const isIncome = tx.type === 'income'
  const catColor = tx.category?.color ?? (isIncome ? '#059669' : '#DC2626')

  return (
    <View style={[s.card, { borderLeftColor: catColor }]}>
      <View style={[s.cardIcon, { backgroundColor: catColor + '18' }]}>
        <Ionicons
          name={isIncome ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
          size={22}
          color={catColor}
        />
      </View>
      <View style={s.cardContent}>
        <View style={s.cardTop}>
          <Text style={s.cardDesc} numberOfLines={1}>{tx.description}</Text>
          <Text style={[s.cardAmount, { color: isIncome ? '#059669' : '#DC2626' }]}>
            {isIncome ? '+' : '-'}{fmt(tx.amount)}
          </Text>
        </View>
        <View style={s.cardMeta}>
          {tx.category && (
            <View style={[s.pill, { backgroundColor: catColor + '18' }]}>
              <Text style={[s.pillText, { color: catColor }]}>{tx.category.name}</Text>
            </View>
          )}
          <View style={s.pill}>
            <Text style={s.pillText}>{PAYMENT_LABELS[tx.payment_method] ?? tx.payment_method}</Text>
          </View>
        </View>
        <Text style={s.cardDate}>
          {format(parseISO(tx.date), "dd 'de' MMM. yyyy", { locale: ptBR })}
          {isAdmin && tx.member_id && ' • Membro vinculado'}
        </Text>
        {tx.notes && <Text style={s.cardNotes}>{tx.notes}</Text>}
      </View>
    </View>
  )
}

// ── Modal: novo lançamento ────────────────────────────────────────────────────

type FormState = {
  type: 'income' | 'expense'
  description: string
  amount: string
  date: string
  payment_method: string
  category_id: string
  notes: string
}

function AddTransactionModal({
  visible, categories, saving, onClose, onSave,
}: {
  visible: boolean
  categories: FinancialCategory[]
  saving: boolean
  onClose: () => void
  onSave: (tx: NewTransaction) => Promise<void>
}) {
  const insets = useSafeAreaInsets()
  const [form, setForm] = useState<FormState>({
    type: 'income',
    description: '',
    amount: '',
    date: today(),
    payment_method: 'pix',
    category_id: '',
    notes: '',
  })

  const filteredCats = categories.filter(c => c.type === form.type)

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(prev => {
      const next = { ...prev, [key]: val }
      // Limpa categoria ao mudar tipo
      if (key === 'type') next.category_id = ''
      return next
    })
  }

  async function handleSave() {
    if (!form.description.trim()) { Alert.alert('Campo obrigatório', 'Informe a descrição.'); return }
    const amount = parseFloat(form.amount.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) { Alert.alert('Valor inválido', 'Informe um valor maior que zero.'); return }
    if (!form.date) { Alert.alert('Campo obrigatório', 'Informe a data.'); return }

    await onSave({
      type: form.type,
      description: form.description.trim(),
      amount,
      date: form.date,
      payment_method: form.payment_method,
      category_id: form.category_id || null,
      member_id: null,
      notes: form.notes.trim() || null,
    })

    // Reset form
    setForm({ type: 'income', description: '', amount: '', date: today(), payment_method: 'pix', category_id: '', notes: '' })
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[s.modalSheet, { paddingBottom: insets.bottom + spacing.md }]}>
          {/* Handle + título */}
          <View style={s.modalHandle} />
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Novo lançamento</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.neutral[500]} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Tipo */}
            <Label text="Tipo" />
            <View style={s.typeToggle}>
              {(['income', 'expense'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[
                    s.typeBtn,
                    form.type === t && { backgroundColor: t === 'income' ? '#059669' : '#DC2626' },
                  ]}
                  onPress={() => set('type', t)}
                >
                  <Ionicons
                    name={t === 'income' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                    size={18}
                    color={form.type === t ? '#fff' : colors.neutral[500]}
                  />
                  <Text style={[s.typeBtnText, form.type === t && { color: '#fff' }]}>
                    {t === 'income' ? 'Receita' : 'Despesa'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Descrição */}
            <Label text="Descrição *" />
            <TextInput
              style={s.input}
              placeholder="Ex: Dízimos do mês de junho"
              placeholderTextColor={colors.neutral[400]}
              value={form.description}
              onChangeText={v => set('description', v)}
            />

            {/* Valor */}
            <Label text="Valor (R$) *" />
            <TextInput
              style={s.input}
              placeholder="0,00"
              placeholderTextColor={colors.neutral[400]}
              keyboardType="decimal-pad"
              value={form.amount}
              onChangeText={v => set('amount', v)}
            />

            {/* Data */}
            <Label text="Data *" />
            <TextInput
              style={s.input}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={colors.neutral[400]}
              value={form.date}
              onChangeText={v => set('date', v)}
              maxLength={10}
            />

            {/* Forma de pagamento */}
            <Label text="Forma de pagamento" />
            <View style={s.optionGrid}>
              {Object.entries(PAYMENT_LABELS).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[s.optionChip, form.payment_method === key && s.optionChipActive]}
                  onPress={() => set('payment_method', key)}
                >
                  <Text style={[s.optionChipText, form.payment_method === key && s.optionChipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Categoria */}
            <Label text="Categoria" />
            <View style={s.optionGrid}>
              {filteredCats.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    s.optionChip,
                    form.category_id === cat.id && { backgroundColor: cat.color ?? colors.brand.primary, borderColor: cat.color ?? colors.brand.primary },
                  ]}
                  onPress={() => set('category_id', form.category_id === cat.id ? '' : cat.id)}
                >
                  <Text style={[
                    s.optionChipText,
                    form.category_id === cat.id && { color: '#fff' },
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Observações */}
            <Label text="Observações (opcional)" />
            <TextInput
              style={[s.input, { minHeight: 72, textAlignVertical: 'top' }]}
              placeholder="Detalhes adicionais..."
              placeholderTextColor={colors.neutral[400]}
              multiline
              value={form.notes}
              onChangeText={v => set('notes', v)}
            />

            {/* Botão salvar */}
            <TouchableOpacity
              style={[s.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={s.saveBtnText}>Salvar lançamento</Text>
                  </>
              }
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
  headerBlock: { gap: spacing.md, marginBottom: spacing.md },
  listLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.neutral[400], textTransform: 'uppercase', letterSpacing: 0.8 },

  // Admin summary
  adminSummary: { gap: spacing.sm },
  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg },
  summaryCardLabel: { flex: 1, fontSize: fontSize.sm, fontWeight: '600', color: colors.neutral[700] },
  summaryCardValue: { fontSize: fontSize.lg, fontWeight: '800' },
  summaryCardFull: { padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', gap: 4 },
  summaryBalanceValue: { fontSize: 28, fontWeight: '900' },

  // Member summary
  memberSummary: { backgroundColor: colors.brand.primary, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', gap: 4 },
  memberSummaryLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  memberSummaryValue: { fontSize: 34, fontWeight: '800', color: '#fff' },
  memberSummaryCount: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.6)' },

  // Chart
  chartCard: { backgroundColor: colors.neutral.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.neutral[100], padding: spacing.md },
  chartTitle: { fontSize: fontSize.xs, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.md },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100 },
  chartCol: { flex: 1, alignItems: 'center', gap: spacing.xs },
  barsContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 80 },
  barWrapper: { width: 10, alignItems: 'center', justifyContent: 'flex-end', height: 80 },
  bar: { width: 10, borderRadius: 3 },
  chartLabel: { fontSize: 9, color: colors.neutral[500], fontWeight: '600' },
  chartLegend: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: fontSize.xs, color: colors.neutral[500] },

  // Tabs
  tabs: { flexDirection: 'row', backgroundColor: colors.neutral[100], borderRadius: radius.lg, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.md },
  tabActive: { backgroundColor: colors.neutral.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: fontSize.sm, color: colors.neutral[500], fontWeight: '500' },
  tabTextActive: { color: colors.neutral[900], fontWeight: '700' },

  // Transaction card
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

  // FAB
  fab: { position: 'absolute', right: spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brand.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: { backgroundColor: colors.neutral.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, maxHeight: '92%' },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.neutral[200], borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.neutral[950] },
  label: { fontSize: fontSize.xs, fontWeight: '700', color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.7, marginTop: spacing.md, marginBottom: spacing.xs },
  input: { backgroundColor: colors.neutral[50], borderWidth: 1, borderColor: colors.neutral[200], borderRadius: radius.md, padding: spacing.md, fontSize: fontSize.md, color: colors.neutral[950] },
  typeToggle: { flexDirection: 'row', gap: spacing.md },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.neutral[100], borderRadius: radius.lg },
  typeBtnText: { fontSize: fontSize.md, fontWeight: '600', color: colors.neutral[500] },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  optionChip: { paddingHorizontal: spacing.md, paddingVertical: 8, backgroundColor: colors.neutral[50], borderWidth: 1, borderColor: colors.neutral[200], borderRadius: radius.lg },
  optionChipActive: { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary },
  optionChipText: { fontSize: fontSize.sm, color: colors.neutral[600], fontWeight: '500' },
  optionChipTextActive: { color: '#fff', fontWeight: '700' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.brand.primary, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.lg },
  saveBtnText: { fontSize: fontSize.md, fontWeight: '700', color: '#fff' },
})
