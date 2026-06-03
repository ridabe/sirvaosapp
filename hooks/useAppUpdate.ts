import { useCallback } from 'react'
import { Alert, Linking } from 'react-native'
import Constants from 'expo-constants'
import { supabase } from '@/lib/supabase'

export function useAppUpdate() {
  const checkForUpdate = useCallback(async () => {
    try {
      const currentCode: number | undefined =
        Constants.expoConfig?.android?.versionCode

      if (!currentCode) return

      const { data, error } = await (supabase as any)
        .from('app_config')
        .select('key, value')
        .in('key', ['android_version_code', 'android_play_store_url'])

      if (error || !data?.length) return

      const cfg: Record<string, string> = Object.fromEntries(
        data.map((r: { key: string; value: string }) => [r.key, r.value])
      )

      const requiredCode = parseInt(cfg.android_version_code ?? '0', 10)
      const storeUrl = cfg.android_play_store_url ?? ''

      if (requiredCode > currentCode) {
        // Atualização obrigatória
        Alert.alert(
          '⚠️ Atualização necessária',
          'Uma nova versão do SirvaOS está disponível. Atualize agora para continuar usando o app.',
          [
            {
              text: 'Atualizar agora',
              onPress: () => Linking.openURL(storeUrl),
            },
          ],
          { cancelable: false }
        )
      }
    } catch {
      // Falha silenciosa
    }
  }, [])

  return { checkForUpdate }
}
