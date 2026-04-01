import { redirect } from 'next/navigation'
import Link from 'next/link'
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
    .select('username, role')
    .eq('id', user.id)
    .maybeSingle()

  const username = profile?.username || ''
  const role = profile?.role || 'user'

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-cyan-300">Profile</p>
          <h1 className="text-3xl font-bold sm:text-5xl">Profilim</h1>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/tournaments"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium transition hover:bg-white/10"
            >
              Turnirlərə keç
            </Link>

            <Link
              href="/dashboard/my-tournaments"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium transition hover:bg-white/10"
            >
              Mənim turnirlərim
            </Link>

            
          </div>
        </section>

        <div className="mt-8">
          <ProfileForm currentUsername={username} email={user.email ?? ''} />
        </div>
      </div>
    </main>
  )
}
