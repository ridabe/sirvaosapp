import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, TextInput, ActivityIndicator, ActionSheetIOS, Platform,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState, useEffect } from 'react'
import { useMember } from '@/hooks/useMember'
import { useSignOut } from '@/hooks/useAuth'
import { useModules } from '@/hooks/useModules'
import {
  pickImage, captureImage, uploadAvatar,
  updateProfileName, updateProfileAvatar, updateMemberPhone,
} from '@/lib/profile'
import { SkeletonBox } from '@/components/ui/SkeletonBox'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—'
  const d = phone.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return phone
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  suspended: 'Suspenso',
  visitor: 'Visitante',
  member: 'Membro',
}

export default function PerfilScreen() {
  const insets = useSafeAreaInsets()
  const { profile, member, firstName, loading, refetch } = useMember()
  const { modules } = useModules(profile?.tenant_id ?? (loading ? undefined : null))
  const { execute: signOut, loading: signingOut } = useSignOut()

  const [editingName, setEditingName] = useState(false)
  const [editingPhone, setEditingPhone] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [phoneValue, setPhoneValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (profile?.full_name) setNameValue(profile.full_name)
    if (member?.phone) setPhoneValue(member.phone)
  }, [profile, member])

  async function handleAvatarPress() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancelar', 'Tirar foto', 'Escolher da galeria'], cancelButtonIndex: 0 },
        async (index) => {
          if (index === 1) await doUpload('camera')
          if (index === 2) await doUpload('gallery')
        }
      )
    } else {
      Alert.alert('Foto de perfil', 'Escolha uma opção', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tirar foto', onPress: () => doUpload('camera') },
        { text: 'Galeria', onPress: () => doUpload('gallery') },
      ])
    }
  }

  async function doUpload(source: 'camera' | 'gallery') {
    const uri = source === 'camera' ? await captureImage() : await pickImage()
    if (!uri || !profile) return
    setUploadingAvatar(true)
    try {
      const url = await uploadAvatar(profile.id, uri)
      await updateProfileAvatar(profile.id, url)
      await refetch()
    } catch (err: any) {
      const msg = err?.message ?? String(err)
      Alert.alert('Erro ao atualizar foto', msg)
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function saveName() {
    if (!nameValue.trim() || !profile) return
    setSaving(true)
    try {
      await updateProfileName(profile.id, nameValue.trim())
      await refetch()
      setEditingName(false)
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o nome.')
    } finally {
      setSaving(false)
    }
  }

  async function savePhone() {
    if (!member) return
    setSaving(true)
    try {
      await updateMemberPhone(member.id, phoneValue.trim())
      await refetch()
      setEditingPhone(false)
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o telefone.')
    } finally {
      setSaving(false)
    }
  }

  function handleSignOut() {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut() },
    ])
  }

  const adminModules = modules.filter(m => m.isAdmin)

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8} style={styles.avatarWrap}>
          {loading ? (
            <SkeletonBox width={96} height={96} borderRadius={48} />
          ) : profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{firstName?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            {uploadingAvatar
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="camera" size={14} color="#fff" />
            }
          </View>
        </TouchableOpacity>

        {loading ? (
          <>
            <SkeletonBox width={160} height={18} style={{ marginTop: spacing.md }} />
            <SkeletonBox width={120} height={13} style={{ marginTop: 6 }} />
          </>
        ) : (
          <>
            <Text style={styles.avatarName}>{profile?.full_name ?? '—'}</Text>
            <Text style={styles.avatarEmail}>{profile?.email ?? ''}</Text>
          </>
        )}
      </View>

      {/* Dados pessoais */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dados pessoais</Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Nome completo</Text>
          {editingName ? (
            <View style={styles.fieldEditRow}>
              <TextInput
                style={styles.fieldInput}
                value={nameValue}
                onChangeText={setNameValue}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveName}
              />
              <TouchableOpacity onPress={saveName} disabled={saving} style={styles.saveBtn}>
                {saving
                  ? <ActivityIndicator size="small" color={colors.brand.primary} />
                  : <Ionicons name="checkmark" size={20} color={colors.brand.primary} />
                }
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setEditingName(false); setNameValue(profile?.full_name ?? '') }}
                style={styles.cancelBtn}
              >
                <Ionicons name="close" size={20} color={colors.neutral[500]} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.fieldValueRow} onPress={() => setEditingName(true)}>
              <Text style={styles.fieldValue}>{profile?.full_name ?? '—'}</Text>
              <Ionicons name="pencil-outline" size={16} color={colors.neutral[300]} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Telefone</Text>
          {editingPhone ? (
            <View style={styles.fieldEditRow}>
              <TextInput
                style={styles.fieldInput}
                value={phoneValue}
                onChangeText={setPhoneValue}
                keyboardType="phone-pad"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={savePhone}
              />
              <TouchableOpacity onPress={savePhone} disabled={saving} style={styles.saveBtn}>
                {saving
                  ? <ActivityIndicator size="small" color={colors.brand.primary} />
                  : <Ionicons name="checkmark" size={20} color={colors.brand.primary} />
                }
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setEditingPhone(false); setPhoneValue(member?.phone ?? '') }}
                style={styles.cancelBtn}
              >
                <Ionicons name="close" size={20} color={colors.neutral[500]} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.fieldValueRow} onPress={() => setEditingPhone(true)}>
              <Text style={styles.fieldValue}>{formatPhone(member?.phone)}</Text>
              <Ionicons name="pencil-outline" size={16} color={colors.neutral[300]} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>E-mail</Text>
          <Text style={[styles.fieldValue, { color: colors.neutral[700] }]}>{profile?.email ?? '—'}</Text>
        </View>
      </View>

      {/* Membresia */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Membresia</Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Status</Text>
          {loading ? (
            <SkeletonBox width={80} height={14} />
          ) : (
            <View style={styles.fieldValueRow}>
              <View style={[
                styles.statusDot,
                { backgroundColor: (member?.status === 'active' || member?.status === 'member') ? colors.semantic.success : colors.neutral[300] },
              ]} />
              <Text style={styles.fieldValue}>{STATUS_LABELS[member?.status ?? ''] ?? member?.status ?? '—'}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Membro desde</Text>
          {loading
            ? <SkeletonBox width={140} height={14} />
            : <Text style={styles.fieldValue}>{formatDate(member?.created_at)}</Text>
          }
        </View>

        {member?.date_of_birth && (
          <>
            <View style={styles.divider} />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Data de nascimento</Text>
              <Text style={styles.fieldValue}>{formatDate(member.date_of_birth)}</Text>
            </View>
          </>
        )}
      </View>

      {/* Administração de ministérios */}
      {adminModules.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Administração de ministérios</Text>
          {adminModules.map(mod => (
            <View key={mod.id} style={styles.ministryRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.brand.primary} />
              <Text style={styles.ministryName}>{mod.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Ações de conta */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Conta</Text>

        <TouchableOpacity style={styles.actionRow}>
          <Ionicons name="document-text-outline" size={20} color={colors.neutral[700]} />
          <Text style={styles.actionLabel}>Política de privacidade</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.neutral[300]} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.actionRow}>
          <Ionicons name="download-outline" size={20} color={colors.neutral[700]} />
          <Text style={styles.actionLabel}>Exportar meus dados</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.neutral[300]} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.actionRow}>
          <Ionicons name="trash-outline" size={20} color={colors.semantic.danger} />
          <Text style={[styles.actionLabel, { color: colors.semantic.danger }]}>
            Solicitar exclusão de conta
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.neutral[300]} />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleSignOut}
        disabled={signingOut}
        activeOpacity={0.8}
      >
        {signingOut
          ? <ActivityIndicator color={colors.semantic.danger} />
          : <>
              <Ionicons name="log-out-outline" size={20} color={colors.semantic.danger} />
              <Text style={styles.logoutText}>Sair da conta</Text>
            </>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  content: { padding: spacing.lg, gap: spacing.md },

  avatarSection: { alignItems: 'center', paddingVertical: spacing.xl },
  avatarWrap: { position: 'relative' },
  avatarImage: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: colors.brand.primarySoft,
  },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.brand.primary + '30',
  },
  avatarInitial: { fontSize: 36, fontWeight: '700', color: colors.brand.primary },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.brand.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.neutral[50],
  },
  avatarName: { marginTop: spacing.md, fontSize: fontSize.lg, fontWeight: '700', color: colors.neutral[950] },
  avatarEmail: { marginTop: 4, fontSize: fontSize.sm, color: colors.neutral[500] },

  card: {
    backgroundColor: colors.neutral.white, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.neutral[100],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  cardTitle: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.neutral[500],
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.md,
  },

  field: { paddingVertical: spacing.sm },
  fieldLabel: { fontSize: fontSize.xs, color: colors.neutral[500], marginBottom: 4 },
  fieldValue: { fontSize: fontSize.md, color: colors.neutral[950] },
  fieldValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldEditRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fieldInput: {
    flex: 1, height: 40,
    borderWidth: 1, borderColor: colors.brand.primary,
    borderRadius: radius.sm, paddingHorizontal: spacing.sm,
    fontSize: fontSize.md, color: colors.neutral[950],
  },
  saveBtn: { padding: spacing.xs },
  cancelBtn: { padding: spacing.xs },

  divider: { height: 1, backgroundColor: colors.neutral[100], marginVertical: spacing.xs },

  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },

  ministryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  ministryName: { fontSize: fontSize.md, color: colors.neutral[950] },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  actionLabel: { flex: 1, fontSize: fontSize.md, color: colors.neutral[950] },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.neutral.white,
    borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.semantic.dangerSoft,
  },
  logoutText: { fontSize: fontSize.md, fontWeight: '600', color: colors.semantic.danger },
})
