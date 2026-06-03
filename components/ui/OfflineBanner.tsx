import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { colors } from '@/constants/colors'
import { fontSize, spacing } from '@/lib/theme'

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus()
  if (isOnline) return null

  return (
    <View style={styles.banner} accessibilityLiveRegion="polite" accessibilityRole="alert">
      <Ionicons name="cloud-offline-outline" size={16} color={colors.neutral.white} />
      <Text style={styles.text}>Sem conexão — exibindo dados salvos</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.neutral[700],
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  text: {
    fontSize: fontSize.xs,
    color: colors.neutral.white,
    fontWeight: '500',
  },
})
