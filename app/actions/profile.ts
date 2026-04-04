'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ProfileActionState = {
  error?: string
  success?: string
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
}

export async function updateProfileAvatar(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Əvvəlcə daxil ol.' }
  }

  const avatar = formData.get('avatar') as File | null

  if (!avatar || avatar.size === 0) {
    return { error: 'Şəkil seçilməyib.' }
  }

  if (!avatar.type.startsWith('image/')) {
    return { error: 'Yalnız şəkil faylı yükləyə bilərsən.' }
  }

  const maxSize = 3 * 1024 * 1024
  if (avatar.size > maxSize) {
    return { error: 'Şəkil maksimum 3 MB ola bilər.' }
  }

  const extension = avatar.name.includes('.') ? avatar.name.split('.').pop() : 'png'
  const fileName = `${user.id}-${Date.now()}-${sanitizeFilename(avatar.name || `avatar.${extension}`)}`
  const filePath = `profiles/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, avatar, {
      cacheControl: '3600',
      upsert: true,
      contentType: avatar.type || 'image/png',
    })

  if (uploadError) {
    return { error: `Şəkil upload olmadı: ${uploadError.message}` }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(filePath)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    return { error: `Profil yenilənmədi: ${updateError.message}` }
  }

  revalidatePath('/profile')
  revalidatePath('/settings')
  revalidatePath('/')

  return { success: 'Profil şəkli yeniləndi.' }
}
