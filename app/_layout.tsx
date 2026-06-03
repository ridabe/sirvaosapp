import { useEffect, useState } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { NotificationsProvider } from '@/context/NotificationsContext'
import { usePushNotifications, InAppNotification } from '@/hooks/usePushNotifications'
import { useAppUpdate } from '@/hooks/useAppUpdate'
import { InAppNotificationBanner } from '@/components/ui/InAppNotificationBanner'

SplashScreen.preventAutoHideAsync()

function AppSetup() {
  const { profile } = useAuth()
  const { checkForUpdate } = useAppUpdate()
  const [inAppNotif, setInAppNotif] = useState<InAppNotification | null>(null)

  usePushNotifications({
    profileId: profile?.id,
    onInAppNotification: (n) => setInAppNotif(n),
  })

  // Verifica atualização assim que o perfil carregar
  useEffect(() => {
    if (profile?.id) checkForUpdate()
  }, [profile?.id])

  return (
    <InAppNotificationBanner
      notification={inAppNotif}
      onDismiss={() => setInAppNotif(null)}
    />
  )
}

function RootLayoutNav() {
  const { session, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      router.replace('/(app)/')
    }
    SplashScreen.hideAsync()
  }, [session, loading])

  return (
    <>
      <AppSetup />
      <Slot />
    </>
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
