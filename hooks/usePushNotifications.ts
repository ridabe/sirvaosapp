import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

async function registerForPushNotifications(): Promise<string | null> {
  // Push não funciona no Expo Go a partir do SDK 53 — requer development build
  if (Constants.appOwnership === 'expo') {
    console.log('[Push] Expo Go detectado — push desabilitado. Use um development build.')
    return null
  }

  if (!Device.isDevice) return null

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'SirvaOS',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0E6B68',
    })
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    )
    return token.data
  } catch (e) {
    console.warn('[Push] Não foi possível obter token:', e)
    return null
  }
}

async function saveToken(profileId: string, token: string) {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android'
  await (supabase as any)
    .from('push_tokens')
    .upsert(
      { profile_id: profileId, token, platform, active: true, updated_at: new Date().toISOString() },
      { onConflict: 'profile_id,token' }
    )
}

type Options = {
  profileId: string | undefined
  onNotification?: (notification: Notifications.Notification) => void
}

export function usePushNotifications({ profileId, onNotification }: Options) {
  const router = useRouter()
  const responseListener = useRef<Notifications.EventSubscription | null>(null)
  const notificationListener = useRef<Notifications.EventSubscription | null>(null)

  useEffect(() => {
    if (!profileId) return

    registerForPushNotifications().then(token => {
      if (token) saveToken(profileId, token)
    })

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      onNotification?.(notification)
    })

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, string> | undefined
      if (data?.route) {
        router.push(data.route as any)
      } else {
        router.push('/(app)/notificacoes')
      }
    })

    return () => {
      notificationListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [profileId])
}
