import { View, Text, StyleSheet } from 'react-native'
import { colors } from '@/constants/colors'

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>SirvaOS</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brand.primary },
  logo: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
})
