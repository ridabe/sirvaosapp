import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { Database } from '@/types/database'

// SecureStore tem limite de 2048 bytes por chave.
// Este adapter divide valores grandes em chunks de 1800 bytes
// e salva cada chunk com sufixo numérico na chave.
const CHUNK_SIZE = 1800

const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    // Tenta ler diretamente (valor pequeno sem chunks)
    const direct = await SecureStore.getItemAsync(key)
    if (direct !== null) return direct

    // Tenta remontar a partir de chunks
    const chunks: string[] = []
    let i = 0
    while (true) {
      const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`)
      if (chunk === null) break
      chunks.push(chunk)
      i++
    }
    return chunks.length > 0 ? chunks.join('') : null
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      // Remove chunks antigos caso existam de uma versão anterior
      await SecureStore.deleteItemAsync(`${key}_chunk_0`).catch(() => {})
      await SecureStore.setItemAsync(key, value)
      return
    }

    // Remove valor direto antigo e salva em chunks
    await SecureStore.deleteItemAsync(key).catch(() => {})
    const total = Math.ceil(value.length / CHUNK_SIZE)
    for (let i = 0; i < total; i++) {
      await SecureStore.setItemAsync(
        `${key}_chunk_${i}`,
        value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
      )
    }
  },

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key).catch(() => {})
    let i = 0
    while (true) {
      const chunkKey = `${key}_chunk_${i}`
      const exists = await SecureStore.getItemAsync(chunkKey)
      if (exists === null) break
      await SecureStore.deleteItemAsync(chunkKey)
      i++
    }
  },
}

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
