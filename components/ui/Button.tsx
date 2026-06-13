import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { common, elevation, radius, spacing, fontSize } from '@/lib/theme'
import { colors } from '@/constants/colors'

type Props = {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  /** filled    = M3 Filled (primário)
   *  tonal     = M3 Tonal (secundário suave)
   *  outlined  = M3 Outlined (borda)
   *  ghost     = apenas texto
   *  danger    = ação destrutiva
   *  primary   = alias legado → filled
   *  secondary = alias legado → outlined */
  variant?: 'filled' | 'tonal' | 'outlined' | 'ghost' | 'danger' | 'primary' | 'secondary'
  icon?: keyof typeof Ionicons.glyphMap
  iconPosition?: 'left' | 'right'
  style?: ViewStyle
  fullWidth?: boolean
}

export function Button({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'filled',
  icon,
  iconPosition = 'left',
  style,
  fullWidth = true,
}: Props) {
  const isDisabled = disabled || loading

  // Normaliza variantes legadas
  const v = variant === 'primary' ? 'filled'
    : variant === 'secondary' ? 'outlined'
    : variant

  const containerStyle = v === 'filled'   ? styles.filled
    : v === 'tonal'    ? styles.tonal
    : v === 'outlined' ? styles.outlined
    : v === 'danger'   ? styles.danger
    : styles.ghost

  const textStyle = v === 'filled'   ? styles.filledText
    : v === 'tonal'    ? styles.tonalText
    : v === 'outlined' ? styles.outlinedText
    : v === 'danger'   ? styles.dangerText
    : styles.ghostText

  const iconColor = v === 'filled'   ? '#fff'
    : v === 'tonal'    ? colors.brand.primaryDark
    : v === 'outlined' ? colors.brand.primary
    : v === 'danger'   ? colors.semantic.danger
    : colors.brand.primary

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        containerStyle,
        !fullWidth && styles.inline,
        isDisabled && common.btnDisabled,
        style,
      ]}
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          color={v === 'filled' ? '#fff' : colors.brand.primary}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={18} color={iconColor} style={styles.iconLeft} />
          )}
          <Text style={textStyle}>{label}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={18} color={iconColor} style={styles.iconRight} />
          )}
        </View>
      )}
    </TouchableOpacity>
  )
}

// ── FAB — Floating Action Button (M3) ───────────────────────────────────────

export function FAB({
  label,
  icon,
  onPress,
  color,
  style,
}: {
  label?: string
  icon: keyof typeof Ionicons.glyphMap
  onPress: () => void
  color?: string
  style?: ViewStyle
}) {
  const bg = color ?? colors.brand.primary
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={[
        styles.fab,
        { backgroundColor: bg },
        label ? styles.fabExtended : styles.fabCircle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label ?? 'Ação principal'}
    >
      <Ionicons name={icon} size={24} color="#fff" />
      {label && <Text style={styles.fabLabel}>{label}</Text>}
    </TouchableOpacity>
  )
}

// ── Chip de filtro / seleção (M3) ────────────────────────────────────────────

export function Chip({
  label,
  selected,
  onPress,
  icon,
  color,
}: {
  label: string
  selected?: boolean
  onPress?: () => void
  icon?: keyof typeof Ionicons.glyphMap
  color?: string
}) {
  const accent = color ?? colors.brand.primary
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.chip,
        selected && { backgroundColor: accent + '20', borderColor: accent },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? accent : colors.neutral[500]}
          style={styles.chipIcon}
        />
      )}
      <Text style={[styles.chipText, selected && { color: accent, fontWeight: '600' as const }]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  inline: {
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm },

  // ── Variantes ──
  filled: {
    backgroundColor: colors.brand.primary,
    ...elevation.sm,
  },
  filledText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  tonal: {
    backgroundColor: colors.brand.primarySoft,
  },
  tonalText: {
    color: colors.brand.primaryDark,
    fontSize: fontSize.base,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.brand.primary,
  },
  outlinedText: {
    color: colors.brand.primary,
    fontSize: fontSize.base,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  danger: {
    backgroundColor: colors.semantic.dangerSoft,
  },
  dangerText: {
    color: colors.semantic.danger,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  ghost: {
    height: 44,
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.md,
  },
  ghostText: {
    color: colors.brand.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },

  // ── FAB ──
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.fab,
  },
  fabCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  fabExtended: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  fabLabel: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  // ── Chip ──
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral.white,
    marginRight: spacing.sm,
  },
  chipIcon: {
    marginRight: 4,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.neutral[600],
    fontWeight: '500',
  },
})
