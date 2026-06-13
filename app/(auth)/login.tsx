import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import { Ionicons } from '@expo/vector-icons'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { SirvaOSMark } from '@/components/ui/SirvaOSMark'
import { useSignIn } from '@/hooks/useAuth'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius, elevation } from '@/lib/theme'

const BIOMETRIC_EMAIL_KEY = 'biometric_email'
const BIOMETRIC_PASS_KEY = 'biometric_pass'

export default function LoginScreen() {
  const router = useRouter()
  const { execute, loading, error, clearError } = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    checkBiometric()
  }, [])

  async function checkBiometric() {
    const compatible = await LocalAuthentication.hasHardwareAsync()
    const enrolled = await LocalAuthentication.isEnrolledAsync()
    const savedEmail = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY)
    setBiometricAvailable(compatible && enrolled && !!savedEmail)
  }

  function validate() {
    let valid = true
    setEmailError('')
    setPasswordError('')
    if (!email.trim()) { setEmailError('Informe seu e-mail.'); valid = false }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('E-mail inválido.'); valid = false }
    if (!password) { setPasswordError('Informe sua senha.'); valid = false }
    return valid
  }

  async function handleLogin() {
    if (!validate()) return
    clearError()
    await execute(email.trim().toLowerCase(), password)
  }

  async function handleBiometric() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirme sua identidade',
      cancelLabel: 'Cancelar',
      fallbackLabel: 'Usar senha',
    })
    if (!result.success) return

    const savedEmail = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY)
    const savedPass = await SecureStore.getItemAsync(BIOMETRIC_PASS_KEY)
    if (!savedEmail || !savedPass) return

    await execute(savedEmail, savedPass)
  }

  async function handleLoginSuccess() {
    const savedEmail = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY)
    if (!savedEmail && biometricAvailable === false) {
      const compatible = await LocalAuthentication.hasHardwareAsync()
      const enrolled = await LocalAuthentication.isEnrolledAsync()
      if (compatible && enrolled) {
        Alert.alert(
          'Ativar login com biometria?',
          'Você pode entrar mais rápido usando digital ou reconhecimento facial.',
          [
            { text: 'Agora não', style: 'cancel' },
            {
              text: 'Ativar', onPress: async () => {
                await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email.trim().toLowerCase())
                await SecureStore.setItemAsync(BIOMETRIC_PASS_KEY, password)
              }
            },
          ]
        )
      }
    }
  }

  useEffect(() => {
    if (!loading && !error && email && password) {
      handleLoginSuccess()
    }
  }, [loading])

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* ── Header com logo oficial ── */}
        <View style={styles.header}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />

          <View style={styles.logoBlock}>
            <SirvaOSMark size={80} variant="gradient" />
            <View style={styles.logoTextRow}>
              <Text style={styles.logoText}>
                Sirva<Text style={styles.logoAccent}>OS</Text>
              </Text>
            </View>
            <Text style={styles.tagline}>organize para servir melhor</Text>
          </View>
        </View>

        {/* ── Card do formulário ── */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Entrar na sua conta</Text>
          <Text style={styles.formSubtitle}>Bem-vindo de volta! Acesse sua conta abaixo.</Text>

          {/* Banner de erro */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.semantic.danger} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          <Input
            label="E-mail"
            value={email}
            onChangeText={t => { setEmail(t); clearError() }}
            error={emailError}
            keyboardType="email-address"
            autoComplete="email"
            placeholder="seu@email.com"
            prefixIcon="mail-outline"
          />

          <Input
            label="Senha"
            value={password}
            onChangeText={t => { setPassword(t); clearError() }}
            error={passwordError}
            password
            placeholder="Sua senha"
            prefixIcon="lock-closed-outline"
          />

          <TouchableOpacity
            onPress={() => router.push('/(auth)/recuperar-senha')}
            style={styles.forgotWrapper}
            accessibilityLabel="Esqueci minha senha"
            accessibilityRole="link"
          >
            <Text style={styles.forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <Button
            label="Entrar"
            onPress={handleLogin}
            loading={loading}
            variant="filled"
            icon="arrow-forward-outline"
            iconPosition="right"
            style={styles.btnLogin}
          />

          {biometricAvailable && (
            <TouchableOpacity
              style={styles.biometricBtn}
              onPress={handleBiometric}
              accessibilityLabel="Entrar com biometria"
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <View style={styles.biometricIconWrap}>
                <Ionicons name="finger-print" size={26} color={colors.brand.primary} />
              </View>
              <Text style={styles.biometricText}>Entrar com biometria</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.neutral[300]} />
            </TouchableOpacity>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            label="Criar acesso pela primeira vez"
            variant="outlined"
            onPress={() => router.push('/(auth)/primeiro-acesso')}
            icon="person-add-outline"
          />
        </View>

        <Text style={styles.footer}>
          Ao entrar, você concorda com a{' '}
          <Text style={styles.footerLink}>Política de Privacidade</Text>.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: colors.neutral[50],
  },

  // Header
  header: {
    backgroundColor: colors.brand.primaryDark,
    paddingTop: 64,
    paddingBottom: 56,
    alignItems: 'center',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: '#087C7A', opacity: 0.3, right: -80, top: -80,
  },
  circle2: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#00A7C4', opacity: 0.1, left: -60, bottom: -60,
  },
  circle3: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#E0F6F4', opacity: 0.06, left: 40, top: 20,
  },
  logoBlock: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  logoText: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  logoAccent: {
    color: '#00A7C4',
  },
  tagline: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: fontSize.sm,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Card do formulário
  formCard: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + 80,
    ...elevation.md,
  },
  formTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.neutral[950],
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    fontSize: fontSize.md,
    color: colors.neutral[500],
    marginBottom: spacing.xl,
  },

  // Erro
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.semantic.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.semantic.danger,
  },
  errorBannerText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.semantic.danger,
    fontWeight: '500',
  },

  // Esqueci
  forgotWrapper: {
    alignSelf: 'flex-end',
    marginTop: -spacing.xs,
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
  },
  forgotText: {
    color: colors.brand.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },

  // Botão login
  btnLogin: {
    marginBottom: spacing.md,
  },

  // Biometria
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.brand.primarySoft,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  biometricIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.sm,
  },
  biometricText: {
    flex: 1,
    color: colors.brand.primaryDark,
    fontSize: fontSize.base,
    fontWeight: '600',
  },

  // Divisor
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  dividerText: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
    fontWeight: '500',
  },

  // Rodapé
  footer: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.neutral[400],
    padding: spacing.lg,
    backgroundColor: colors.neutral.white,
  },
  footerLink: {
    color: colors.brand.primary,
    fontWeight: '600',
  },
})
