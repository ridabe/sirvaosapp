import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="primeiro-acesso" />
      <Stack.Screen name="recuperar-senha" />
    </Stack>
  )
}
