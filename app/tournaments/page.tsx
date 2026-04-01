import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

function statusClasses(status: string) {
  switch (status) {
    case 'open':
      return 'bg-emerald-400/15 text-emerald-300 border-emerald-400/20'
    case 'ongoing':
      return 'bg-cyan-400/15 text-cyan-300 border-cyan-400/20'
    case 'finished':
      return 'bg-zinc-400/15 text-zinc-300 border-zinc-400/20'
    default:
      return 'bg-yellow-400/15 text-yellow-300 border-yellow-400/20'
  }
}

export default async function TournamentsPage() {
  const supabase = await createClient()

  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select(
      'id, title, slug, game, platform, format, entry_fee, prize_amount, max_players, start_time, registration_deadline, status'
    )
    .order('start_time', { ascending: true })

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8">
        <div>
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-cyan-300">
            Tournaments
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">Aktiv turnirlər</h1>
          <p className="mt-3 max-w-2xl text-sm text-zinc-400 sm:text-base">
            Açıq turnirlərə bax, detalları öyrən və bir kliklə qoşul.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-300">
          Xəta: {error.message}
        </div>
      )}

      {!tournaments?.length ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur">
          <h2 className="text-2xl font-semibold">Hələ turnir yoxdur</h2>
          <p className="mt-3 text-zinc-400">
            Birinci turniri yaratdıqdan sonra burada görünəcək.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="group rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/[0.07] sm:rounded-[28px] sm:p-5"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold sm:text-xl">{t.title}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{t.game}</p>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClasses(
                    t.status
                  )}`}
                >
                  {t.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs text-zinc-400">Platform</p>
                  <p className="mt-1 font-medium">{t.platform}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs text-zinc-400">Format</p>
                  <p className="mt-1 font-medium">{t.format}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs text-zinc-400">Entry</p>
                  <p className="mt-1 font-medium">{t.entry_fee} AZN</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs text-zinc-400">Prize</p>
                  <p className="mt-1 font-medium">{t.prize_amount} AZN</p>
                </div>
              </div>

              <div className="mt-5 space-y-2 text-sm text-zinc-400">
                <p>
                  Start:{' '}
                  <span className="text-zinc-200">
                    {new Date(t.start_time).toLocaleString()}
                  </span>
                </p>
                <p>
                  Deadline:{' '}
                  <span className="text-zinc-200">
                    {new Date(t.registration_deadline).toLocaleString()}
                  </span>
                </p>
                <p>
                  Max players: <span className="text-zinc-200">{t.max_players}</span>
                </p>
              </div>

              <Link
                href={`/tournaments/${t.slug}`}
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.01] sm:text-base"
              >
                Ətraflı bax
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}