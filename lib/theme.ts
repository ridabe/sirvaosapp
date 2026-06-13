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
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 28,
  full: 999,
}

/** Material Design 3 — Type Scale */
export const fontSize = {
  xs: 11,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 36,
}

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
}

/** Material Design 3 — Elevation (shadow + tonal overlay) */
export const elevation = {
  /** Nível 0 — sem sombra (backgrounds) */
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  /** Nível 1 — cards, inputs */
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  /** Nível 2 — cards destacados, bottom nav */
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  /** Nível 3 — modais, dialogs */
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
  },
  /** Nível 4 — menus flutuantes */
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  /** Nível 5 — FABs, top-level overlays */
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 16,
  },
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
  /** M3 Filled Card — Nível 1 */
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...elevation.sm,
  },
  /** M3 Outlined Card */
  cardOutlined: {
    backgroundColor: colors.neutral.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  /** M3 Outlined TextField */
  input: {
    height: 56,
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    color: colors.neutral[950],
    backgroundColor: colors.neutral.white,
  },
  inputFocused: {
    borderColor: colors.brand.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.semantic.danger,
    borderWidth: 2,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.semantic.danger,
    marginTop: spacing.xs,
  },
  /** M3 Filled Button */
  btnPrimary: {
    height: 52,
    backgroundColor: colors.brand.primary,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    ...elevation.sm,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.1,
  },
  /** M3 Tonal Button */
  btnTonal: {
    height: 52,
    backgroundColor: colors.brand.primarySoft,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  btnTonalText: {
    color: colors.brand.primaryDark,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.1,
  },
  /** M3 Outlined Button */
  btnSecondary: {
    height: 52,
    backgroundColor: 'transparent',
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.brand.primary,
    paddingHorizontal: spacing.xl,
  },
  btnSecondaryText: {
    color: colors.brand.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.1,
  },
  btnDisabled: {
    opacity: 0.38,
  },
  link: {
    color: colors.brand.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.neutral[950],
    marginBottom: spacing.sm,
  },
  bodyText: {
    fontSize: fontSize.base,
    color: colors.neutral[700],
    lineHeight: 24,
  },
  smallText: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
  },
})
