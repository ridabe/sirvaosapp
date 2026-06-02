import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

// Etapa 6 — detalhe de escala com confirmação de presença
export default function EscalaDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return (
    <View className="flex-1 bg-neutral-50 items-center justify-center">
      <Text className="text-neutral-700">Escala {id}</Text>
    </View>
  )
}
