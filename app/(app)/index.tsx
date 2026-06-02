import { View, Text, ScrollView } from 'react-native'

// Etapa 3 — home completa com escalas, módulos e comunicados
export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="bg-primary px-5 pt-14 pb-6">
        <Text className="text-white text-sm">Bem-vindo de volta</Text>
        <Text className="text-white text-2xl font-bold mt-1">Olá, Membro</Text>
      </View>
      <View className="p-5">
        <Text className="text-neutral-700 text-center">
          Carregando seus dados...
        </Text>
      </View>
    </ScrollView>
  )
}
