import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { colors } from '@/constants/colors'

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>Bem-vindo de volta</Text>
        <Text style={styles.title}>Olá, Membro</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.placeholder}>Carregando seus dados...</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  header: { backgroundColor: colors.brand.primary, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 24 },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  body: { padding: 20 },
  placeholder: { color: colors.neutral[700], textAlign: 'center' },
})
