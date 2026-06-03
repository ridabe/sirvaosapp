import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Switch, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePrayerRequest } from '@/hooks/usePrayerRequest'
import { colors } from '@/constants/colors'
import { spacing, fontSize, radius } from '@/lib/theme'

const ACCENT = '#8B5CF6'
const MAX_CONTENT = 800

export default function NovoPedidoScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { submitPrayerRequest } = usePrayerRequest()

  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = content.trim().length > 0

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await submitPrayerRequest({
        content: content.trim(),
        is_anonymous: isAnonymous,
      })
      Alert.alert(
        'Pedido enviado!',
        'Seu pedido de oração foi recebido pelo ministério de intercessão.',
        [{ text: 'OK', onPress: () => router.back() }],
      )
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível enviar o pedido. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={colors.neutral[700]} />
          </TouchableOpacity>
          <View style={styles.headerIcon}>
            <Ionicons name="hand-right-outline" size={24} color={ACCENT} />
          </View>
          <Text style={styles.title}>Pedido de Oração</Text>
          <Text style={styles.subtitle}>
            Compartilhe seu pedido com o Ministério de Intercessão da Primeira Igreja.
          </Text>
        </View>

        {/* Conteúdo do pedido */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Seu pedido <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descreva seu pedido de oração. Pode ser uma situação pessoal, familiar, de saúde, financeira ou espiritual..."
            placeholderTextColor={colors.neutral[400]}
            value={content}
            onChangeText={setContent}
            maxLength={MAX_CONTENT}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            autoFocus
          />
          <Text style={styles.charCount}>{content.length}/{MAX_CONTENT}</Text>
        </View>

        {/* Anônimo */}
        <View style={styles.anonRow}>
          <View style={styles.anonInfo}>
            <Text style={styles.anonLabel}>Enviar anonimamente</Text>
            <Text style={styles.anonDesc}>
              Seu nome não será exibido junto ao pedido.
            </Text>
          </View>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            trackColor={{ false: colors.neutral[200], true: ACCENT }}
            thumbColor="#fff"
          />
        </View>

        {isAnonymous && (
          <View style={styles.anonNote}>
            <Ionicons name="eye-off-outline" size={15} color={ACCENT} />
            <Text style={styles.anonNoteText}>
              Seu nome não será associado ao pedido. Por privacidade, pedidos anônimos não aparecem no histórico de "Meus pedidos".
            </Text>
          </View>
        )}

        {/* Botão enviar */}
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="send-outline" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Enviar pedido</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Seu pedido será recebido e distribuído com cuidado pelo ministério de intercessão.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  content: { padding: spacing.lg, gap: spacing.lg },

  header: { gap: spacing.xs, paddingTop: spacing.sm },
  backBtn: { alignSelf: 'flex-start', marginBottom: spacing.sm },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.neutral[950], marginTop: spacing.xs },
  subtitle: { fontSize: fontSize.sm, color: colors.neutral[500], lineHeight: 22 },

  fieldGroup: { gap: spacing.xs },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.neutral[700] },
  required: { color: colors.semantic.danger },
  input: {
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.neutral[950],
  },
  textArea: { minHeight: 180, textAlignVertical: 'top' },
  charCount: { fontSize: fontSize.xs, color: colors.neutral[400], textAlign: 'right' },

  anonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  anonInfo: { flex: 1 },
  anonLabel: { fontSize: fontSize.md, fontWeight: '600', color: colors.neutral[800] },
  anonDesc: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: 2 },

  anonNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#EDE9FE',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  anonNoteText: { flex: 1, fontSize: fontSize.xs, color: ACCENT, fontWeight: '500' },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: ACCENT,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  submitBtnText: { fontSize: fontSize.md, fontWeight: '700', color: '#fff' },

  disclaimer: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
    textAlign: 'center',
    lineHeight: 18,
  },
})
