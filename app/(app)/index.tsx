import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { colors } from '@/constants/colors'
import { useMember } from '@/hooks/useMember'
import { spacing, fontSize } from '@/lib/theme'

export default function HomeScreen() {
  const { firstName, loading } = useMember()

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Saudação */}
      <View style={styles.greeting}>
        <Text style={styles.greetingSubtitle}>Bem-vindo de volta</Text>
        {loading
          ? <ActivityIndicator color={colors.brand.primary} style={{ marginTop: 4 }} />
          : <Text style={styles.greetingTitle}>Olá, {firstName ?? 'Membro'} 👋</Text>
        }
      </View>

      {/* Conteúdo da Etapa 3 será adicionado aqui */}
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Seus módulos e eventos aparecerão aqui.</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  content: { padding: spacing.lg },
  greeting: { marginBottom: spacing.xl },
  greetingSubtitle: { fontSize: fontSize.sm, color: colors.neutral[500] },
  greetingTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.neutral[950], marginTop: 4 },
  placeholder: {
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderStyle: 'dashed',
  },
  placeholderText: { fontSize: fontSize.sm, color: colors.neutral[500], textAlign: 'center' },
})
