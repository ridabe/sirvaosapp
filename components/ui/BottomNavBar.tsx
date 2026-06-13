import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, usePathname } from 'expo-router'
import { colors } from '@/constants/colors'
import { spacing, fontSize, elevation } from '@/lib/theme'
import { useNotifications } from '@/context/NotificationsContext'

type NavItem = {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  iconActive: keyof typeof Ionicons.glyphMap
  route: string
  matchPrefix?: string
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Início',
    icon: 'home-outline',
    iconActive: 'home',
    route: '/(app)/',
    matchPrefix: '/',
  },
  {
    label: 'Notificações',
    icon: 'notifications-outline',
    iconActive: 'notifications',
    route: '/(app)/notificacoes',
    matchPrefix: '/notificacoes',
  },
  {
    label: 'Módulos',
    icon: 'grid-outline',
    iconActive: 'grid',
    route: '/(app)/',
    matchPrefix: '/modulos',
  },
  {
    label: 'Perfil',
    icon: 'person-outline',
    iconActive: 'person',
    route: '/(app)/perfil',
    matchPrefix: '/perfil',
  },
]

export function BottomNavBar() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const pathname = usePathname()
  const { unreadCount } = useNotifications()

  function isActive(item: NavItem): boolean {
    if (item.matchPrefix === '/') return pathname === '/'
    return pathname.startsWith(item.matchPrefix ?? item.route.replace('/(app)', ''))
  }

  function handlePress(item: NavItem) {
    router.push(item.route as any)
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 4 }]}>
      {NAV_ITEMS.map(item => {
        const active = isActive(item)
        const isNotif = item.matchPrefix === '/notificacoes'
        return (
          <TouchableOpacity
            key={item.label}
            style={styles.item}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
          >
            {/* Indicador pill ativo */}
            <View style={[styles.pill, active && styles.pillActive]}>
              <Ionicons
                name={active ? item.iconActive : item.icon}
                size={24}
                color={active ? colors.brand.primary : colors.neutral[500]}
              />
              {/* Badge de notificações */}
              {isNotif && unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    ...elevation.md,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  pill: {
    width: 64,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: colors.brand.primarySoft,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    fontWeight: '500',
    textAlign: 'center',
  },
  labelActive: {
    color: colors.brand.primary,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.neutral.white,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
})
