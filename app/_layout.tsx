import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { NotificationsProvider } from '@/context/NotificationsContext'
import { usePushNotifications } from '@/hooks/usePushNotifications'

SplashScreen.preventAutoHideAsync()

function PushSetup() {
  const { profile } = useAuth()
  usePushNotifications({ profileId: profile?.id })
  return null
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
      <PushSetup />
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
