import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function TournamentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false })

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
                href="/my-tournaments"
                className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.01]"
              >
                Mənim turnirlərim
              </Link>
            )}
          </div>
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {tournaments && tournaments.length > 0 ? (
            tournaments.map((tournament: any) => (
              <div
                key={tournament.id}
                className="rounded-[28px] border border-white/10 bg-white/5 p-6"
              >
                <h2 className="text-2xl font-bold">{tournament.title}</h2>

                {tournament.description && (
                  <p className="mt-3 text-sm text-zinc-400">{tournament.description}</p>
                )}

                <div className="mt-5">
                  <Link
                    href={`/tournaments/${tournament.id}`}
                    className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
                  >
                    Ətraflı bax
                  </Link>
                </div>
              </div>
            ))
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