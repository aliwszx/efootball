import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function formatDate(value?: string | null) {
  if (!value) return 'Təyin edilməyib'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Təyin edilməyib'

  return new Intl.DateTimeFormat('az-AZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default async function TournamentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="min-h-screen bg-[#050816] px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            Turnirlər yüklənərkən xəta baş verdi.
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 text-sm uppercase tracking-[0.2em] text-cyan-300">Turnirlər</p>
              <h1 className="text-3xl font-bold sm:text-5xl">Aktiv turnirlər</h1>
              <p className="mt-4 text-zinc-400">
                Bütün turnirləri buradan izləyə və qeydiyyatdan keçə bilərsən.
              </p>
            </div>

            {user && (
              <Link
                href="/dashboard/my-tournaments"
                className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.01]"
              >
                Mənim turnirlərim
              </Link>
            )}
          </div>
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {tournaments && tournaments.length > 0 ? (
            tournaments.map((tournament: any) => {
              const title = tournament.title || 'Adsız turnir'
              const description =
                tournament.description || tournament.details || 'Təsvir əlavə edilməyib'
              const format =
                tournament.format || tournament.mode || tournament.type || 'Təyin edilməyib'
              const participants =
                tournament.max_players ||
                tournament.player_limit ||
                tournament.participants_limit ||
                'Təyin edilməyib'
              const fee =
                tournament.entry_fee ??
                tournament.price ??
                tournament.registration_fee ??
                0
              const status = tournament.status || 'Aktiv'
              const startDate =
                tournament.start_date ||
                tournament.starts_at ||
                tournament.event_date ||
                tournament.created_at

              return (
                <div
                  key={tournament.id}
                  className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition hover:bg-white/[0.07]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-2xl font-bold leading-tight">{title}</h2>

                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                      {status}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">
                    {description}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Format</p>
                      <p className="mt-1 font-medium text-white">{format}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">İştirakçı</p>
                      <p className="mt-1 font-medium text-white">{participants}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Qeydiyyat</p>
                      <p className="mt-1 font-medium text-white">
                        {typeof fee === 'number' ? `${fee} ₼` : fee}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Başlama</p>
                      <p className="mt-1 font-medium text-white">{formatDate(startDate)}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <Link
                      href={`/tournaments/${tournament.slug}`}
                      className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
                    >
                      Ətraflı bax
                    </Link>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-zinc-400">
              Hələ turnir yoxdur.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
