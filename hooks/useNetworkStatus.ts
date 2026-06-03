import { useState, useEffect, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'

async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const res = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    })
    clearTimeout(timeout)
    return res.status === 204
  } catch {
    return false
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const appState = useRef(AppState.currentState)

  async function check() {
    const online = await checkConnectivity()
    setIsOnline(online)
  }

  useEffect(() => {
    check()

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        check()
      }
      appState.current = next
    })

    return () => sub.remove()
  }, [])

  return { isOnline, recheckNetwork: check }
}
