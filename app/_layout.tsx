import { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { NotificationsProvider, useNotifications } from '@/context/NotificationsContext'
import { usePushNotifications, InAppNotification } from '@/hooks/usePushNotifications'
import { useAppUpdate } from '@/hooks/useAppUpdate'
import { InAppNotificationBanner } from '@/components/ui/InAppNotificationBanner'

SplashScreen.preventAutoHideAsync()

function RootLayoutNav() {
  const { session, loading } = useAuth()
  const { checkForUpdate } = useAppUpdate()
  const { refetch: refetchNotifications } = useNotifications()
  const segments = useSegments()
  const router = useRouter()
  const [inAppNotif, setInAppNotif] = useState<InAppNotification | null>(null)

  const { profile } = useAuth()

  usePushNotifications({
    profileId: profile?.id,
    onInAppNotification: (n) => {
      setInAppNotif(n)
      refetchNotifications()
    },
  })

  useEffect(() => {
    if (profile?.id) checkForUpdate()
  }, [profile?.id])

  useEffect(() => {
    if (loading) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      router.replace('/(app)/' as never)
    }
    SplashScreen.hideAsync()
  }, [session, loading])

  return (
    // View raiz garante que o banner absolute fica acima do Stack (native screens)
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      <InAppNotificationBanner
        notification={inAppNotif}
        onDismiss={() => setInAppNotif(null)}
      />
    </View>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <StatusBar style="light" />
        <RootLayoutNav />
      </NotificationsProvider>
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
})
