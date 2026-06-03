import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useResetPassword } from '@/hooks/useAuth'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius, common } from '@/lib/theme'

export default function RecuperarSenhaScreen() {
  const router = useRouter()
  const { execute, loading, sent, error } = useResetPassword()
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState('')

  async function handleSubmit() {
    setFieldError('')
    if (!email.trim()) { setFieldError('Informe seu e-mail.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError('E-mail inválido.'); return }
    await execute(email.trim().toLowerCase())
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Voltar" accessibilityRole="button">
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recuperar senha</Text>
        </View>

        <View style={styles.form}>
          {sent ? (
            /* Sucesso */
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="mail-outline" size={40} color={colors.brand.primary} />
              </View>
              <Text style={styles.successTitle}>E-mail enviado!</Text>
              <Text style={common.bodyText}>
                Enviamos as instruções para{'\n'}<Text style={{ fontWeight: '600' }}>{email}</Text>.{'\n\n'}
                Verifique sua caixa de entrada e a pasta de spam.
              </Text>
              <Button
                label="Voltar ao login"
                onPress={() => router.replace('/(auth)/login')}
                style={{ marginTop: spacing.xl }}
              />
            </View>
          ) : (
            /* Formulário */
            <>
              <Text style={styles.formTitle}>Esqueceu a senha?</Text>
              <Text style={[common.bodyText, { marginBottom: spacing.xl }]}>
                Informe seu e-mail e enviaremos um link para você criar uma nova senha.
              </Text>

              {(error || fieldError) && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.semantic.danger} />
                  <Text style={styles.errorBannerText}>{fieldError || error}</Text>
                </View>
              )}

              <Input
                label="E-mail"
                value={email}
                onChangeText={t => { setEmail(t); setFieldError('') }}
                keyboardType="email-address"
                autoComplete="email"
                placeholder="seu@email.com"
                autoFocus
              />

              <Button label="Enviar instruções" onPress={handleSubmit} loading={loading} />

              <TouchableOpacity style={styles.backLink} onPress={() => router.back()} accessibilityLabel="Lembrou a senha? Voltar para o login" accessibilityRole="link">
                <Text style={common.smallText}>
                  Lembrou a senha?{' '}
                  <Text style={common.link}>Voltar</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
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
  form: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: spacing.xl,
  },
  formTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.neutral[950],
    marginBottom: spacing.sm,
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
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.neutral[950],
    marginBottom: spacing.md,
  },
  backLink: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
})
