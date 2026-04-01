'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUsernameError, normalizeUsername } from '@/lib/usernames'

export async function updateUsername(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Davam etmək üçün əvvəlcə daxil ol.' }
  }

  const rawUsername = String(formData.get('username') || '')
  const username = normalizeUsername(rawUsername)
  const usernameError = getUsernameError(username)

  if (usernameError) {
    return { error: usernameError }
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user.id)
    .maybeSingle()

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

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/profile')

  return { success: 'Username uğurla yeniləndi.' }
}
