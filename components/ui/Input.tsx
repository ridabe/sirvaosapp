import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { spacing, radius, fontSize } from '@/lib/theme'
import { colors } from '@/constants/colors'

type Props = TextInputProps & {
  label?: string
  error?: string
  helper?: string
  password?: boolean
  prefixIcon?: keyof typeof Ionicons.glyphMap
}

export function Input({ label, error, helper, password = false, prefixIcon, ...props }: Props) {
  const [focused, setFocused] = useState(false)
  const [show, setShow] = useState(false)

  const borderColor = error
    ? colors.semantic.danger
    : focused
    ? colors.brand.primary
    : colors.neutral[300]

  const borderWidth = focused || error ? 2 : 1.5

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text
          style={[
            styles.label,
            focused && styles.labelFocused,
            !!error && styles.labelError,
          ]}
        >
          {label}
        </Text>
      )}
      <View style={[styles.inputContainer, { borderColor, borderWidth }]}>
        {prefixIcon && (
          <Ionicons
            name={prefixIcon}
            size={20}
            color={focused ? colors.brand.primary : colors.neutral[400]}
            style={styles.prefixIcon}
          />
        )}
        <TextInput
          {...props}
          secureTextEntry={password && !show}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            prefixIcon && styles.inputWithPrefix,
            password && styles.inputWithSuffix,
            props.style,
          ]}
          placeholderTextColor={colors.neutral[400]}
          autoCapitalize={props.autoCapitalize ?? 'none'}
        />
        {password && (
          <TouchableOpacity
            style={styles.suffixBtn}
            onPress={() => setShow(s => !s)}
            accessibilityRole="button"
            accessibilityLabel={show ? 'Ocultar senha' : 'Mostrar senha'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={show ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.neutral[400]}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <View style={styles.helperRow}>
          <Ionicons name="alert-circle-outline" size={13} color={colors.semantic.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {!error && helper && (
        <Text style={styles.helperText}>{helper}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.neutral[600],
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  labelFocused: {
    color: colors.brand.primary,
  },
  labelError: {
    color: colors.semantic.danger,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.neutral.white,
    overflow: 'hidden',
  },
  prefixIcon: {
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    color: colors.neutral[950],
  },
  inputWithPrefix: {
    paddingLeft: spacing.xs,
  },
  inputWithSuffix: {
    paddingRight: 48,
  },
  suffixBtn: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.semantic.danger,
  },
  helperText: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    marginTop: 4,
  },
})
