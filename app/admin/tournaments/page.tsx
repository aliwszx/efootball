import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { setFeaturedTournament } from '@/app/actions/tournaments'
import StartTournamentButton from './start-tournament-button'
import EndTournamentButton from './end-tournament-button'

export default async function AdminTournamentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('id, title, slug, platform, status, start_time, is_featured')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <section className="relative overflow-hidden rounded-[28px] border border-[#C50337]/20 bg-[#C50337]/5 p-7 backdrop-blur-xl sm:p-10">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#C50337]/10 via-transparent to-[#8B0224]/5" />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#C50337]/25 bg-[#C50337]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff4d6d]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff4d6d]" /> Admin Panel
              </div>
              <h1 className="text-4xl font-bold sm:text-5xl" style={{ fontFamily: 'var(--font-poppins)' }}>Turnirlərin idarəsi</h1>
            </div>
            <Link href="/admin/tournaments/new"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-[#C50337] to-[#8B0224] px-5 py-3 font-semibold text-white shadow-lg shadow-[#C50337]/20 transition hover:scale-[1.02] hover:shadow-[#C50337]/35">
              + Yeni turnir
            </Link>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/8 p-4 text-sm text-red-300">
            Xəta: {error.message}
          </div>
        )}

        <div className="mt-6 space-y-3">
          {!tournaments?.length ? (
            <div className="rounded-[24px] border border-[#C50337]/10 bg-[#C50337]/4 p-10 text-center text-zinc-500">
              Hələ turnir yoxdur.
            </div>
          ) : tournaments.map((t) => (
            <div key={t.id}
              className="flex flex-col gap-4 rounded-[24px] border border-[#C50337]/10 bg-[#C50337]/4 p-5 backdrop-blur-xl transition hover:border-[#C50337]/20 hover:bg-[#C50337]/7 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>{t.title}</h2>
                  {t.is_featured && (
                    <span className="rounded-full border border-[#C50337]/25 bg-[#C50337]/10 px-2.5 py-0.5 text-xs font-medium text-[#ff4d6d]">
                      Featured
                    </span>
                  )}
                  <span className="rounded-full border border-zinc-600/30 bg-zinc-600/10 px-2.5 py-0.5 text-xs text-zinc-400">
                    {t.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500">
                  <span>Slug: {t.slug}</span>
                  <span>Platform: {t.platform}</span>
                  <span>Başlama: {new Date(t.start_time).toLocaleString('az-AZ')}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href={`/tournaments/${t.slug}`}
                  className="rounded-xl border border-[#C50337]/15 bg-[#C50337]/8 px-4 py-2 text-sm text-zinc-300 transition hover:border-[#C50337]/25 hover:text-white">
                  Bax
                </Link>
                <Link href={`/admin/tournaments/${t.id}/edit`}
                  className="rounded-xl border border-zinc-600/30 bg-zinc-600/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500/40 hover:bg-zinc-600/20 hover:text-white">
                  Düzəliş et
                </Link>

                {(t.status === 'open' || t.status === 'draft') && (
                  <StartTournamentButton tournamentId={t.id} />
                )}

                {t.status === 'ongoing' && (
                  <EndTournamentButton tournamentId={t.id} />
                )}

                <form action={setFeaturedTournament}>
                  <input type="hidden" name="tournament_id" value={t.id} />
                  <button
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                      t.is_featured
                        ? 'border border-[#C50337]/20 bg-[#C50337]/10 text-[#ff4d6d] cursor-default'
                        : 'bg-gradient-to-r from-[#C50337] to-[#8B0224] text-white hover:scale-[1.02] shadow-md shadow-[#C50337]/20'
                    }`}
                    disabled={t.is_featured}
                  >
                    {t.is_featured ? '★ Featured seçilib' : 'Featured et'}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
