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
  const safeName = sanitizeFilename(avatar.name || `avatar.${extension}`)
  const filePath = `profiles/${user.id}/${Date.now()}-${safeName}`

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
  return { success: 'Profil şəkli yeniləndi.' }
}

export async function updateUsername(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Davam etmək üçün əvvəlcə daxil ol.' }
  }

  const rawUsername = String(formData.get('username') || '').trim()
  const username = rawUsername.toLowerCase().replace(/\s+/g, '_')

  if (username.length < 3 || username.length > 20) {
    return { error: 'Username 3 ilə 20 simvol arasında olmalıdır.' }
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return { error: 'Username yalnız hərflər, rəqəmlər və _ işarəsi ola bilər.' }
  }

  const { data: existing, error: existingError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user.id)
    .maybeSingle()

  if (existingError) {
    return { error: 'Username yoxlanılarkən xəta baş verdi.' }
  }
  if (existing) {
    return { error: 'Bu username artıq istifadə olunur.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ username })
    .eq('id', user.id)

  if (error) {
    if (error.message.toLowerCase().includes('duplicate')) {
      return { error: 'Bu username artıq istifadə olunur.' }
    }
    return { error: 'Username dəyişdirilərkən xəta baş verdi.' }
  }

  revalidatePath('/profile')
  revalidatePath('/tournaments')
  revalidatePath('/admin')
  return { success: 'Username uğurla yeniləndi.' }
}

export async function updateFullName(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Davam etmək üçün əvvəlcə daxil ol.' }
  }

  const fullName = String(formData.get('full_name') || '').trim()

  if (fullName.length < 2) {
    return { error: 'Ad ən azı 2 simvol olmalıdır.' }
  }
  if (fullName.length > 50) {
    return { error: 'Ad maksimum 50 simvol ola bilər.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id)

  if (error) {
    return { error: 'Ad dəyişdirilərkən xəta baş verdi.' }
  }

  revalidatePath('/profile')
  return { success: 'Ad uğurla yeniləndi.' }
}
