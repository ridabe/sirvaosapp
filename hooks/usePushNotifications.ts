import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // Quando o app está em foreground, suprime o banner nativo do sistema
    // e mostra nosso banner in-app customizado no lugar
    shouldShowAlert: false,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
})

async function registerForPushNotifications(): Promise<string | null> {
  const appOwnership = Constants.appOwnership
  console.log('[Push] appOwnership:', appOwnership)
  console.log('[Push] isDevice:', Device.isDevice)

  if (appOwnership === 'expo') {
    console.warn('[Push] Expo Go detectado — push desabilitado. Use um development build.')
    return null
  }

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

// Salva a notificação recebida no histórico da tabela (fallback quando
// não veio pela edge function send-push, ex: testes diretos)
async function saveNotificationToHistory(profileId: string, notification: Notifications.Notification) {
  const content = notification.request.content
  if (!content.title && !content.body) return

  // Verifica se já existe pelo ID da notificação para evitar duplicatas
  const notifId = notification.request.identifier
  const { data: existing } = await (supabase as any)
    .from('notifications')
    .select('id')
    .eq('profile_id', profileId)
    .eq('data->>expo_id', notifId)
    .limit(1)

  if (existing?.length) return // já salvo pela edge function ou por chamada anterior

  await (supabase as any)
    .from('notifications')
    .insert({
      profile_id: profileId,
      title: content.title ?? 'Notificação',
      body: content.body ?? '',
      data: {
        ...(content.data as object ?? {}),
        expo_id: notifId,
      },
    })
}

type Options = {
  profileId: string | undefined
  onInAppNotification?: (n: InAppNotification) => void
}

export function usePushNotifications({ profileId, onInAppNotification }: Options) {
  const router = useRouter()
  const responseListener = useRef<Notifications.EventSubscription | null>(null)
  const notificationListener = useRef<Notifications.EventSubscription | null>(null)

  useEffect(() => {
    if (!profileId) return

    registerForPushNotifications().then(token => {
      if (token) saveToken(profileId, token)
    })

    // Notificação recebida com app ABERTO (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      const content = notification.request.content
      console.log('[Push] Recebida em foreground:', content.title)

      // Salva no histórico
      saveNotificationToHistory(profileId, notification)

      // Dispara banner in-app customizado
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

    // Notificação tocada com app em BACKGROUND ou fechado
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const notification = response.notification
      const content = notification.request.content
      const data = content.data as Record<string, string> | undefined

      console.log('[Push] Notificação tocada, data:', data)

      // Salva no histórico (caso não tenha sido salvo antes)
      saveNotificationToHistory(profileId, notification)

      // Navega para a rota correta
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
