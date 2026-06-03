import AsyncStorage from '@react-native-async-storage/async-storage'

const DEFAULT_TTL_MS = 10 * 60 * 1000 // 10 minutos

type CacheEntry<T> = {
  data: T
  expiresAt: number
}

export async function cacheSet<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs }
    await AsyncStorage.setItem(`cache:${key}`, JSON.stringify(entry))
  } catch {
    // falha silenciosa — cache é best-effort
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`cache:${key}`)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    if (Date.now() > entry.expiresAt) return null
    return entry.data
  } catch {
    return null
  }
}

export async function cacheGetStale<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`cache:${key}`)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    return entry.data
  } catch {
    return null
  }
}
