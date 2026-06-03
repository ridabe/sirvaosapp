import { useEffect, useRef } from 'react'
import { Animated, View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { colors } from '@/constants/colors'
import { fontSize, spacing } from '@/lib/theme'

const BANNER_HEIGHT = 36

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus()
  const slideY = useRef(new Animated.Value(-BANNER_HEIGHT)).current
  const prevOnline = useRef(true)

  useEffect(() => {
    if (prevOnline.current === isOnline) return
    prevOnline.current = isOnline

    Animated.timing(slideY, {
      toValue: isOnline ? -BANNER_HEIGHT : 0,
      duration: 280,
      useNativeDriver: true,
    }).start()
  }, [isOnline])

  return (
    <Animated.View
      style={[styles.banner, { transform: [{ translateY: slideY }] }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      pointerEvents="none"
    >
      <Ionicons name="cloud-offline-outline" size={16} color={colors.neutral.white} />
      <Text style={styles.text}>Sem conexão — exibindo dados salvos</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  banner: {
    height: BANNER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.neutral[700],
    paddingHorizontal: spacing.md,
  },
  text: {
    fontSize: fontSize.xs,
    color: colors.neutral.white,
    fontWeight: '500',
  },
})
