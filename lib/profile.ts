import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'
import { supabase } from './supabase'

export async function pickImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (status !== 'granted') return null

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  })

  if (result.canceled || !result.assets[0]) return null
  return result.assets[0].uri
}

export async function captureImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync()
  if (status !== 'granted') return null

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  })

  if (result.canceled || !result.assets[0]) return null
  return result.assets[0].uri
}

export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  const ext = (localUri.split('.').pop() ?? 'jpg').toLowerCase()
  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
  const fileName = `${userId}/avatar.${ext}`

  // Lê o arquivo como base64 via expo-file-system (confiável em React Native)
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: 'base64' as any,
  })
  const arrayBuffer = decode(base64)

  const { error } = await supabase.storage
    .from('avatars')
    .upload(fileName, arrayBuffer, {
      contentType: mimeType,
      upsert: true,
    })

  if (error) throw error

  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
  // Cache busting para forçar recarregamento da imagem
  return `${data.publicUrl}?t=${Date.now()}`
}

export async function updateProfileName(userId: string, fullName: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', userId)
  if (error) throw error
}

export async function updateProfileAvatar(userId: string, avatarUrl: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)
  if (error) throw error
}

export async function updateMemberPhone(memberId: string, phone: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('members')
    .update({ phone })
    .eq('id', memberId)
  if (error) throw error
}
