import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Keyboard,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useFirstAccess, useSignIn } from '@/hooks/useAuth'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius, common } from '@/lib/theme'

type Step = 'email' | 'birthdate' | 'password'

export default function PrimeiroAcessoScreen() {
  const router = useRouter()
  const { start, complete, loading, error, clearError } = useFirstAccess()
  const { execute: signIn, loading: signingIn } = useSignIn()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [requiresBirthDate, setRequiresBirthDate] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldError, setFieldError] = useState('')

  async function handleEmailStep() {
    setFieldError('')
    if (!email.trim()) { setFieldError('Informe seu e-mail.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError('E-mail inválido.'); return }

    const result = await start(email)
    if (!result) return

    if (result.alreadyActive) {
      setFieldError('Este acesso já foi ativado. Use a opção Entrar ou recupere sua senha.')
      return
    }

    setRequiresBirthDate(!!result.requiresBirthDate)
    if (result.activationToken) setToken(result.activationToken)

    setStep(result.requiresBirthDate ? 'birthdate' : 'password')
  }

  async function handleBirthDateStep() {
    setFieldError('')
    const clean = birthDate.replace(/\D/g, '')
    if (clean.length !== 8) { setFieldError('Informe a data no formato DD/MM/AAAA.'); return }

    // Passa a data em ISO para o start validar e retornar o activationToken
    const birthDateISO = birthDate.split('/').reverse().join('-')
    const result = await start(email, birthDateISO)
    if (!result) return
    if (result.activationToken) setToken(result.activationToken)
    setStep('password')
  }

  function formatBirthDate(text: string) {
    const clean = text.replace(/\D/g, '').slice(0, 8)
    if (clean.length <= 2) return clean
    if (clean.length <= 4) return `${clean.slice(0, 2)}/${clean.slice(2)}`
    return `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4)}`
  }

  async function handlePasswordStep() {
    setFieldError('')
    if (password.length < 8) { setFieldError('A senha deve ter pelo menos 8 caracteres.'); return }
    if (!/[A-Z]/.test(password)) { setFieldError('A senha precisa ter pelo menos uma letra maiúscula.'); return }
    if (!/[0-9]/.test(password)) { setFieldError('A senha precisa ter pelo menos um número.'); return }
    if (password !== confirmPassword) { setFieldError('As senhas não coincidem.'); return }

    const result = await complete(email, token, password)
    if (!result) return

    // Login automático após ativação
    await signIn(email, password)
  }

  const stepLabels: Record<Step, string> = {
    email: 'Verificar e-mail',
    birthdate: 'Confirmar identidade',
    password: 'Criar senha',
  }

  const stepIndex = { email: 0, birthdate: 1, password: requiresBirthDate ? 2 : 1 }
  const totalSteps = requiresBirthDate ? 3 : 2

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Primeiro acesso</Text>

          {/* Steps indicator */}
          <View style={styles.stepsRow}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={[styles.stepDot, i <= stepIndex[step] && styles.stepDotActive]}
              />
            ))}
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.stepLabel}>{stepLabels[step]}</Text>

          {/* Error banner */}
          {(error || fieldError) && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.semantic.danger} />
              <Text style={styles.errorBannerText}>{fieldError || error}</Text>
            </View>
          )}

          {/* Step: email */}
          {step === 'email' && (
            <>
              <Text style={common.bodyText}>
                Informe o e-mail cadastrado pela secretaria da sua igreja.
              </Text>
              <View style={{ height: spacing.lg }} />
              <Input
                label="E-mail"
                value={email}
                onChangeText={t => { setEmail(t); clearError(); setFieldError('') }}
                keyboardType="email-address"
                autoComplete="email"
                placeholder="seu@email.com"
                autoFocus
              />
              <Button label="Continuar" onPress={handleEmailStep} loading={loading} />
            </>
          )}

          {/* Step: data de nascimento */}
          {step === 'birthdate' && (
            <>
              <Text style={common.bodyText}>
                Para confirmar sua identidade, informe sua data de nascimento cadastrada.
              </Text>
              <View style={{ height: spacing.lg }} />
              <Input
                label="Data de nascimento"
                value={birthDate}
                onChangeText={t => { setBirthDate(formatBirthDate(t)); setFieldError('') }}
                keyboardType="numeric"
                placeholder="DD/MM/AAAA"
                autoFocus
              />
              <Button label="Confirmar" onPress={handleBirthDateStep} loading={loading} />
            </>
          )}

          {/* Step: senha */}
          {step === 'password' && (
            <>
              <Text style={common.bodyText}>
                Crie uma senha segura para acessar o SirvaOS.
              </Text>
              <View style={styles.passwordRules}>
                <Text style={common.smallText}>• Mínimo de 8 caracteres</Text>
                <Text style={common.smallText}>• Pelo menos uma letra maiúscula (A-Z)</Text>
                <Text style={common.smallText}>• Pelo menos um número (0-9)</Text>
              </View>
              <Input
                label="Nova senha"
                value={password}
                onChangeText={t => { setPassword(t); setFieldError('') }}
                password
                placeholder="Mínimo 8 caracteres"
                autoFocus
              />
              <Input
                label="Confirmar senha"
                value={confirmPassword}
                onChangeText={t => { setConfirmPassword(t); setFieldError('') }}
                password
                placeholder="Repita a senha"
              />
              <Button
                label="Ativar minha conta"
                onPress={handlePasswordStep}
                loading={loading || signingIn}
              />
            </>
          )}

          <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
            <Text style={common.smallText}>
              Já tem acesso?{' '}
              <Text style={common.link}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: colors.neutral[50] },
  header: {
    backgroundColor: colors.brand.primary,
    paddingTop: 56,
    paddingBottom: 32,
    paddingHorizontal: spacing.xl,
  },
  backBtn: { marginBottom: spacing.md },
  headerTitle: {
    color: '#fff',
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  stepsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.md,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  stepDotActive: {
    backgroundColor: '#fff',
    width: 20,
  },
  form: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: spacing.xl,
    paddingBottom: spacing.xl + 120,
  },
  stepLabel: {
    fontSize: fontSize.lg,
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
  passwordRules: {
    backgroundColor: colors.neutral[100],
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
})
