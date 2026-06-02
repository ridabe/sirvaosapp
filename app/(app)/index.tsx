import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useMember } from '@/hooks/useMember'
import { useModules, AppModule } from '@/hooks/useModules'
import { SkeletonBox } from '@/components/ui/SkeletonBox'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'
import { useState, useCallback } from 'react'

// Mapeamento de slug para ícone Ionicons
const MODULE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  louvor: 'musical-notes',
  financeiro: 'wallet',
  kids: 'happy',
  'escola-biblica': 'book',
  'acao-social': 'heart',
}

// Mapeamento de slug para cor de destaque do card
const MODULE_COLORS: Record<string, string> = {
  louvor: '#7C3AED',
  financeiro: '#059669',
  kids: '#D97706',
  'escola-biblica': '#2563EB',
  'acao-social': '#DC2626',
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function HomeScreen() {
  const router = useRouter()
  const { profile, firstName, loading: memberLoading, refetch: refetchMember } = useMember()
  const { modules, loading: modulesLoading, error: modulesError, refetch: refetchModules } = useModules(
    profile?.tenant_id ?? (memberLoading ? undefined : null)
  )
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchMember(), refetchModules()])
    setRefreshing(false)
  }, [refetchMember, refetchModules])

  function navigateToModule(slug: string) {
    router.push(`/(app)/modulos/${slug}` as any)
  }

  const adminModules = modules.filter(m => m.isAdmin)
  const loading = memberLoading || modulesLoading

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.brand.primary]}
          tintColor={colors.brand.primary}
        />
      }
    >
      {/* Saudação */}
      <View style={styles.greetingCard}>
        <View style={styles.greetingLeft}>
          {memberLoading ? (
            <>
              <SkeletonBox width={120} height={14} style={{ marginBottom: 8 }} />
              <SkeletonBox width={200} height={22} />
            </>
          ) : (
            <>
              <Text style={styles.greetingSubtitle}>{getGreeting()},</Text>
              <Text style={styles.greetingName}>{firstName ?? 'Membro'} 👋</Text>
            </>
          )}
        </View>
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => router.push('/(app)/perfil' as any)}
          activeOpacity={0.8}
        >
          {memberLoading ? (
            <SkeletonBox width={48} height={48} borderRadius={24} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {firstName?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Cards de admin (visíveis apenas para quem tem papel) */}
      {!loading && adminModules.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Administração" icon="shield-checkmark-outline" />
          <View style={styles.adminGrid}>
            {adminModules.map(mod => (
              <AdminCard key={mod.id} module={mod} onPress={() => navigateToModule(mod.slug)} />
            ))}
          </View>
        </View>
      )}

      {/* Meus ministérios */}
      <View style={styles.section}>
        <SectionHeader title="Meus ministérios" icon="grid-outline" />
        {loading ? (
          <ModulesSkeleton />
        ) : modulesError ? (
          <ErrorState message={modulesError} onRetry={refetchModules} />
        ) : modules.length === 0 ? (
          <EmptyState
            icon="grid-outline"
            message="Nenhum ministério ativo no momento."
          />
        ) : (
          <View style={styles.modulesGrid}>
            {modules.map(mod => (
              <ModuleCard key={mod.id} module={mod} onPress={() => navigateToModule(mod.slug)} />
            ))}
          </View>
        )}
      </View>

      {/* Próximos eventos */}
      <View style={styles.section}>
        <SectionHeader title="Próximos eventos" icon="calendar-outline" />
        <EmptyState
          icon="calendar-outline"
          message="Nenhum evento programado."
          muted
        />
      </View>

      {/* Comunicados recentes */}
      <View style={[styles.section, styles.lastSection]}>
        <SectionHeader title="Comunicados recentes" icon="megaphone-outline" />
        <EmptyState
          icon="megaphone-outline"
          message="Nenhum comunicado recente."
          muted
        />
      </View>
    </ScrollView>
  )
}

// ── Subcomponentes ─────────────────────────────────────────────────────────

function SectionHeader({ title, icon }: { title: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color={colors.neutral[500]} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  )
}

function ModuleCard({ module: mod, onPress }: { module: AppModule; onPress: () => void }) {
  const icon = MODULE_ICONS[mod.slug] ?? 'apps'
  const accent = MODULE_COLORS[mod.slug] ?? colors.brand.primary

  return (
    <TouchableOpacity style={styles.moduleCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.moduleIconWrap, { backgroundColor: accent + '18' }]}>
        <Ionicons name={icon} size={26} color={accent} />
      </View>
      <Text style={styles.moduleName} numberOfLines={2}>{mod.name}</Text>
      {mod.isAdmin && (
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

function AdminCard({ module: mod, onPress }: { module: AppModule; onPress: () => void }) {
  const icon = MODULE_ICONS[mod.slug] ?? 'apps'
  const accent = MODULE_COLORS[mod.slug] ?? colors.brand.primary

  return (
    <TouchableOpacity style={[styles.adminCard, { borderLeftColor: accent }]} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon} size={20} color={accent} />
      <View style={{ flex: 1 }}>
        <Text style={styles.adminCardTitle}>{mod.name}</Text>
        <Text style={styles.adminCardSub}>Painel de administração</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.neutral[300]} />
    </TouchableOpacity>
  )
}

function ModulesSkeleton() {
  return (
    <View style={styles.modulesGrid}>
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={styles.moduleCardSkeleton}>
          <SkeletonBox width={52} height={52} borderRadius={radius.lg} style={{ marginBottom: 10 }} />
          <SkeletonBox width={72} height={12} />
        </View>
      ))}
    </View>
  )
}

function EmptyState({ icon, message, muted }: {
  icon: keyof typeof Ionicons.glyphMap
  message: string
  muted?: boolean
}) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={28} color={muted ? colors.neutral[200] : colors.neutral[300]} />
      <Text style={[styles.emptyText, muted && { color: colors.neutral[300] }]}>{message}</Text>
    </View>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorState}>
      <Ionicons name="cloud-offline-outline" size={28} color={colors.semantic.danger} />
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity onPress={onRetry} style={styles.retryBtn} activeOpacity={0.7}>
        <Text style={styles.retryText}>Tentar novamente</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Estilos ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  content: {
    paddingBottom: spacing.xxl,
  },

  // Saudação
  greetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl + 8,
  },
  greetingLeft: {
    flex: 1,
  },
  greetingSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 2,
  },
  greetingName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: '#fff',
  },
  avatarBtn: {
    marginLeft: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#fff',
  },

  // Seções
  section: {
    marginTop: -16,
    backgroundColor: colors.neutral[50],
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  lastSection: {
    marginTop: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // Grid de módulos
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  moduleCard: {
    width: '47%',
    backgroundColor: colors.neutral.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  moduleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  moduleName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.neutral[950],
  },
  adminBadge: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.brand.primarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.brand.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moduleCardSkeleton: {
    width: '47%',
    backgroundColor: colors.neutral.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    alignItems: 'flex-start',
  },

  // Cards de admin
  adminGrid: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.neutral.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  adminCardTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.neutral[950],
  },
  adminCardSub: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: 1,
  },

  // Estados
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  errorState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.semantic.danger,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.brand.primarySoft,
    borderRadius: radius.md,
  },
  retryText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.brand.primary,
  },
})
