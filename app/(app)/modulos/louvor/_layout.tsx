import { Stack } from 'expo-router'

export default function LouvorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="escala/[id]" />
    </Stack>
  )
}
