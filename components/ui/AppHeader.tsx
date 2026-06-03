import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { colors } from '@/constants/colors'
import { spacing, fontSize } from '@/lib/theme'
import { useNotifications } from '@/context/NotificationsContext'

type Props = {
  title: string
  onMenuPress: () => void
}

export function AppHeader({ title, onMenuPress }: Props) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { unreadCount } = useNotifications()

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableOpacity
        onPress={onMenuPress}
        style={styles.btn}
        activeOpacity={0.7}
        accessibilityLabel="Abrir menu"
        accessibilityRole="button"
      >
        <Ionicons name="menu" size={26} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>{title}</Text>

      <TouchableOpacity
        onPress={() => router.push('/(app)/notificacoes')}
        style={styles.btn}
        activeOpacity={0.7}
        accessibilityLabel={unreadCount > 0 ? `Notificações, ${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Notificações'}
        accessibilityRole="button"
      >
        <Ionicons name="notifications-outline" size={24} color="#fff" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  btn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: '#fff',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
})
