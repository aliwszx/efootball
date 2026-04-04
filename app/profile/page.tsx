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
    .select('username, full_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const username = profile?.username || ''
  const fullName = profile?.full_name || ''
  const avatarUrl = profile?.avatar_url || ''

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-cyan-300">
            Profile
          </p>

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold sm:text-5xl">Profilim</h1>
              <p className="mt-3 text-sm text-zinc-300">
                Hesab məlumatlarını idarə et, profil şəklini yenilə və ödənişlərini yoxla.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-full border border-white/10 bg-white/5">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profil şəkli"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-cyan-300">
                    {username?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              <div>
                <p className="text-lg font-semibold">
                  {fullName || username || 'İstifadəçi'}
                </p>
                <p className="text-sm text-zinc-400">{user.email ?? ''}</p>
              </div>
            </div>
          </div>

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
          <ProfileForm
            currentUsername={username}
            fullName={fullName}
            avatarUrl={avatarUrl}
            email={user.email ?? ''}
            payments={payments || []}
          />
        </div>
      </div>
    </main>
  )
}
