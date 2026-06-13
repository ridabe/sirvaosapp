import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { colors } from '@/constants/colors'
import { spacing, fontSize, elevation } from '@/lib/theme'
import { useNotifications } from '@/context/NotificationsContext'
import { SirvaOSMark } from '@/components/ui/SirvaOSMark'

type Props = {
  title: string
  onMenuPress: () => void
  showBack?: boolean
}

export function AppHeader({ title, onMenuPress, showBack = false }: Props) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { unreadCount } = useNotifications()
  const isHome = title === 'Início'

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 4 },
        isHome ? styles.containerHome : styles.containerPage,
      ]}
    >
      {/* Botão esquerdo: menu ou voltar */}
      {showBack ? (
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          activeOpacity={0.7}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isHome ? '#fff' : colors.neutral[950]}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={onMenuPress}
          style={styles.iconBtn}
          activeOpacity={0.7}
          accessibilityLabel="Abrir menu"
          accessibilityRole="button"
        >
          <Ionicons
            name="menu"
            size={26}
            color={isHome ? '#fff' : colors.neutral[950]}
          />
        </TouchableOpacity>
      )}

      {/* Título / Logo */}
      <View style={styles.titleArea}>
        {isHome ? (
          <View style={styles.logoRow}>
            <SirvaOSMark size={30} variant="mono" />
            <Text style={styles.logoText}>
              Sirva<Text style={styles.logoAccent}>OS</Text>
            </Text>
          </View>
        ) : (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>

      {/* Botão de notificações */}
      <TouchableOpacity
        onPress={() => router.push('/(app)/notificacoes')}
        style={styles.iconBtn}
        activeOpacity={0.7}
        accessibilityLabel={
          unreadCount > 0
            ? `Notificações, ${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
            : 'Notificações'
        }
        accessibilityRole="button"
      >
        <Ionicons
          name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
          size={24}
          color={isHome ? '#fff' : colors.neutral[950]}
        />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
    ...elevation.md,
  },
  containerHome: {
    backgroundColor: colors.brand.primary,
  },
  containerPage: {
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  titleArea: {
    flex: 1,
    alignItems: 'center',
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
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[950],
    letterSpacing: 0.1,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.brand.primary,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
})
