import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Animated, LayoutAnimation, Platform, UIManager,
} from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMember } from '@/hooks/useMember'
import { useSignOut } from '@/hooks/useAuth'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'

// Habilita LayoutAnimation no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

type NavItem = {
  label: string
  route: string
  icon: keyof typeof Ionicons.glyphMap
}

type Section = {
  title: string
  icon: keyof typeof Ionicons.glyphMap
  items: NavItem[]
  accordion?: boolean
}

const SECTIONS: Section[] = [
  {
    title: 'Principal',
    icon: 'home-outline',
    accordion: false,
    items: [
      { label: 'Início', route: '/(app)/', icon: 'home-outline' },
      { label: 'Notificações', route: '/(app)/notificacoes', icon: 'notifications-outline' },
    ],
  },
  {
    title: 'Ministérios',
    icon: 'grid-outline',
    accordion: true,
    items: [
      { label: 'Louvor', route: '/(app)/modulos/louvor', icon: 'musical-notes-outline' },
      { label: 'Financeiro', route: '/(app)/modulos/financeiro', icon: 'wallet-outline' },
      { label: 'Kids', route: '/(app)/modulos/kids', icon: 'happy-outline' },
      { label: 'Escola Bíblica', route: '/(app)/modulos/escola-biblica', icon: 'book-outline' },
      { label: 'Ação Social', route: '/(app)/modulos/acao-social', icon: 'heart-outline' },
    ],
  },
  {
    title: 'Minha conta',
    icon: 'person-outline',
    accordion: false,
    items: [
      { label: 'Meu Perfil', route: '/(app)/perfil', icon: 'person-outline' },
    ],
  },
]

type Props = {
  onClose: () => void
}

export function DrawerMenu({ onClose }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const { profile, firstName } = useMember()
  const { execute: signOut, loading: signingOut } = useSignOut()

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
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {firstName?.[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
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
        {SECTIONS.map(section => (
          <View key={section.title} style={styles.section}>
            {/* Título da seção — clicável se for accordion */}
            {section.accordion ? (
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection(section.title)}
                activeOpacity={0.7}
              >
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name={section.icon} size={18} color={colors.neutral[500]} />
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                <Ionicons
                  name={openSections[section.title] ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.neutral[500]}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name={section.icon} size={18} color={colors.neutral[500]} />
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
              </View>
            )}

            {/* Itens — ocultos se accordion fechado */}
            {(!section.accordion || openSections[section.title]) && (
              <View style={styles.items}>
                {section.items.map(item => {
                  const active = isActive(item.route)
                  return (
                    <TouchableOpacity
                      key={item.route}
                      style={[styles.item, active && styles.itemActive]}
                      onPress={() => navigate(item.route)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={active ? colors.brand.primary : colors.neutral[600]}
                      />
                      <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
          </View>
        ))}
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
