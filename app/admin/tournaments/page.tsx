import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { setFeaturedTournament } from '@/app/actions/tournaments'

export default async function AdminTournamentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select(`
      id,
      title,
      slug,
      platform,
      status,
      start_time,
      is_featured
    `)
    .order('created_at', { ascending: false })

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-cyan-300">
            Admin panel
          </p>
          <h1 className="text-4xl font-bold">Turnirlərin idarəsi</h1>
        </div>

        <Link
          href="/admin/tournaments/new"
          className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-3 font-semibold text-black"
        >
          Yeni turnir
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-300">
          Xəta: {error.message}
        </div>
      )}

      {!tournaments?.length ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur">
          Hələ turnir yoxdur.
        </div>
      ) : (
        <div className="space-y-4">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold">{t.title}</h2>

                  {t.is_featured && (
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                      Featured
                    </span>
                  )}

                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-300">
                    {t.status}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-zinc-400">
                  <p>Slug: {t.slug}</p>
                  <p>Platform: {t.platform}</p>
                  <p>Start: {new Date(t.start_time).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/tournaments/${t.slug}`}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm transition hover:bg-white/5"
                >
                  Bax
                </Link>

                <form action={setFeaturedTournament}>
                  <input type="hidden" name="tournament_id" value={t.id} />
                  <button
                    className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                      t.is_featured
                        ? 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                        : 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-black hover:scale-[1.02]'
                    }`}
                    disabled={t.is_featured}
                  >
                    {t.is_featured ? 'Featured seçilib' : 'Featured et'}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}