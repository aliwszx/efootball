import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from './form'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ProfileForm currentUsername={profile?.username || ''} email={user.email || ''} />
    </main>
  )
}
