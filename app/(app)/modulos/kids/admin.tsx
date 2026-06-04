import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Modal, Alert, LayoutAnimation,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState, useEffect, useCallback } from 'react'
import { differenceInYears, parseISO, format, addDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useKidsAdmin, KidsGroup } from '@/hooks/useKidsAdmin'
import { KidsChild } from '@/hooks/useKids'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'

const ACCENT = '#D97706'
const PRESET_COLORS = ['#D97706', '#EF4444', '#8B5CF6', '#0EA5E9', '#10B981', '#F59E0B', '#EC4899', '#6366F1']

type Tab = 'criancas' | 'turmas' | 'presenca'

function calcAgeLabel(dob: string | null): string {
  if (!dob) return ''
  const y = differenceInYears(new Date(), parseISO(dob))
  return `${y} ${y === 1 ? 'ano' : 'anos'}`
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export default function KidsAdminScreen() {
  const insets = useSafeAreaInsets()
  const { allChildren, groups, loading, error, refetch, createChild, createGroup, getAttendanceForDate, saveAttendance } = useKidsAdmin()
  const [tab, setTab] = useState<Tab>('criancas')

  if (loading && allChildren.length === 0 && groups.length === 0) {
    return <View style={styles.center}><ActivityIndicator size="large" color={ACCENT} /></View>
  }

  if (error && allChildren.length === 0) {
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
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TabButton label="Crianças" icon="happy-outline" active={tab === 'criancas'} onPress={() => setTab('criancas')} />
        <TabButton label="Turmas" icon="people-outline" active={tab === 'turmas'} onPress={() => setTab('turmas')} />
        <TabButton label="Presença" icon="checkmark-circle-outline" active={tab === 'presenca'} onPress={() => setTab('presenca')} />
      </View>

      {tab === 'criancas' && (
        <CriancasTab
          children={allChildren}
          groups={groups}
          loading={loading}
          onRefresh={refetch}
          onCreateChild={createChild}
        />
      )}
      {tab === 'turmas' && (
        <TurmasTab
          groups={groups}
          loading={loading}
          onRefresh={refetch}
          onCreateGroup={createGroup}
        />
      )}
      {tab === 'presenca' && (
        <PresencaTab
          activeChildren={allChildren.filter(c => c.is_active)}
          loading={loading}
          onRefresh={refetch}
          getAttendance={getAttendanceForDate}
          saveAttendance={saveAttendance}
        />
      )}
    </View>
  )
}

// ── Tab button ───────────────────────────────────────────────────────────────

function TabButton({ label, icon, active, onPress }: {
  label: string; icon: any; active: boolean; onPress: () => void
}) {
  return (
    <TouchableOpacity style={[styles.tabBtn, active && styles.tabBtnActive]} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={16} color={active ? ACCENT : colors.neutral[400]} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

// ── Aba Crianças ─────────────────────────────────────────────────────────────

function CriancasTab({ children, groups, loading, onRefresh, onCreateChild }: {
  children: KidsChild[]
  groups: KidsGroup[]
  loading: boolean
  onRefresh: () => void
  onCreateChild: (data: any) => Promise<void>
}) {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const filtered = search.trim()
    ? children.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.group?.name ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : children

  return (
    <View style={styles.tabContent}>
      {/* Barra de busca + botão adicionar */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome ou turma…"
            placeholderTextColor={colors.neutral[400]}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)} activeOpacity={0.8}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[ACCENT]} tintColor={ACCENT} />}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="happy-outline" size={36} color={colors.neutral[200]} />
            <Text style={styles.emptyText}>{search ? 'Nenhuma criança encontrada.' : 'Nenhuma criança cadastrada ainda.'}</Text>
          </View>
        ) : (
          filtered.map(c => <ChildAdminRow key={c.id} child={c} />)
        )}
      </ScrollView>

      <CreateChildModal
        visible={showModal}
        groups={groups}
        onClose={() => setShowModal(false)}
        onSave={async (data) => {
          await onCreateChild(data)
          setShowModal(false)
        }}
      />
    </View>
  )
}

function ChildAdminRow({ child }: { child: KidsChild }) {
  const groupColor = child.group?.color ?? colors.neutral[300]
  return (
    <View style={styles.childRow}>
      <View style={[styles.childAvatar, { backgroundColor: groupColor + '22' }]}>
        <Text style={[styles.childInitial, { color: groupColor }]}>{child.name[0]?.toUpperCase()}</Text>
      </View>
      <View style={styles.childRowInfo}>
        <View style={styles.childRowTop}>
          <Text style={styles.childRowName} numberOfLines={1}>{child.name}</Text>
          {!child.is_active && (
            <View style={styles.inactivePill}><Text style={styles.inactivePillText}>Inativo</Text></View>
          )}
        </View>
        <View style={styles.childRowMeta}>
          {calcAgeLabel(child.date_of_birth) ? (
            <Text style={styles.metaText}>{calcAgeLabel(child.date_of_birth)}</Text>
          ) : null}
          {calcAgeLabel(child.date_of_birth) && child.group && <Text style={styles.metaDot}>·</Text>}
          {child.group
            ? <View style={[styles.groupBadge, { backgroundColor: groupColor + '20' }]}>
                <Text style={[styles.groupBadgeText, { color: groupColor }]}>{child.group.name}</Text>
              </View>
            : <Text style={[styles.metaText, { color: '#D97706' }]}>Sem turma</Text>
          }
        </View>
        {child.allergies && (
          <View style={styles.alertChip}>
            <Ionicons name="warning-outline" size={11} color="#D97706" />
            <Text style={styles.alertChipText} numberOfLines={1}>{child.allergies}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

// ── Aba Turmas ───────────────────────────────────────────────────────────────

function TurmasTab({ groups, loading, onRefresh, onCreateGroup }: {
  groups: KidsGroup[]
  loading: boolean
  onRefresh: () => void
  onCreateGroup: (name: string, color: string) => Promise<void>
}) {
  const [showModal, setShowModal] = useState(false)

  return (
    <View style={styles.tabContent}>
      <View style={styles.searchRow}>
        <Text style={styles.countLabel}>{groups.length} {groups.length === 1 ? 'turma' : 'turmas'}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)} activeOpacity={0.8}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[ACCENT]} tintColor={ACCENT} />}
      >
        {groups.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={36} color={colors.neutral[200]} />
            <Text style={styles.emptyText}>Nenhuma turma cadastrada ainda.</Text>
          </View>
        ) : (
          groups.map(g => <GroupRow key={g.id} group={g} />)
        )}
      </ScrollView>

      <CreateGroupModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={async (name, color) => {
          await onCreateGroup(name, color)
          setShowModal(false)
        }}
      />
    </View>
  )
}

function GroupRow({ group }: { group: KidsGroup }) {
  const color = group.color ?? ACCENT
  return (
    <View style={styles.groupRow}>
      <View style={[styles.colorDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.groupRowName}>{group.name}</Text>
        <Text style={styles.groupRowCount}>{group.childCount} {group.childCount === 1 ? 'criança' : 'crianças'}</Text>
      </View>
    </View>
  )
}

// ── Aba Presença ─────────────────────────────────────────────────────────────

function PresencaTab({ activeChildren, loading, onRefresh, getAttendance, saveAttendance }: {
  activeChildren: KidsChild[]
  loading: boolean
  onRefresh: () => void
  getAttendance: (date: string) => Promise<Set<string>>
  saveAttendance: (date: string, ids: string[]) => Promise<void>
}) {
  const [date, setDate] = useState(todayISO())
  const [present, setPresent] = useState<Set<string>>(new Set())
  const [loadingAtt, setLoadingAtt] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const loadAttendance = useCallback(async (d: string) => {
    setLoadingAtt(true)
    const set = await getAttendance(d)
    setPresent(set)
    setLoadingAtt(false)
  }, [getAttendance])

  useEffect(() => { loadAttendance(date) }, [date])

  const changeDate = (delta: number) => {
    const d = new Date(date + 'T12:00:00')
    const newDate = delta > 0 ? addDays(d, 1) : subDays(d, 1)
    setDate(newDate.toISOString().split('T')[0])
  }

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setPresent(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveAttendance(date, [...present])
      Alert.alert('Presença salva!', `${present.size} ${present.size === 1 ? 'criança registrada' : 'crianças registradas'} em ${format(new Date(date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })}.`)
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a presença. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const filtered = search.trim()
    ? activeChildren.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : activeChildren

  const dateLabel = format(new Date(date + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })

  return (
    <View style={styles.tabContent}>
      {/* Navegação de data */}
      <View style={styles.datePicker}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateArrow}>
          <Ionicons name="chevron-back" size={20} color={colors.neutral[600]} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
          {date === todayISO() && <Text style={styles.dateTodayBadge}>Hoje</Text>}
        </View>
        <TouchableOpacity
          onPress={() => changeDate(1)}
          style={styles.dateArrow}
          disabled={date >= todayISO()}
        >
          <Ionicons name="chevron-forward" size={20} color={date >= todayISO() ? colors.neutral[200] : colors.neutral[600]} />
        </TouchableOpacity>
      </View>

      {/* Resumo */}
      <View style={styles.attendanceSummary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{present.size}</Text>
          <Text style={styles.summaryLabel}>Presentes</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{activeChildren.length - present.size}</Text>
          <Text style={styles.summaryLabel}>Ausentes</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{activeChildren.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>

      {/* Busca */}
      <View style={styles.presencaSearchWrap}>
        <Ionicons name="search-outline" size={15} color={colors.neutral[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar criança…"
          placeholderTextColor={colors.neutral[400]}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={loading || loadingAtt} onRefresh={() => { onRefresh(); loadAttendance(date) }} colors={[ACCENT]} tintColor={ACCENT} />}
      >
        {loadingAtt ? (
          <ActivityIndicator color={ACCENT} style={{ marginTop: spacing.xl }} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhuma criança ativa.</Text>
          </View>
        ) : (
          filtered.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.attendanceRow, present.has(c.id) && styles.attendanceRowPresent]}
              onPress={() => toggle(c.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, present.has(c.id) && styles.checkboxChecked]}>
                {present.has(c.id) && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.attChildName, present.has(c.id) && styles.attChildNamePresent]}>{c.name}</Text>
                {c.group && <Text style={styles.attGroupName}>{c.group.name}</Text>}
              </View>
              <Text style={[styles.attStatus, { color: present.has(c.id) ? colors.semantic.success : colors.neutral[300] }]}>
                {present.has(c.id) ? 'Presente' : 'Ausente'}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Botão salvar fixo */}
      <View style={styles.saveBarWrap}>
        <TouchableOpacity
          style={[styles.saveBar, saving && styles.saveBarDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={styles.saveBarText}>Salvar presença — {present.size} presente{present.size !== 1 ? 's' : ''}</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ── Modais ───────────────────────────────────────────────────────────────────

function CreateChildModal({ visible, groups, onClose, onSave }: {
  visible: boolean
  groups: KidsGroup[]
  onClose: () => void
  onSave: (data: any) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [groupId, setGroupId] = useState<string | null>(null)
  const [allergies, setAllergies] = useState('')
  const [specialNeeds, setSpecialNeeds] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => { setName(''); setDob(''); setGroupId(null); setAllergies(''); setSpecialNeeds('') }

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Nome obrigatório', 'Preencha o nome da criança.')
    setSaving(true)
    try {
      await onSave({ name, date_of_birth: dob || null, group_id: groupId, allergies, special_needs: specialNeeds })
      reset()
    } catch {
      Alert.alert('Erro', 'Não foi possível cadastrar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nova criança</Text>
            <TouchableOpacity onPress={() => { reset(); onClose() }} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.neutral[500]} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Nome <Text style={{ color: colors.semantic.danger }}>*</Text></Text>
              <TextInput style={styles.field} placeholder="Ex: Maria Silva" placeholderTextColor={colors.neutral[400]} value={name} onChangeText={setName} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Data de nascimento</Text>
              <TextInput style={styles.field} placeholder="AAAA-MM-DD" placeholderTextColor={colors.neutral[400]} value={dob} onChangeText={setDob} keyboardType="numeric" maxLength={10} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Turma</Text>
              <View style={styles.groupPicker}>
                <TouchableOpacity
                  style={[styles.groupPickerItem, !groupId && styles.groupPickerItemActive]}
                  onPress={() => setGroupId(null)}
                >
                  <Text style={[styles.groupPickerText, !groupId && styles.groupPickerTextActive]}>Sem turma</Text>
                </TouchableOpacity>
                {groups.map(g => (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.groupPickerItem, groupId === g.id && styles.groupPickerItemActive, { borderColor: g.color ?? ACCENT }]}
                    onPress={() => setGroupId(g.id)}
                  >
                    <View style={[styles.colorDotSmall, { backgroundColor: g.color ?? ACCENT }]} />
                    <Text style={[styles.groupPickerText, groupId === g.id && styles.groupPickerTextActive]}>{g.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Alergias</Text>
              <TextInput style={styles.field} placeholder="Ex: amendoim, lactose…" placeholderTextColor={colors.neutral[400]} value={allergies} onChangeText={setAllergies} />
            </View>

            <View style={[styles.formGroup, { marginBottom: spacing.xl }]}>
              <Text style={styles.fieldLabel}>Necessidades especiais</Text>
              <TextInput style={styles.field} placeholder="Ex: autismo leve, cadeirante…" placeholderTextColor={colors.neutral[400]} value={specialNeeds} onChangeText={setSpecialNeeds} />
            </View>
          </ScrollView>

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Cadastrar criança</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

function CreateGroupModal({ visible, onClose, onSave }: {
  visible: boolean
  onClose: () => void
  onSave: (name: string, color: string) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [saving, setSaving] = useState(false)

  const reset = () => { setName(''); setColor(PRESET_COLORS[0]) }

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Nome obrigatório', 'Preencha o nome da turma.')
    setSaving(true)
    try {
      await onSave(name, color)
      reset()
    } catch {
      Alert.alert('Erro', 'Não foi possível criar a turma. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: 420 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nova turma</Text>
            <TouchableOpacity onPress={() => { reset(); onClose() }} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.neutral[500]} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Nome da turma <Text style={{ color: colors.semantic.danger }}>*</Text></Text>
            <TextInput style={styles.field} placeholder="Ex: Juniores, Pré-adolescentes…" placeholderTextColor={colors.neutral[400]} value={name} onChangeText={setName} />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Cor</Text>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorSwatch, { backgroundColor: c }, color === c && styles.colorSwatchSelected]}
                  onPress={() => setColor(c)}
                >
                  {color === c && <Ionicons name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={[styles.saveBtn, { marginTop: spacing.md }, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Criar turma</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral[50] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.neutral[700], marginTop: spacing.sm },
  retryBtn: { marginTop: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: '#FEF3C7', borderRadius: radius.md },
  retryText: { fontSize: fontSize.sm, color: ACCENT, fontWeight: '600' },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1, borderBottomColor: colors.neutral[100],
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: spacing.md,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: ACCENT },
  tabLabel: { fontSize: fontSize.xs, fontWeight: '600', color: colors.neutral[400] },
  tabLabelActive: { color: ACCENT },

  tabContent: { flex: 1 },

  // Search + add
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1, borderBottomColor: colors.neutral[100],
  },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.neutral[50], borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.neutral[200],
    paddingHorizontal: spacing.sm, height: 40,
  },
  searchInput: { flex: 1, fontSize: fontSize.sm, color: colors.neutral[900] },
  addBtn: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center',
  },
  countLabel: { flex: 1, fontSize: fontSize.sm, fontWeight: '600', color: colors.neutral[600] },

  listContent: { padding: spacing.lg, gap: spacing.sm },

  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { fontSize: fontSize.sm, color: colors.neutral[400], textAlign: 'center' },

  // Child admin row
  childRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.neutral.white,
    borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.neutral[100],
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2,
  },
  childAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  childInitial: { fontSize: fontSize.lg, fontWeight: '800' },
  childRowInfo: { flex: 1 },
  childRowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  childRowName: { flex: 1, fontSize: fontSize.sm, fontWeight: '600', color: colors.neutral[900] },
  childRowMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { fontSize: fontSize.xs, color: colors.neutral[500] },
  metaDot: { fontSize: fontSize.xs, color: colors.neutral[300] },
  groupBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  groupBadgeText: { fontSize: 11, fontWeight: '600' },
  alertChip: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  alertChipText: { fontSize: 11, color: '#D97706', flex: 1 },
  inactivePill: { paddingHorizontal: 6, paddingVertical: 1, backgroundColor: colors.neutral[100], borderRadius: radius.sm },
  inactivePillText: { fontSize: 10, fontWeight: '600', color: colors.neutral[500] },

  // Group row
  groupRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.neutral.white,
    borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.neutral[100],
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2,
  },
  colorDot: { width: 14, height: 14, borderRadius: 7, flexShrink: 0 },
  groupRowName: { fontSize: fontSize.sm, fontWeight: '600', color: colors.neutral[900] },
  groupRowCount: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: 1 },

  // Presença
  datePicker: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1, borderBottomColor: colors.neutral[100],
    paddingVertical: spacing.sm,
  },
  dateArrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dateLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.neutral[800], textTransform: 'capitalize' },
  dateTodayBadge: {
    fontSize: 10, fontWeight: '700', color: ACCENT,
    backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: radius.sm, marginTop: 2,
  },
  attendanceSummary: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1, borderBottomColor: colors.neutral[100],
    paddingVertical: spacing.sm,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNumber: { fontSize: fontSize.xl, fontWeight: '800', color: colors.neutral[900] },
  summaryLabel: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: 1 },
  summaryDivider: { width: 1, height: 32, backgroundColor: colors.neutral[100] },
  presencaSearchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.neutral[50],
    borderBottomWidth: 1, borderBottomColor: colors.neutral[100],
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  attendanceRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.neutral.white,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xs,
    borderWidth: 1, borderColor: colors.neutral[100],
  },
  attendanceRowPresent: { borderColor: colors.semantic.success + '50', backgroundColor: colors.semantic.successSoft },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 2, borderColor: colors.neutral[300],
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.semantic.success, borderColor: colors.semantic.success },
  attChildName: { fontSize: fontSize.sm, fontWeight: '600', color: colors.neutral[800] },
  attChildNamePresent: { color: colors.neutral[950] },
  attGroupName: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: 1 },
  attStatus: { fontSize: 11, fontWeight: '700' },

  saveBarWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.lg, backgroundColor: 'transparent',
  },
  saveBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.semantic.success,
    paddingVertical: spacing.md, borderRadius: radius.lg,
    shadowColor: colors.semantic.success, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  saveBarDisabled: { opacity: 0.6 },
  saveBarText: { fontSize: fontSize.md, fontWeight: '700', color: '#fff' },

  // Modais
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.neutral[950] },

  formGroup: { marginBottom: spacing.md },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.neutral[700], marginBottom: spacing.xs },
  field: {
    backgroundColor: colors.neutral[50], borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.neutral[200],
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: fontSize.sm, color: colors.neutral[900],
  },

  groupPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  groupPickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.neutral[200],
    backgroundColor: colors.neutral.white,
  },
  groupPickerItemActive: { borderColor: ACCENT, backgroundColor: '#FEF3C7' },
  groupPickerText: { fontSize: fontSize.xs, color: colors.neutral[600], fontWeight: '500' },
  groupPickerTextActive: { color: ACCENT, fontWeight: '700' },
  colorDotSmall: { width: 10, height: 10, borderRadius: 5 },

  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  colorSwatch: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'transparent',
  },
  colorSwatchSelected: { borderColor: colors.neutral[900] },

  saveBtn: {
    backgroundColor: ACCENT, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  saveBtnText: { fontSize: fontSize.md, fontWeight: '700', color: '#fff' },
})
