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
        .in('key', [
          'android_required_version_code',
          'android_recommended_version_code',
          'android_play_store_url',
        ])

      if (error || !data?.length) return

      const cfg: Record<string, string> = Object.fromEntries(
        data.map((r: { key: string; value: string }) => [r.key, r.value])
      )

      const requiredCode = parseInt(cfg.android_required_version_code ?? '0', 10)
      const recommendedCode = parseInt(cfg.android_recommended_version_code ?? '0', 10)
      const storeUrl = cfg.android_play_store_url ?? ''

      if (requiredCode > currentCode) {
        // Atualização obrigatória — sem botão "Agora não"
        Alert.alert(
          '⚠️ Atualização obrigatória',
          'Uma nova versão do SirvaOS é necessária para continuar usando o app. Atualize agora na Play Store.',
          [
            {
              text: 'Atualizar agora',
              onPress: () => Linking.openURL(storeUrl),
            },
          ],
          { cancelable: false }
        )
        return
      }

      if (recommendedCode > currentCode) {
        // Atualização sugerida — com botão "Agora não"
        Alert.alert(
          '🆕 Nova versão disponível',
          'Uma atualização do SirvaOS está disponível na Play Store com melhorias e correções.',
          [
            { text: 'Agora não', style: 'cancel' },
            {
              text: 'Atualizar agora',
              onPress: () => Linking.openURL(storeUrl),
            },
          ]
        )
      }
    } catch {
      // Falha silenciosa — não bloqueia o app
    }
  }, [])

  return { checkForUpdate }
}
