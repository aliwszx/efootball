'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import sharp from 'sharp'

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
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
if (!allowedTypes.includes(avatar.type)) {
  return { error: 'Yalnız JPEG, PNG, WEBP və ya GIF faylı yükləyə bilərsən.' }
}
  // 5 MB-a qədər qəbul et — sharp sıxışdıracaq
  const maxSize = 20 * 1024 * 1024
  if (avatar.size > maxSize) {
    return { error: 'Şəkil maksimum 5 MB ola bilər.' }
  }

  // Sharp ilə 300x300 px-ə resize et, WebP formatına çevir (~20-60 KB olur)
  const arrayBuffer = await avatar.arrayBuffer()
  const inputBuffer = Buffer.from(arrayBuffer)

  let resizedBuffer: Buffer
  try {
    resizedBuffer = await sharp(inputBuffer)
      .resize(300, 300, {
        fit: 'cover',       // mərkəzdən kəsir, nisbəti qoruyur
        position: 'center',
      })
      .webp({ quality: 80 }) // WebP, keyfiyyət 80% — ~30-80 KB
      .toBuffer()
  } catch {
    return { error: 'Şəkil emal edilərkən xəta baş verdi.' }
  }

  const safeName = sanitizeFilename(avatar.name || 'avatar')
  const filePath = `profiles/${user.id}/${Date.now()}-${safeName}.webp`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, resizedBuffer, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'image/webp',
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
