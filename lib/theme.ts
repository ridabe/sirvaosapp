import { StyleSheet } from 'react-native'
import { colors } from '@/constants/colors'

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 999,
}

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
}

export const common = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.neutral[950],
    backgroundColor: colors.neutral.white,
  },
  inputFocused: {
    borderColor: colors.brand.primary,
  },
  inputError: {
    borderColor: colors.semantic.danger,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.neutral[700],
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.semantic.danger,
    marginTop: spacing.xs,
  },
  btnPrimary: {
    height: 52,
    backgroundColor: colors.brand.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  btnSecondary: {
    height: 52,
    backgroundColor: 'transparent',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  btnSecondaryText: {
    color: colors.brand.primary,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  link: {
    color: colors.brand.primary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.neutral[950],
    marginBottom: spacing.sm,
  },
  bodyText: {
    fontSize: fontSize.md,
    color: colors.neutral[700],
    lineHeight: 22,
  },
  smallText: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
  },
})
