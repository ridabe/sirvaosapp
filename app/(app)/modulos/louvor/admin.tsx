import {
  View, Text, ScrollView, FlatList, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Modal, Alert,
  KeyboardAvoidingView, Platform, Linking,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState, useEffect, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  useWorshipAdmin,
  WorshipEvent,
  AdminWorshipAssignment,
  EventFormValues,
  AssignmentFormValues,
} from '@/hooks/useWorshipAdmin'
import {
  useWorshipRepertoire,
  CatalogSong,
  RepertoireItem,
  searchMusicItunes,
  MusicSearchResult,
} from '@/hooks/useWorshipRepertoire'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'

type Tab = 'eventos' | 'escalas' | 'repertorio'

const EVENT_TYPE_LABEL: Record<string, string> = {
  service: 'Culto',
  rehearsal: 'Ensaio',
  meeting: 'Reunião',
  other: 'Outro',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  draft: '#D97706',
  published: '#059669',
  completed: '#6B7280',
  cancelled: '#DC2626',
}

const ASSIGNMENT_STATUS_COLOR: Record<string, string> = {
  pending: '#D97706',
  confirmed: '#059669',
  declined: '#DC2626',
  standby: '#6B7280',
}

const ASSIGNMENT_STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  declined: 'Justificado',
  standby: 'Reserva',
}

function formatEventDate(iso: string) {
  return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

const emptyEventForm: EventFormValues = {
  title: '',
  event_type: 'service',
  starts_at: '',
  ends_at: '',
  location: '',
  notes: '',
  status: 'draft',
}

const emptyAssignmentForm: AssignmentFormValues = {
  event_id: '',
  member_id: '',
  role_id: '',
  role_name: '',
  arrival_at: '',
  notes: '',
}

export default function LouvorAdminScreen() {
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<Tab>('eventos')

  const {
    events, roles, eligibleMembers, assignmentsByEvent,
    loading, error, refetch,
    loadAssignments, createEvent, updateEvent, deleteEvent,
    createAssignment, deleteAssignment,
  } = useWorshipAdmin()

  if (loading && events.length === 0) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.brand.primary} /></View>
  }

  if (error && events.length === 0) {
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
        <TabButton label="Eventos" icon="calendar-outline" active={tab === 'eventos'} onPress={() => setTab('eventos')} />
        <TabButton label="Escalas" icon="people-outline" active={tab === 'escalas'} onPress={() => setTab('escalas')} />
        <TabButton label="Repertório" icon="musical-notes-outline" active={tab === 'repertorio'} onPress={() => setTab('repertorio')} />
      </View>

      {tab === 'eventos' && (
        <EventosTab
          events={events}
          loading={loading}
          onRefresh={refetch}
          onCreate={createEvent}
          onUpdate={updateEvent}
          onDelete={deleteEvent}
        />
      )}
      {tab === 'escalas' && (
        <EscalasTab
          events={events}
          roles={roles}
          eligibleMembers={eligibleMembers}
          assignmentsByEvent={assignmentsByEvent}
          onLoadAssignments={loadAssignments}
          onCreateAssignment={createAssignment}
          onDeleteAssignment={deleteAssignment}
        />
      )}
      {tab === 'repertorio' && (
        <RepertorioTab events={events} />
      )}
    </View>
  )
}

// ─── EVENTOS TAB ────────────────────────────────────────────────────────────

function EventosTab({
  events, loading, onRefresh, onCreate, onUpdate, onDelete,
}: {
  events: WorshipEvent[]
  loading: boolean
  onRefresh: () => void
  onCreate: (v: EventFormValues) => Promise<{ ok: boolean; id?: string; error?: string }>
  onUpdate: (id: string, v: EventFormValues) => Promise<{ ok: boolean; error?: string }>
  onDelete: (id: string) => Promise<{ ok: boolean; error?: string }>
}) {
  const [modalVisible, setModalVisible] = useState(false)
  const [editingEvent, setEditingEvent] = useState<WorshipEvent | null>(null)
  const [form, setForm] = useState<EventFormValues>(emptyEventForm)
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setEditingEvent(null)
    setForm(emptyEventForm)
    setModalVisible(true)
  }

  function openEdit(event: WorshipEvent) {
    setEditingEvent(event)
    setForm({
      title: event.title,
      event_type: event.event_type,
      starts_at: event.starts_at.slice(0, 16),
      ends_at: event.ends_at ? event.ends_at.slice(0, 16) : '',
      location: event.location ?? '',
      notes: event.notes ?? '',
      status: event.status,
    })
    setModalVisible(true)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.starts_at) {
      Alert.alert('Campos obrigatórios', 'Informe o título e a data/hora de início.')
      return
    }
    setSaving(true)
    const result = editingEvent
      ? await onUpdate(editingEvent.id, form)
      : await onCreate(form)
    setSaving(false)
    if (!result.ok) {
      Alert.alert('Erro', result.error ?? 'Não foi possível salvar.')
      return
    }
    setModalVisible(false)
  }

  async function handleDelete(event: WorshipEvent) {
    Alert.alert(
      'Excluir evento',
      `Excluir "${event.title}"? As escalas e o repertório também serão removidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            const result = await onDelete(event.id)
            if (!result.ok) Alert.alert('Erro', 'Não foi possível excluir.')
          },
        },
      ]
    )
  }

  return (
    <>
      <FlatList
        data={events}
        keyExtractor={e => e.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[colors.brand.primary]} tintColor={colors.brand.primary} />}
        ListHeaderComponent={
          <TouchableOpacity style={styles.createBtn} onPress={openCreate} activeOpacity={0.85}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.createBtnText}>Novo evento</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <View style={styles.emptyInline}>
            <Ionicons name="calendar-outline" size={36} color={colors.neutral[300]} />
            <Text style={styles.emptyInlineText}>Nenhum evento cadastrado</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.eventCard}>
            <View style={styles.eventCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventCardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.eventCardMeta}>
                  {EVENT_TYPE_LABEL[item.event_type] ?? 'Evento'} · {formatEventDate(item.starts_at)}
                </Text>
                {item.location ? <Text style={styles.eventCardMeta}>{item.location}</Text> : null}
              </View>
              <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLOR[item.status]}20` }]}>
                <Text style={[styles.statusPillText, { color: STATUS_COLOR[item.status] }]}>
                  {STATUS_LABEL[item.status]}
                </Text>
              </View>
            </View>
            <View style={styles.eventCardActions}>
              <TouchableOpacity style={styles.eventAction} onPress={() => openEdit(item)}>
                <Ionicons name="pencil-outline" size={16} color={colors.brand.primary} />
                <Text style={[styles.eventActionText, { color: colors.brand.primary }]}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.eventAction} onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={16} color={colors.semantic.danger} />
                <Text style={[styles.eventActionText, { color: colors.semantic.danger }]}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{editingEvent ? 'Editar evento' : 'Novo evento'}</Text>

              <FormLabel>Título *</FormLabel>
              <TextInput
                style={styles.input}
                placeholder="Ex: Culto de Domingo"
                placeholderTextColor={colors.neutral[400]}
                value={form.title}
                onChangeText={v => setForm(f => ({ ...f, title: v }))}
              />

              <FormLabel>Tipo</FormLabel>
              <SegmentPicker
                options={[
                  { value: 'service', label: 'Culto' },
                  { value: 'rehearsal', label: 'Ensaio' },
                  { value: 'meeting', label: 'Reunião' },
                  { value: 'other', label: 'Outro' },
                ]}
                value={form.event_type}
                onChange={v => setForm(f => ({ ...f, event_type: v as any }))}
              />

              <FormLabel>Início *</FormLabel>
              <TextInput
                style={styles.input}
                placeholder="AAAA-MM-DD HH:MM"
                placeholderTextColor={colors.neutral[400]}
                value={form.starts_at}
                onChangeText={v => setForm(f => ({ ...f, starts_at: v }))}
                keyboardType="numbers-and-punctuation"
              />

              <FormLabel>Término (opcional)</FormLabel>
              <TextInput
                style={styles.input}
                placeholder="AAAA-MM-DD HH:MM"
                placeholderTextColor={colors.neutral[400]}
                value={form.ends_at}
                onChangeText={v => setForm(f => ({ ...f, ends_at: v }))}
                keyboardType="numbers-and-punctuation"
              />

              <FormLabel>Local</FormLabel>
              <TextInput
                style={styles.input}
                placeholder="Templo principal, Salão..."
                placeholderTextColor={colors.neutral[400]}
                value={form.location}
                onChangeText={v => setForm(f => ({ ...f, location: v }))}
              />

              <FormLabel>Observações</FormLabel>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Informações adicionais..."
                placeholderTextColor={colors.neutral[400]}
                value={form.notes}
                onChangeText={v => setForm(f => ({ ...f, notes: v }))}
                multiline
                numberOfLines={3}
              />

              <FormLabel>Status</FormLabel>
              <SegmentPicker
                options={[
                  { value: 'draft', label: 'Rascunho' },
                  { value: 'published', label: 'Publicado' },
                  { value: 'completed', label: 'Concluído' },
                  { value: 'cancelled', label: 'Cancelado' },
                ]}
                value={form.status}
                onChange={v => setForm(f => ({ ...f, status: v as any }))}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)} disabled={saving}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.modalSaveText}>Salvar</Text>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  )
}

// ─── ESCALAS TAB ────────────────────────────────────────────────────────────

function EscalasTab({
  events, roles, eligibleMembers, assignmentsByEvent,
  onLoadAssignments, onCreateAssignment, onDeleteAssignment,
}: {
  events: WorshipEvent[]
  roles: ReturnType<typeof useWorshipAdmin>['roles']
  eligibleMembers: ReturnType<typeof useWorshipAdmin>['eligibleMembers']
  assignmentsByEvent: ReturnType<typeof useWorshipAdmin>['assignmentsByEvent']
  onLoadAssignments: (id: string) => Promise<AdminWorshipAssignment[]>
  onCreateAssignment: (v: AssignmentFormValues) => Promise<{ ok: boolean; error?: string }>
  onDeleteAssignment: (assignmentId: string, eventId: string) => Promise<{ ok: boolean }>
}) {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id ?? '')
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form, setForm] = useState<AssignmentFormValues>({ ...emptyAssignmentForm })
  const [saving, setSaving] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [showMemberList, setShowMemberList] = useState(false)
  const [showEventList, setShowEventList] = useState(false)

  const selectedEvent = events.find(e => e.id === selectedEventId)
  const assignments = assignmentsByEvent[selectedEventId] ?? []

  useEffect(() => {
    if (selectedEventId) {
      setLoadingAssignments(true)
      onLoadAssignments(selectedEventId).finally(() => setLoadingAssignments(false))
    }
  }, [selectedEventId])

  useEffect(() => {
    if (events.length > 0 && !selectedEventId) setSelectedEventId(events[0].id)
  }, [events])

  const filteredMembers = eligibleMembers.filter(m =>
    memberSearch ? m.name.toLowerCase().includes(memberSearch.toLowerCase()) : true
  )

  async function handleAdd() {
    if (!form.member_id || (!form.role_id && !form.role_name.trim())) {
      Alert.alert('Campos obrigatórios', 'Selecione um membro e informe a função.')
      return
    }
    setSaving(true)
    const result = await onCreateAssignment({ ...form, event_id: selectedEventId })
    setSaving(false)
    if (!result.ok) { Alert.alert('Erro', result.error ?? 'Não foi possível escalar.'); return }
    setModalVisible(false)
    setForm({ ...emptyAssignmentForm })
  }

  async function handleDelete(a: AdminWorshipAssignment) {
    Alert.alert('Remover escalado', `Remover ${a.member_name} da escala?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          await onDeleteAssignment(a.id, selectedEventId)
        },
      },
    ])
  }

  const selectedMember = eligibleMembers.find(m => m.id === form.member_id)

  return (
    <ScrollView contentContainerStyle={styles.listContent}>
      {/* Event selector */}
      <View style={styles.selectorRow}>
        <Text style={styles.selectorLabel}>Evento:</Text>
        <TouchableOpacity style={styles.selectorBtn} onPress={() => setShowEventList(true)}>
          <Text style={styles.selectorBtnText} numberOfLines={1}>
            {selectedEvent ? selectedEvent.title : 'Selecionar evento'}
          </Text>
          <Ionicons name="chevron-down-outline" size={16} color={colors.neutral[500]} />
        </TouchableOpacity>
      </View>

      {selectedEvent && (
        <Text style={styles.selectorSub}>
          {formatEventDate(selectedEvent.starts_at)}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.createBtn, { marginTop: spacing.md }]}
        onPress={() => {
          setForm({ ...emptyAssignmentForm, event_id: selectedEventId })
          setMemberSearch('')
          setModalVisible(true)
        }}
        activeOpacity={0.85}
        disabled={!selectedEventId}
      >
        <Ionicons name="person-add-outline" size={20} color="#fff" />
        <Text style={styles.createBtnText}>Escalar membro</Text>
      </TouchableOpacity>

      {loadingAssignments && (
        <ActivityIndicator size="small" color={colors.brand.primary} style={{ marginTop: spacing.lg }} />
      )}

      {!loadingAssignments && assignments.length === 0 && selectedEventId && (
        <View style={styles.emptyInline}>
          <Ionicons name="people-outline" size={36} color={colors.neutral[300]} />
          <Text style={styles.emptyInlineText}>Nenhum membro escalado</Text>
        </View>
      )}

      {assignments.map(a => (
        <View key={a.id} style={styles.assignmentCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.assignmentName}>{a.member_name}</Text>
            {a.assigned_role && <Text style={styles.assignmentRole}>{a.assigned_role}</Text>}
            {a.arrival_at && (
              <Text style={styles.assignmentMeta}>
                Chegada: {format(parseISO(a.arrival_at), 'HH:mm')}
              </Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <View style={[styles.statusPill, { backgroundColor: `${ASSIGNMENT_STATUS_COLOR[a.status]}20` }]}>
              <Text style={[styles.statusPillText, { color: ASSIGNMENT_STATUS_COLOR[a.status] }]}>
                {ASSIGNMENT_STATUS_LABEL[a.status]}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(a)}>
              <Ionicons name="trash-outline" size={18} color={colors.semantic.danger} />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Event picker modal */}
      <Modal visible={showEventList} transparent animationType="slide" onRequestClose={() => setShowEventList(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowEventList(false)}>
          <View style={styles.pickerSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Selecionar evento</Text>
            <ScrollView>
              {events.map(e => (
                <TouchableOpacity
                  key={e.id}
                  style={[styles.pickerItem, e.id === selectedEventId && styles.pickerItemActive]}
                  onPress={() => { setSelectedEventId(e.id); setShowEventList(false) }}
                >
                  <Text style={[styles.pickerItemText, e.id === selectedEventId && { color: colors.brand.primary, fontWeight: '700' }]}>
                    {e.title}
                  </Text>
                  <Text style={styles.pickerItemSub}>{formatEventDate(e.starts_at)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Assignment modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Escalar membro</Text>

              <FormLabel>Membro *</FormLabel>
              <TouchableOpacity
                style={[styles.input, styles.inputRow]}
                onPress={() => setShowMemberList(true)}
              >
                <Text style={[styles.inputText, !selectedMember && { color: colors.neutral[400] }]}>
                  {selectedMember ? selectedMember.name : 'Selecionar membro'}
                </Text>
                <Ionicons name="chevron-down-outline" size={16} color={colors.neutral[400]} />
              </TouchableOpacity>
              {selectedMember?.ministry && (
                <Text style={styles.memberMinistry}>{selectedMember.ministry}</Text>
              )}

              <FormLabel>Função predefinida</FormLabel>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', gap: spacing.xs, paddingBottom: 4 }}>
                  {roles.map(r => (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.roleChip, form.role_id === r.id && styles.roleChipActive]}
                      onPress={() => setForm(f => ({ ...f, role_id: f.role_id === r.id ? '' : r.id, role_name: '' }))}
                    >
                      <Text style={[styles.roleChipText, form.role_id === r.id && styles.roleChipTextActive]}>
                        {r.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <FormLabel>Ou função personalizada</FormLabel>
              <TextInput
                style={styles.input}
                placeholder="Ex: Apoio técnico, Câmera..."
                placeholderTextColor={colors.neutral[400]}
                value={form.role_name}
                onChangeText={v => setForm(f => ({ ...f, role_name: v, role_id: '' }))}
              />

              <FormLabel>Horário de chegada (opcional)</FormLabel>
              <TextInput
                style={styles.input}
                placeholder="AAAA-MM-DD HH:MM"
                placeholderTextColor={colors.neutral[400]}
                value={form.arrival_at}
                onChangeText={v => setForm(f => ({ ...f, arrival_at: v }))}
                keyboardType="numbers-and-punctuation"
              />

              <FormLabel>Observações (opcional)</FormLabel>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Informações para o membro..."
                placeholderTextColor={colors.neutral[400]}
                value={form.notes}
                onChangeText={v => setForm(f => ({ ...f, notes: v }))}
                multiline
                numberOfLines={2}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)} disabled={saving}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAdd} disabled={saving} activeOpacity={0.85}>
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.modalSaveText}>Escalar</Text>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Member picker modal */}
      <Modal visible={showMemberList} transparent animationType="slide" onRequestClose={() => setShowMemberList(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.pickerSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Selecionar membro</Text>
            <Text style={styles.modalSubtitle}>Apenas membros dos ministérios de louvor, mídia, som, dança, iluminação e artes.</Text>
            <TextInput
              style={[styles.input, { marginTop: spacing.sm }]}
              placeholder="Buscar por nome..."
              placeholderTextColor={colors.neutral[400]}
              value={memberSearch}
              onChangeText={setMemberSearch}
            />
            <ScrollView>
              {filteredMembers.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.pickerItem, form.member_id === m.id && styles.pickerItemActive]}
                  onPress={() => { setForm(f => ({ ...f, member_id: m.id })); setShowMemberList(false) }}
                >
                  <Text style={[styles.pickerItemText, form.member_id === m.id && { color: colors.brand.primary, fontWeight: '700' }]}>
                    {m.name}
                  </Text>
                  {m.ministry && <Text style={styles.pickerItemSub}>{m.ministry}</Text>}
                </TouchableOpacity>
              ))}
              {filteredMembers.length === 0 && (
                <Text style={styles.emptyInlineText}>Nenhum membro encontrado</Text>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  )
}

// ─── REPERTÓRIO TAB ─────────────────────────────────────────────────────────

function RepertorioTab({ events }: { events: WorshipEvent[] }) {
  const {
    catalogSongs, catalogLoading, repertoire, repertoireLoading,
    loadCatalog, loadEventRepertoire,
    addSongToCatalog, addSongToEvent, removeSongFromEvent,
    buildCifraClubUrl, buildYouTubeUrl,
  } = useWorshipRepertoire()

  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id ?? '')
  const [showEventList, setShowEventList] = useState(false)
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MusicSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [manualTitle, setManualTitle] = useState('')
  const [manualArtist, setManualArtist] = useState('')
  const [addingManual, setAddingManual] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const selectedEvent = events.find(e => e.id === selectedEventId)

  useEffect(() => {
    if (selectedEventId) loadEventRepertoire(selectedEventId)
  }, [selectedEventId])

  useEffect(() => {
    if (events.length > 0 && !selectedEventId) setSelectedEventId(events[0].id)
  }, [events])

  async function handleSearch() {
    if (!searchQuery.trim()) return
    setSearching(true)
    const results = await searchMusicItunes(searchQuery)
    setSearchResults(results)
    setSearching(false)
  }

  async function handleAddFromSearch(result: MusicSearchResult) {
    setAddingId(result.id)
    // First add to catalog, then add to event
    const catalogResult = await addSongToCatalog(result.title, result.artist)
    if (!catalogResult.ok && !catalogResult.error?.includes('já está no catálogo')) {
      Alert.alert('Erro', catalogResult.error ?? 'Não foi possível adicionar.')
      setAddingId(null)
      return
    }

    // Find song in catalog or use newly created
    let song = catalogResult.song
    if (!song) {
      // Already in catalog — find it
      const found = catalogSongs.find(
        s => s.title.toLowerCase() === result.title.toLowerCase() &&
             s.artist.toLowerCase() === result.artist.toLowerCase()
      )
      song = found
    }

    if (!song) {
      // Reload catalog
      await loadCatalog()
      setAddingId(null)
      Alert.alert('Aviso', 'Música adicionada ao catálogo. Tente adicionar ao evento novamente.')
      return
    }

    const eventResult = await addSongToEvent(selectedEventId, song)
    setAddingId(null)
    if (!eventResult.ok) Alert.alert('Aviso', eventResult.error ?? 'Não foi possível adicionar ao evento.')
  }

  async function handleAddManual() {
    if (!manualTitle.trim() || !manualArtist.trim()) {
      Alert.alert('Campos obrigatórios', 'Informe o título e o artista.')
      return
    }
    setAddingManual(true)
    const catalogResult = await addSongToCatalog(manualTitle, manualArtist)

    let song = catalogResult.song
    if (!song) {
      if (catalogResult.error?.includes('já está no catálogo')) {
        await loadCatalog()
        const found = catalogSongs.find(
          s => s.title.toLowerCase() === manualTitle.toLowerCase().trim() &&
               s.artist.toLowerCase() === manualArtist.toLowerCase().trim()
        )
        song = found
      }
    }

    if (song) {
      await addSongToEvent(selectedEventId, song)
    }

    setAddingManual(false)
    setManualTitle('')
    setManualArtist('')
    if (!catalogResult.ok && !catalogResult.error?.includes('já está no catálogo')) {
      Alert.alert('Erro', catalogResult.error ?? 'Não foi possível adicionar.')
    }
  }

  async function handleRemove(item: RepertoireItem) {
    if (!item.id) return
    Alert.alert('Remover música', `Remover "${item.song.title}" do repertório?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          setRemovingId(item.id!)
          await removeSongFromEvent(item.id!)
          setRemovingId(null)
        },
      },
    ])
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.listContent}>
        {/* Event selector */}
        <View style={styles.selectorRow}>
          <Text style={styles.selectorLabel}>Evento:</Text>
          <TouchableOpacity style={styles.selectorBtn} onPress={() => setShowEventList(true)}>
            <Text style={styles.selectorBtnText} numberOfLines={1}>
              {selectedEvent ? selectedEvent.title : 'Selecionar evento'}
            </Text>
            <Ionicons name="chevron-down-outline" size={16} color={colors.neutral[500]} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.createBtn, { marginTop: spacing.md }]}
          onPress={() => { setSearchQuery(''); setSearchResults([]); setAddModalVisible(true) }}
          activeOpacity={0.85}
          disabled={!selectedEventId}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.createBtnText}>Adicionar música</Text>
        </TouchableOpacity>

        {repertoireLoading && (
          <ActivityIndicator size="small" color={colors.brand.primary} style={{ marginTop: spacing.lg }} />
        )}

        {!repertoireLoading && repertoire.length === 0 && selectedEventId && (
          <View style={styles.emptyInline}>
            <Ionicons name="musical-notes-outline" size={36} color={colors.neutral[300]} />
            <Text style={styles.emptyInlineText}>Nenhuma música no repertório</Text>
          </View>
        )}

        {repertoire.map((item, index) => (
          <View key={item.id ?? index} style={styles.songCard}>
            <View style={styles.songPosition}>
              <Text style={styles.songPositionText}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.songTitle} numberOfLines={1}>{item.song.title}</Text>
              <Text style={styles.songArtist} numberOfLines={1}>{item.song.artist}</Text>
              {item.key ? <Text style={styles.songKey}>Tom: {item.key}</Text> : null}
              <View style={styles.songLinks}>
                {item.song.cifraclub_url && (
                  <TouchableOpacity
                    style={styles.songLink}
                    onPress={() => Linking.openURL(item.song.cifraclub_url!)}
                  >
                    <Ionicons name="musical-note-outline" size={14} color={colors.brand.primary} />
                    <Text style={styles.songLinkText}>Cifra</Text>
                  </TouchableOpacity>
                )}
                {item.song.youtube_url && (
                  <TouchableOpacity
                    style={styles.songLink}
                    onPress={() => Linking.openURL(item.song.youtube_url!)}
                  >
                    <Ionicons name="logo-youtube" size={14} color="#DC2626" />
                    <Text style={[styles.songLinkText, { color: '#DC2626' }]}>YouTube</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={() => handleRemove(item)} disabled={removingId === item.id}>
              {removingId === item.id
                ? <ActivityIndicator size="small" color={colors.semantic.danger} />
                : <Ionicons name="trash-outline" size={20} color={colors.semantic.danger} />
              }
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Event picker modal */}
      <Modal visible={showEventList} transparent animationType="slide" onRequestClose={() => setShowEventList(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowEventList(false)}>
          <View style={styles.pickerSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Selecionar evento</Text>
            <ScrollView>
              {events.map(e => (
                <TouchableOpacity
                  key={e.id}
                  style={[styles.pickerItem, e.id === selectedEventId && styles.pickerItemActive]}
                  onPress={() => { setSelectedEventId(e.id); setShowEventList(false) }}
                >
                  <Text style={[styles.pickerItemText, e.id === selectedEventId && { color: colors.brand.primary, fontWeight: '700' }]}>
                    {e.title}
                  </Text>
                  <Text style={styles.pickerItemSub}>{formatEventDate(e.starts_at)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add song modal */}
      <AddSongModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        manualTitle={manualTitle}
        manualArtist={manualArtist}
        onManualTitleChange={setManualTitle}
        onManualArtistChange={setManualArtist}
        onAddManual={handleAddManual}
        addingManual={addingManual}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={handleSearch}
        searching={searching}
        searchResults={searchResults}
        addingId={addingId}
        onAddFromSearch={handleAddFromSearch}
      />
    </>
  )
}

// ─── ADD SONG MODAL ─────────────────────────────────────────────────────────

type AddSongModalProps = {
  visible: boolean
  onClose: () => void
  manualTitle: string
  manualArtist: string
  onManualTitleChange: (v: string) => void
  onManualArtistChange: (v: string) => void
  onAddManual: () => void
  addingManual: boolean
  searchQuery: string
  onSearchQueryChange: (v: string) => void
  onSearch: () => void
  searching: boolean
  searchResults: MusicSearchResult[]
  addingId: string | null
  onAddFromSearch: (r: MusicSearchResult) => void
}

function AddSongModal({
  visible, onClose,
  manualTitle, manualArtist, onManualTitleChange, onManualArtistChange, onAddManual, addingManual,
  searchQuery, onSearchQueryChange, onSearch, searching, searchResults, addingId, onAddFromSearch,
}: AddSongModalProps) {
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState<'manual' | 'itunes'>('itunes')

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <View style={[styles.addSongSheet, { paddingBottom: insets.bottom + spacing.sm }]}>
          {/* Handle + Header */}
          <View style={styles.modalHandle} />
          <View style={styles.addModalHeader}>
            <Text style={styles.modalTitle}>Adicionar música</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close-outline" size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          {/* Tab switcher */}
          <View style={styles.addSongTabs}>
            <TouchableOpacity
              style={[styles.addSongTab, activeTab === 'itunes' && styles.addSongTabActive]}
              onPress={() => setActiveTab('itunes')}
            >
              <Ionicons name="search-outline" size={15} color={activeTab === 'itunes' ? colors.brand.primary : colors.neutral[500]} />
              <Text style={[styles.addSongTabText, activeTab === 'itunes' && styles.addSongTabTextActive]}>
                Buscar iTunes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addSongTab, activeTab === 'manual' && styles.addSongTabActive]}
              onPress={() => setActiveTab('manual')}
            >
              <Ionicons name="create-outline" size={15} color={activeTab === 'manual' ? colors.brand.primary : colors.neutral[500]} />
              <Text style={[styles.addSongTabText, activeTab === 'manual' && styles.addSongTabTextActive]}>
                Inserir manualmente
              </Text>
            </TouchableOpacity>
          </View>

          {/* iTunes tab: campo fixo no topo, resultados scrolláveis abaixo */}
          {activeTab === 'itunes' && (
            <View style={{ flex: 1 }}>
              <View style={styles.searchRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Nome da música ou artista..."
                  placeholderTextColor={colors.neutral[400]}
                  value={searchQuery}
                  onChangeText={onSearchQueryChange}
                  onSubmitEditing={onSearch}
                  returnKeyType="search"
                  autoFocus={false}
                />
                <TouchableOpacity style={styles.searchBtn} onPress={onSearch} disabled={searching}>
                  {searching
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Ionicons name="search-outline" size={20} color="#fff" />
                  }
                </TouchableOpacity>
              </View>

              {searching && (
                <ActivityIndicator size="small" color={colors.brand.primary} style={{ marginTop: spacing.lg }} />
              )}

              <FlatList
                data={searchResults}
                keyExtractor={r => r.id}
                style={{ flex: 1 }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  searchQuery && !searching
                    ? <Text style={[styles.emptyInlineText, { marginTop: spacing.lg }]}>Nenhum resultado encontrado</Text>
                    : !searching && searchResults.length === 0
                    ? <Text style={[styles.emptyInlineText, { marginTop: spacing.lg }]}>Digite o nome da música ou artista e toque em buscar</Text>
                    : null
                }
                renderItem={({ item }) => (
                  <View style={styles.searchResultItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
                      {item.album ? <Text style={styles.songKey} numberOfLines={1}>{item.album}</Text> : null}
                    </View>
                    <TouchableOpacity
                      style={styles.addSongBtn}
                      onPress={() => onAddFromSearch(item)}
                      disabled={addingId === item.id}
                    >
                      {addingId === item.id
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Ionicons name="add-outline" size={18} color="#fff" />
                      }
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          )}

          {/* Manual tab: ScrollView simples */}
          {activeTab === 'manual' && (
            <ScrollView
              style={{ flex: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.manualSectionTitle, { marginBottom: spacing.sm }]}>
                Informe o título e o artista para adicionar ao catálogo e ao evento.
              </Text>
              <FormLabel>Título da música *</FormLabel>
              <TextInput
                style={styles.input}
                placeholder="Ex: Oceans"
                placeholderTextColor={colors.neutral[400]}
                value={manualTitle}
                onChangeText={onManualTitleChange}
              />
              <FormLabel>Artista / Ministério *</FormLabel>
              <TextInput
                style={styles.input}
                placeholder="Ex: Hillsong United"
                placeholderTextColor={colors.neutral[400]}
                value={manualArtist}
                onChangeText={onManualArtistChange}
              />
              <TouchableOpacity
                style={[styles.createBtn, { marginTop: spacing.sm }]}
                onPress={onAddManual}
                disabled={addingManual}
                activeOpacity={0.85}
              >
                {addingManual
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                    <Ionicons name="add-outline" size={18} color="#fff" />
                    <Text style={styles.createBtnText}>Adicionar ao evento</Text>
                  </>
                }
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── SHARED COMPONENTS ──────────────────────────────────────────────────────

function TabButton({ label, icon, active, onPress }: { label: string; icon: any; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.tabBtn, active && styles.tabBtnActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={18} color={active ? colors.brand.primary : colors.neutral[500]} />
      <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

function FormLabel({ children }: { children: string }) {
  return <Text style={styles.formLabel}>{children}</Text>
}

function SegmentPicker<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segmentOption, opt.value === value && styles.segmentOptionActive]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[styles.segmentOptionText, opt.value === value && styles.segmentOptionTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral[50] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.neutral[700], marginTop: spacing.sm },
  retryBtn: { marginTop: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.brand.primarySoft, borderRadius: radius.md },
  retryText: { fontSize: fontSize.sm, color: colors.brand.primary, fontWeight: '600' },

  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.neutral[100], backgroundColor: colors.neutral.white },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: spacing.sm + 2, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: colors.brand.primary },
  tabBtnText: { fontSize: fontSize.xs, fontWeight: '500', color: colors.neutral[500] },
  tabBtnTextActive: { color: colors.brand.primary, fontWeight: '700' },

  listContent: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  emptyInline: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  emptyInlineText: { fontSize: fontSize.sm, color: colors.neutral[400], textAlign: 'center' },

  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg,
    backgroundColor: colors.brand.primary,
  },
  createBtnText: { fontSize: fontSize.md, fontWeight: '700', color: '#fff' },

  eventCard: {
    backgroundColor: colors.neutral.white, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.neutral[100], overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  eventCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md },
  eventCardTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.neutral[950] },
  eventCardMeta: { fontSize: fontSize.xs, color: colors.neutral[500], marginTop: 2 },
  eventCardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.neutral[50] },
  eventAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: spacing.sm },
  eventActionText: { fontSize: fontSize.sm, fontWeight: '600' },

  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  assignmentCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    backgroundColor: colors.neutral.white, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.neutral[100], padding: spacing.md,
  },
  assignmentName: { fontSize: fontSize.md, fontWeight: '600', color: colors.neutral[950] },
  assignmentRole: { fontSize: fontSize.sm, color: colors.brand.primary, fontWeight: '500', marginTop: 2 },
  assignmentMeta: { fontSize: fontSize.xs, color: colors.neutral[500], marginTop: 2 },

  songCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.neutral.white, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.neutral[100], padding: spacing.md,
  },
  songPosition: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.brand.primarySoft,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  songPositionText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brand.primary },
  songTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.neutral[950] },
  songArtist: { fontSize: fontSize.sm, color: colors.neutral[500], marginTop: 1 },
  songKey: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: 2 },
  songLinks: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  songLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  songLinkText: { fontSize: fontSize.xs, color: colors.brand.primary, fontWeight: '600' },

  selectorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  selectorLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.neutral[600] },
  selectorBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.neutral.white, borderWidth: 1, borderColor: colors.neutral[200],
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  selectorBtnText: { fontSize: fontSize.sm, color: colors.neutral[800], flex: 1 },
  selectorSub: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: 2 },

  // Form
  formLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.neutral[600], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.neutral[50], borderWidth: 1, borderColor: colors.neutral[200],
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12,
    fontSize: fontSize.md, color: colors.neutral[950], marginBottom: spacing.sm,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inputText: { fontSize: fontSize.md, color: colors.neutral[950], flex: 1 },
  memberMinistry: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: -spacing.xs, marginBottom: spacing.sm },

  roleChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full ?? 99, borderWidth: 1, borderColor: colors.neutral[200],
    backgroundColor: colors.neutral.white,
  },
  roleChipActive: { backgroundColor: colors.brand.primarySoft, borderColor: colors.brand.primary },
  roleChipText: { fontSize: fontSize.sm, color: colors.neutral[600] },
  roleChipTextActive: { color: colors.brand.primary, fontWeight: '700' },

  segmentOption: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.neutral[200],
    backgroundColor: colors.neutral.white,
  },
  segmentOptionActive: { backgroundColor: colors.brand.primarySoft, borderColor: colors.brand.primary },
  segmentOptionText: { fontSize: fontSize.sm, color: colors.neutral[600] },
  segmentOptionTextActive: { color: colors.brand.primary, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: colors.neutral.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, gap: spacing.md, maxHeight: '90%',
  },
  pickerSheet: {
    backgroundColor: colors.neutral.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, gap: spacing.sm, maxHeight: '80%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.neutral[200], borderRadius: 2, alignSelf: 'center', marginBottom: spacing.xs },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.neutral[950] },
  modalSubtitle: { fontSize: fontSize.sm, color: colors.neutral[500], lineHeight: 20 },
  addModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  modalCancelBtn: { flex: 1, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.neutral[100], alignItems: 'center' },
  modalCancelText: { fontSize: fontSize.md, fontWeight: '600', color: colors.neutral[600] },
  modalSaveBtn: { flex: 2, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.brand.primary, alignItems: 'center' },
  modalSaveText: { fontSize: fontSize.md, fontWeight: '700', color: '#fff' },

  pickerItem: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.neutral[50] },
  pickerItemActive: { backgroundColor: colors.brand.primarySoft },
  pickerItemText: { fontSize: fontSize.md, color: colors.neutral[800] },
  pickerItemSub: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: 2 },

  // Song search
  searchRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.sm },
  searchBtn: { backgroundColor: colors.brand.primary, padding: 12, borderRadius: radius.md },
  searchResultItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.neutral[50],
  },
  addSongBtn: { backgroundColor: colors.brand.primary, borderRadius: radius.md, padding: 8, alignItems: 'center', justifyContent: 'center' },
  manualSection: { borderWidth: 1, borderColor: colors.neutral[100], borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs, marginBottom: spacing.md },
  manualSectionTitle: { fontSize: fontSize.sm, color: colors.neutral[500], lineHeight: 20 },

  addSongSheet: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    flex: 1,
    marginTop: 60,
  },
  addSongTabs: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  addSongTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.neutral[50],
  },
  addSongTabActive: { backgroundColor: colors.brand.primarySoft },
  addSongTabText: { fontSize: fontSize.sm, color: colors.neutral[500], fontWeight: '500' },
  addSongTabTextActive: { color: colors.brand.primary, fontWeight: '700' },
})
