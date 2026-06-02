import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, LayoutAnimation, Platform, UIManager,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter, usePathname } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMember } from '@/hooks/useMember'
import { useModules } from '@/hooks/useModules'
import { useSignOut } from '@/hooks/useAuth'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

const MODULE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  louvor: 'musical-notes-outline',
  financeiro: 'wallet-outline',
  kids: 'happy-outline',
  'escola-biblica': 'book-outline',
  'acao-social': 'heart-outline',
}

type NavItem = {
  label: string
  route: string
  icon: keyof typeof Ionicons.glyphMap
}

const STATIC_SECTIONS = {
  principal: [
    { label: 'Início', route: '/(app)/', icon: 'home-outline' as keyof typeof Ionicons.glyphMap },
    { label: 'Notificações', route: '/(app)/notificacoes', icon: 'notifications-outline' as keyof typeof Ionicons.glyphMap },
  ],
  conta: [
    { label: 'Meu Perfil', route: '/(app)/perfil', icon: 'person-outline' as keyof typeof Ionicons.glyphMap },
  ],
}

type Props = {
  onClose: () => void
}

export function DrawerMenu({ onClose }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const { profile, firstName } = useMember()
  const { modules } = useModules(profile?.tenant_id)
  const { execute: signOut, loading: signingOut } = useSignOut()

  const adminModules: NavItem[] = modules
    .filter(m => m.isAdmin)
    .map(m => ({
      label: m.name,
      route: `/(app)/modulos/${m.slug}`,
      icon: MODULE_ICONS[m.slug] ?? 'apps-outline',
    }))

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Ministérios: true,
  })

  function toggleSection(title: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }))
  }

  function navigate(route: string) {
    onClose()
    router.push(route as any)
  }

  async function handleSignOut() {
    onClose()
    await signOut()
  }

  function isActive(route: string) {
    if (route === '/(app)/') return pathname === '/'
    return pathname.includes(route.replace('/(app)', ''))
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header do usuário */}
      <View style={styles.userHeader}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} contentFit="cover" />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {firstName?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {profile?.full_name ?? 'Carregando...'}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {profile?.email ?? ''}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={colors.neutral[500]} />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* Seções de navegação */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Principal */}
        <NavSection title="Principal" icon="home-outline" items={STATIC_SECTIONS.principal} isActive={isActive} onNavigate={navigate} />

        {/* Ministérios — somente para admins de módulo */}
        {adminModules.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('Ministérios')}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="grid-outline" size={18} color={colors.neutral[500]} />
                <Text style={styles.sectionTitle}>Ministérios</Text>
              </View>
              <Ionicons
                name={openSections['Ministérios'] ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.neutral[500]}
              />
            </TouchableOpacity>
            {openSections['Ministérios'] && (
              <View style={styles.items}>
                {adminModules.map(item => {
                  const active = isActive(item.route)
                  return (
                    <TouchableOpacity
                      key={item.route}
                      style={[styles.item, active && styles.itemActive]}
                      onPress={() => navigate(item.route)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={item.icon} size={20} color={active ? colors.brand.primary : colors.neutral[500]} />
                      <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>{item.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
          </View>
        )}

        {/* Minha conta */}
        <NavSection title="Minha conta" icon="person-outline" items={STATIC_SECTIONS.conta} isActive={isActive} onNavigate={navigate} />
      </ScrollView>

      {/* Rodapé — Sair */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          disabled={signingOut}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.semantic.danger} />
          <Text style={styles.signOutText}>
            {signingOut ? 'Saindo...' : 'Sair da conta'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    width: '100%',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.neutral[950],
  },
  userEmail: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingVertical: spacing.sm,
  },
  section: {
    marginBottom: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  items: {
    paddingHorizontal: spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  itemActive: {
    backgroundColor: colors.brand.primarySoft,
  },
  itemLabel: {
    fontSize: fontSize.md,
    color: colors.neutral[700],
    fontWeight: '400',
  },
  itemLabelActive: {
    color: colors.brand.primary,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: spacing.lg,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  signOutText: {
    fontSize: fontSize.md,
    color: colors.semantic.danger,
    fontWeight: '500',
  },
})

function NavSection({
  title, icon, items, isActive, onNavigate,
}: {
  title: string
  icon: keyof typeof Ionicons.glyphMap
  items: NavItem[]
  isActive: (route: string) => boolean
  onNavigate: (route: string) => void
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Ionicons name={icon} size={18} color={colors.neutral[500]} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      </View>
      <View style={styles.items}>
        {items.map(item => {
          const active = isActive(item.route)
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.item, active && styles.itemActive]}
              onPress={() => onNavigate(item.route)}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon} size={20} color={active ? colors.brand.primary : colors.neutral[500]} />
              <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
