import { useState, useEffect, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import * as Network from 'expo-network'

// Exige falha por 3s antes de exibir o banner, evitando falso-offline durante
// inicialização da rede (ex: logo após o login ou retorno do background)
const OFFLINE_DEBOUNCE_MS = 3000

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const appState = useRef(AppState.currentState)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function check() {
    try {
      const state = await Network.getNetworkStateAsync()
      // isInternetReachable é instável no Android (retorna false mesmo com internet)
      // usa apenas isConnected, que reflete o estado real do adaptador de rede
      const online = state.isConnected !== false

      if (online) {
        if (offlineTimerRef.current) {
          clearTimeout(offlineTimerRef.current)
          offlineTimerRef.current = null
        }
        setIsOnline(true)
      } else if (!offlineTimerRef.current) {
        offlineTimerRef.current = setTimeout(() => {
          setIsOnline(false)
          offlineTimerRef.current = null
        }, OFFLINE_DEBOUNCE_MS)
      }
    } catch {
      setIsOnline(true)
    }
  }

  useEffect(() => {
    check()

    intervalRef.current = setInterval(check, 30_000)

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        check()
      }
      appState.current = next
    })

    return () => {
      sub.remove()
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current)
    }
  }, [])

  return { isOnline, recheckNetwork: check }
}
