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
import { useSignIn } from '@/hooks/useAuth'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius, common } from '@/lib/theme'

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
    // Oferece salvar credenciais para biometria se ainda não salvo
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

  // Escuta o sucesso do login via mudança de sessão (AuthContext redireciona automaticamente)
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <Ionicons name="leaf" size={36} color="#fff" />
          </View>
          <Text style={styles.logoText}>SirvaOS</Text>
          <Text style={styles.tagline}>Organize para servir melhor.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Entrar</Text>

          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.semantic.danger} />
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
          />

          <Input
            label="Senha"
            value={password}
            onChangeText={t => { setPassword(t); clearError() }}
            error={passwordError}
            password
            placeholder="Sua senha"
          />

          <TouchableOpacity
            onPress={() => router.push('/(auth)/recuperar-senha')}
            style={styles.forgotWrapper}
          >
            <Text style={common.link}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <Button label="Entrar" onPress={handleLogin} loading={loading} style={styles.btnLogin} />

          {biometricAvailable && (
            <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometric}>
              <Ionicons name="finger-print" size={28} color={colors.brand.primary} />
              <Text style={styles.biometricText}>Entrar com biometria</Text>
            </TouchableOpacity>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            label="Primeiro acesso"
            variant="secondary"
            onPress={() => router.push('/(auth)/primeiro-acesso')}
          />
        </View>

        <Text style={styles.footer}>
          Ao entrar, você concorda com a{' '}
          <Text style={common.link}>Política de Privacidade</Text>.
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
  header: {
    backgroundColor: colors.brand.primary,
    paddingTop: 72,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tagline: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  form: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + 80,
  },
  formTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.neutral[950],
    marginBottom: spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.semantic.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.semantic.danger,
  },
  forgotWrapper: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  btnLogin: {
    marginBottom: spacing.md,
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  biometricText: {
    color: colors.brand.primary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  dividerText: {
    fontSize: fontSize.xs,
    color: colors.neutral[500],
  },
  footer: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.neutral[500],
    padding: spacing.lg,
    backgroundColor: colors.neutral.white,
  },
})
