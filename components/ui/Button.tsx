import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native'
import { common } from '@/lib/theme'
import { colors } from '@/constants/colors'

type Props = {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
  style?: ViewStyle
}

export function Button({ label, onPress, loading = false, disabled = false, variant = 'primary', style }: Props) {
  const isDisabled = disabled || loading

  const btnStyle = variant === 'primary' ? common.btnPrimary
    : variant === 'secondary' ? common.btnSecondary
    : styles.ghost

  const textStyle = variant === 'primary' ? common.btnPrimaryText
    : variant === 'secondary' ? common.btnSecondaryText
    : styles.ghostText

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[btnStyle, isDisabled && common.btnDisabled, style]}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.brand.primary} />
        : <Text style={textStyle}>{label}</Text>
      }
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  ghost: { height: 44, alignItems: 'center', justifyContent: 'center' },
  ghostText: { color: colors.brand.primary, fontSize: 14, fontWeight: '500' },
})
