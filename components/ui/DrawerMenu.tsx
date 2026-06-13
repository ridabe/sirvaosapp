import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, LayoutAnimation,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter, usePathname } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMember } from '@/hooks/useMember'
import { useModules } from '@/hooks/useModules'
import { useSignOut } from '@/hooks/useAuth'
import { useNotifications } from '@/context/NotificationsContext'
import { getModuleRoute } from '@/constants/modules'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'
import { SirvaOSMark } from '@/components/ui/SirvaOSMark'

type NavItemData = {
  label: string
  route: string
  icon: keyof typeof Ionicons.glyphMap
  accentColor?: string
}

const STATIC_SECTIONS = {
  principal: [
    { label: 'Início', route: '/(app)/', icon: 'home-outline' as keyof typeof Ionicons.glyphMap },
    { label: 'Notificações', route: '/(app)/notificacoes', icon: 'notifications-outline' as keyof typeof Ionicons.glyphMap },
    { label: 'Pedido de Oração', route: '/(app)/modulos/intercessao/pedido/novo', icon: 'hand-right-outline' as keyof typeof Ionicons.glyphMap, accentColor: '#8B5CF6' },
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
  const { modules } = useModules(profile?.tenant_id ?? null)
  const { execute: signOut, loading: signingOut } = useSignOut()
  const { unreadCount } = useNotifications()

  const adminModules: NavItemData[] = modules
    .filter(m => m.category === 'ministry' && m.isAdmin)
    .flatMap(m => {
      const cfg = getModuleRoute(m.slug)
      if (!cfg) return []
      return [{ label: m.name, route: `/(app)/modulos/${cfg.routeSlug}`, icon: cfg.icon, accentColor: cfg.accentColor }]
    })

  const featureItems: NavItemData[] = modules
    .filter(m => m.category === 'feature')
    .flatMap(m => {
      const cfg = getModuleRoute(m.slug)
      if (!cfg) return []
      return [{ label: m.name, route: `/(app)/modulos/${cfg.routeSlug}`, icon: cfg.icon, accentColor: cfg.accentColor }]
    })

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

  const initials = firstName?.[0]?.toUpperCase() ?? '?'

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Header rico ── */}
      <View style={styles.header}>
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />

        {/* Linha superior: logo + fechar */}
        <View style={styles.headerTop}>
          <View style={styles.logoRow}>
            <SirvaOSMark size={28} variant="mono" />
            <Text style={styles.logoText}>
              Sirva<Text style={styles.logoAccent}>OS</Text>
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityLabel="Fechar menu"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {/* Perfil do usuário */}
        <View style={styles.profileRow}>
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {profile?.full_name ?? 'Carregando...'}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {profile?.email ?? ''}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Navegação ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Principal */}
        <NavSection
          title="Principal"
          items={STATIC_SECTIONS.principal}
          isActive={isActive}
          onNavigate={navigate}
          badgeCounts={{ '/(app)/notificacoes': unreadCount }}
        />

        {/* Funcionalidades */}
        {featureItems.length > 0 && (
          <NavSection
            title="Funcionalidades"
            items={featureItems}
            isActive={isActive}
            onNavigate={navigate}
          />
        )}

        {/* Ministérios (colapsável) */}
        {adminModules.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('Ministérios')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>Ministérios</Text>
              <Ionicons
                name={openSections['Ministérios'] ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.neutral[400]}
              />
            </TouchableOpacity>
            {openSections['Ministérios'] && (
              <View style={styles.items}>
                {adminModules.map(item => {
                  const active = isActive(item.route)
                  const accent = item.accentColor ?? colors.brand.primary
                  return (
                    <NavItemRow
                      key={item.route}
                      item={item}
                      active={active}
                      accent={accent}
                      onPress={() => navigate(item.route)}
                    />
                  )
                })}
              </View>
            )}
          </View>
        )}

        {/* Minha conta */}
        <NavSection
          title="Minha conta"
          items={STATIC_SECTIONS.conta}
          isActive={isActive}
          onNavigate={navigate}
        />
      </ScrollView>

      {/* ── Rodapé — Sair ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.footerDivider} />
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          disabled={signingOut}
          activeOpacity={0.7}
          accessibilityLabel="Sair da conta"
          accessibilityRole="button"
        >
          <View style={styles.signOutIconWrap}>
            <Ionicons name="log-out-outline" size={20} color={colors.semantic.danger} />
          </View>
          <Text style={styles.signOutText}>
            {signingOut ? 'Saindo...' : 'Sair da conta'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function NavItemRow({
  item,
  active,
  accent,
  onPress,
}: {
  item: { label: string; icon: keyof typeof Ionicons.glyphMap }
  active: boolean
  accent: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.item, active && { backgroundColor: accent + '15' }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="menuitem"
      accessibilityState={{ selected: active }}
    >
      <View style={[styles.itemIconWrap, active && { backgroundColor: accent + '20' }]}>
        <Ionicons
          name={item.icon}
          size={20}
          color={active ? accent : colors.neutral[500]}
        />
      </View>
      <Text style={[styles.itemLabel, active && { color: accent, fontWeight: '600' as const }]}>
        {item.label}
      </Text>
      {active && (
        <View style={[styles.activeIndicator, { backgroundColor: accent }]} />
      )}
    </TouchableOpacity>
  )
}

function NavSection({
  title,
  items,
  isActive,
  onNavigate,
  badgeCounts = {},
}: {
  title: string
  items: NavItemData[]
  isActive: (route: string) => boolean
  onNavigate: (route: string) => void
  badgeCounts?: Record<string, number>
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.items}>
        {items.map(item => {
          const active = isActive(item.route)
          const accent = item.accentColor ?? colors.brand.primary
          const badge = badgeCounts[item.route] ?? 0
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.item, active && { backgroundColor: accent + '15' }]}
              onPress={() => onNavigate(item.route)}
              activeOpacity={0.7}
              accessibilityRole="menuitem"
              accessibilityState={{ selected: active }}
            >
              <View style={[styles.itemIconWrap, active && { backgroundColor: accent + '20' }]}>
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={active ? accent : colors.neutral[500]}
                />
              </View>
              <Text style={[styles.itemLabel, active && { color: accent, fontWeight: '600' as const }]}>
                {item.label}
              </Text>
              {badge > 0 && (
                <View style={styles.navBadge}>
                  <Text style={styles.navBadgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
              )}
              {active && (
                <View style={[styles.activeIndicator, { backgroundColor: accent }]} />
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    width: '100%',
  },

  // Header
  header: {
    backgroundColor: colors.brand.primaryDark,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    overflow: 'hidden',
    gap: spacing.lg,
  },
  headerCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#00A7C4',
    opacity: 0.08,
    right: -60,
    top: -60,
  },
  headerCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.brand.primary,
    opacity: 0.15,
    left: -30,
    bottom: -40,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  logoAccent: {
    color: '#00A7C4',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: '#fff',
  },
  profileEmail: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },

  // Scroll
  scrollContent: {
    paddingVertical: spacing.sm,
    paddingBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  items: {
    paddingHorizontal: spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    minHeight: 48,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.neutral[700],
    fontWeight: '500',
  },
  activeIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  navBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  navBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.neutral.white,
  },
  footerDivider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginBottom: spacing.sm,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
  },
  signOutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.semantic.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: fontSize.base,
    color: colors.semantic.danger,
    fontWeight: '600',
  },
})
