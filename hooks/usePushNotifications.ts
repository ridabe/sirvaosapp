import { useEffect, useRef } from 'react'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

export type InAppNotification = {
  id: string
  title: string
  body: string
  route?: string
}

// No SDK 53+, importar expo-notifications no Expo Go causa crash imediato.
// Usamos require condicional para que o módulo jamais seja carregado no Expo Go.
const isExpoGo = Constants.appOwnership === 'expo'
type NotificationsModule = typeof import('expo-notifications')
const Notifications: NotificationsModule | null = isExpoGo
  ? null
  : (require('expo-notifications') as NotificationsModule)

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: false,
      shouldShowList: false,
    }),
  })
}

async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications) return null
  if (!Device.isDevice) {
    console.warn('[Push] Emulador detectado — push não funciona em emuladores.')
    return null
  }

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push] Permissão negada. Status final:', finalStatus)
    return null
  }

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
    console.log('[Push] Token obtido:', token.data)
    return token.data
  } catch (e) {
    console.error('[Push] Erro ao obter token:', e)
    return null
  }
}

async function saveToken(profileId: string, token: string) {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android'
  const { error } = await (supabase as any)
    .from('push_tokens')
    .upsert(
      { profile_id: profileId, token, platform, active: true, updated_at: new Date().toISOString() },
      { onConflict: 'profile_id,token' }
    )
  if (error) console.error('[Push] Erro ao salvar token:', JSON.stringify(error))
  else console.log('[Push] Token salvo com sucesso.')
}

async function saveNotificationToHistory(
  profileId: string,
  notification: import('expo-notifications').Notification
) {
  const content = notification.request.content
  if (!content.title && !content.body) return

  const notifId = notification.request.identifier
  const { data: existing } = await (supabase as any)
    .from('notifications')
    .select('id')
    .eq('profile_id', profileId)
    .eq('data->>expo_id', notifId)
    .limit(1)

  if (existing?.length) return

  await (supabase as any)
    .from('notifications')
    .insert({
      profile_id: profileId,
      title: content.title ?? 'Notificação',
      body: content.body ?? '',
      data: { ...(content.data as object ?? {}), expo_id: notifId },
    })
}

type Options = {
  profileId: string | undefined
  onInAppNotification?: (n: InAppNotification) => void
}

export function usePushNotifications({ profileId, onInAppNotification }: Options) {
  const router = useRouter()
  const responseListener = useRef<any>(null)
  const notificationListener = useRef<any>(null)

  useEffect(() => {
    if (!profileId || !Notifications) return

    registerForPushNotifications().then(token => {
      if (token) saveToken(profileId, token)
    })

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      const content = notification.request.content
      saveNotificationToHistory(profileId, notification)
      if (content.title || content.body) {
        const data = content.data as Record<string, string> | undefined
        onInAppNotification?.({
          id: notification.request.identifier,
          title: content.title ?? 'Notificação',
          body: content.body ?? '',
          route: data?.route,
        })
      }
    })

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const notification = response.notification
      const content = notification.request.content
      const data = content.data as Record<string, string> | undefined
      saveNotificationToHistory(profileId, notification)
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
