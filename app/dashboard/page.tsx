import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { generateUniqueUsername, normalizeUsername } from '@/lib/usernames'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    const preferredUsername = normalizeUsername(
      String(user.user_metadata?.username || user.email?.split('@')[0] || '')
    )

    const username = await generateUniqueUsername(
      supabase,
      preferredUsername,
      user.id.slice(0, 8)
    )

    await supabase.from('profiles').insert({
      id: user.id,
      username,
      full_name: '',
    })
  }

  const { data: freshProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:rounded-[32px] sm:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
          Dashboard
        </p>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Xoş gəldin, {freshProfile?.username || user.email}
        </h1>
        <p className="text-zinc-400">
          Username: {freshProfile?.username} · Role: {freshProfile?.role}
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/dashboard/my-tournaments"
          className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.07]"
        >
          <p className="text-sm text-zinc-400">User Area</p>
          <h2 className="mt-2 text-2xl font-semibold">Mənim turnirlərim</h2>
        </Link>

        <Link
          href="/dashboard/payments"
          className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.07]"
        >
          <p className="text-sm text-zinc-400">Billing</p>
          <h2 className="mt-2 text-2xl font-semibold">Ödənişlərim</h2>
        </Link>

        <Link
          href="/tournaments"
          className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.07]"
        >
          <p className="text-sm text-zinc-400">Explore</p>
          <h2 className="mt-2 text-2xl font-semibold">Turnirlər</h2>
        </Link>

        <Link
          href="/dashboard/profile"
          className="rounded-[28px] border border-white/10 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.07]"
        >
          <p className="text-sm text-zinc-300">Account</p>
          <h2 className="mt-2 text-2xl font-semibold">Profil ayarları</h2>
          <p className="mt-2 text-sm text-zinc-400">Username dəyişmək üçün daxil ol</p>
        </Link>
      </div>

      {freshProfile?.role === 'admin' && (
        <div className="mt-8 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-emerald-300">
            Admin panel
          </p>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/admin/tournaments"
              className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:bg-white/5"
            >
              Turnirlər
            </Link>
            <Link
              href="/admin/tournaments/new"
              className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:bg-white/5"
            >
              Yeni turnir
            </Link>
            <Link
              href="/admin/registrations"
              className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:bg-white/5"
            >
              Registrations
            </Link>
            <Link
              href="/admin/payments"
              className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:bg-white/5"
            >
              Payments
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
