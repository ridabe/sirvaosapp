import { useEffect, useRef } from 'react'
import { Animated, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { colors } from '@/constants/colors'
import { fontSize, spacing } from '@/lib/theme'

const BANNER_HEIGHT = 36

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus()
  const heightAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: isOnline ? 0 : BANNER_HEIGHT,
      duration: 280,
      useNativeDriver: false,
    }).start()
  }, [isOnline])

  return (
    <Animated.View
      style={[styles.banner, { height: heightAnim, overflow: 'hidden' }]}
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
