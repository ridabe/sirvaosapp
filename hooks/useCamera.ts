import { useState } from 'react'
import { Alert, Linking } from 'react-native'
import { useCameraPermissions } from 'expo-camera'

export function useCamera() {
  const [permission, requestPermission] = useCameraPermissions()
  const [requesting, setRequesting] = useState(false)

  async function ensurePermission(): Promise<boolean> {
    if (permission?.granted) return true

    setRequesting(true)
    try {
      const result = await requestPermission()
      if (result.granted) return true

      // Usuário negou — orienta para as configurações
      if (!result.canAskAgain) {
        Alert.alert(
          'Permissão de câmera',
          'A permissão foi negada. Para usar essa função, ative a câmera nas configurações do dispositivo.',
          [
            { text: 'Agora não', style: 'cancel' },
            { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
          ]
        )
      }
      return false
    } finally {
      setRequesting(false)
    }
  }

  return {
    hasPermission: permission?.granted ?? false,
    ensurePermission,
    requesting,
  }
}
