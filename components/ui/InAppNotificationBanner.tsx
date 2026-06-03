import { useEffect, useRef } from 'react'
import {
  Animated, View, Text, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'
import type { InAppNotification } from '@/hooks/usePushNotifications'

const { width } = Dimensions.get('window')
const BANNER_DURATION = 5000 // ms antes de fechar sozinho

type Props = {
  notification: InAppNotification | null
  onDismiss: () => void
}

export function InAppNotificationBanner({ notification, onDismiss }: Props) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const slideY = useRef(new Animated.Value(-120)).current
  const opacity = useRef(new Animated.Value(0)).current
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!notification) {
      // Esconde
      Animated.parallel([
        Animated.timing(slideY, { toValue: -120, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start()
      return
    }

    // Mostra
    if (timer.current) clearTimeout(timer.current)
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, bounciness: 4, speed: 18 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start()

    // Auto-dismiss
    timer.current = setTimeout(() => { onDismiss() }, BANNER_DURATION)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [notification?.id])

  if (!notification) return null

  function handlePress() {
    onDismiss()
    if (notification?.route) {
      router.push(notification.route as any)
    } else {
      router.push('/(app)/notificacoes')
    }
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + spacing.sm, transform: [{ translateY: slideY }], opacity },
      ]}
    >
      <TouchableOpacity style={styles.banner} onPress={handlePress} activeOpacity={0.92}>
        {/* Ícone */}
        <View style={styles.iconWrap}>
          <Ionicons name="notifications" size={20} color="#fff" />
        </View>

        {/* Conteúdo */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{notification.body}</Text>
        </View>

        {/* Fechar */}
        <TouchableOpacity onPress={onDismiss} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Barra de progresso */}
      <ProgressBar duration={BANNER_DURATION} key={notification.id} />
    </Animated.View>
  )
}

function ProgressBar({ duration }: { duration: number }) {
  const progress = useRef(new Animated.Value(width - spacing.lg * 2 - 16)).current

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration,
      useNativeDriver: false,
    }).start()
  }, [])

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressBar, { width: progress }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 999,
  },
  banner: {
    backgroundColor: colors.brand.primary,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: '#fff',
  },
  body: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
    flexShrink: 0,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
    marginHorizontal: 2,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 2,
  },
})
