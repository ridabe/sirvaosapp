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
  const appOwnership = Constants.appOwnership
  console.log('[Push] appOwnership:', appOwnership)
  console.log('[Push] isDevice:', Device.isDevice)

  // Push não funciona no Expo Go a partir do SDK 53 — requer development build
  if (appOwnership === 'expo') {
    console.warn('[Push] Expo Go detectado — push desabilitado. Use um development build.')
    return null
  }

  if (!Device.isDevice) {
    console.warn('[Push] Emulador detectado — push não funciona em emuladores.')
    return null
  }

  const { status: existing } = await Notifications.getPermissionsAsync()
  console.log('[Push] Status de permissão atual:', existing)

  let finalStatus = existing

  if (existing !== 'granted') {
    console.log('[Push] Solicitando permissão...')
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
    console.log('[Push] Status após solicitação:', status)
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
    console.log('[Push] projectId:', projectId)

    if (!projectId) {
      console.error('[Push] projectId não encontrado em Constants.expoConfig.extra.eas.projectId')
    }

    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    )
    console.log('[Push] Token obtido com sucesso:', token.data)
    return token.data
  } catch (e) {
    console.error('[Push] Erro ao obter token:', e)
    return null
  }
}

async function saveToken(profileId: string, token: string) {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android'
  console.log('[Push] Salvando token no banco para profile:', profileId)

  const { error } = await (supabase as any)
    .from('push_tokens')
    .upsert(
      {
        profile_id: profileId,
        token,
        platform,
        active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'profile_id,token' }
    )

  if (error) {
    console.error('[Push] Erro ao salvar token no banco:', JSON.stringify(error))
  } else {
    console.log('[Push] Token salvo com sucesso no banco.')
  }
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
    console.log('[Push] useEffect disparado, profileId:', profileId)
    if (!profileId) {
      console.log('[Push] profileId ainda não disponível, aguardando...')
      return
    }

    registerForPushNotifications().then(token => {
      if (token) {
        saveToken(profileId, token)
      } else {
        console.warn('[Push] Nenhum token obtido — registro não realizado.')
      }
    })

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Push] Notificação recebida em foreground:', notification.request.content.title)
      onNotification?.(notification)
    })

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, string> | undefined
      console.log('[Push] Notificação tocada, data:', data)
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
