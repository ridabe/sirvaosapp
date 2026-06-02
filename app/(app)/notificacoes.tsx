import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNotifications, AppNotification } from '@/context/NotificationsContext'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'

export default function NotificacoesScreen() {
  const insets = useSafeAreaInsets()
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch } = useNotifications()

  function timeAgo(iso: string) {
    try {
      return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: ptBR })
    } catch {
      return ''
    }
  }

  function renderItem({ item }: { item: AppNotification }) {
    return (
      <TouchableOpacity
        style={[styles.item, !item.read && styles.itemUnread]}
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.75}
      >
        <View style={[styles.dot, item.read && styles.dotRead]} />
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.itemTime}>{timeAgo(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Barra de ações */}
      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead} activeOpacity={0.7}>
          <Ionicons name="checkmark-done-outline" size={18} color={colors.brand.primary} />
          <Text style={styles.markAllText}>Marcar todas como lidas</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.neutral[300]} />
          <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
          <Text style={styles.emptyBody}>Você será notificado sobre escalas,{'\n'}eventos e comunicados.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          onRefresh={refetch}
          refreshing={loading}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.brand.primarySoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  markAllText: {
    fontSize: fontSize.sm,
    color: colors.brand.primary,
    fontWeight: '500',
  },
  list: {
    paddingVertical: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral.white,
  },
  itemUnread: {
    backgroundColor: '#F0FAFA',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.primary,
    marginTop: 6,
    flexShrink: 0,
  },
  dotRead: {
    backgroundColor: colors.neutral[200],
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.neutral[950],
  },
  itemBody: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  itemTime: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginLeft: spacing.lg + 8 + spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[700],
    marginTop: spacing.sm,
  },
  emptyBody: {
    fontSize: fontSize.sm,
    color: colors.neutral[400],
    textAlign: 'center',
    lineHeight: 22,
  },
})
