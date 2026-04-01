import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  const { data: featuredTournament } = await supabase
    .from('tournaments')
    .select(
      'id, title, slug, platform, prize_amount, entry_fee, max_players, status'
    )
    .eq('is_featured', true)
    .maybeSingle()

  let confirmedPlayers = 0

  if (featuredTournament) {
    const { count } = await supabase
      .from('tournament_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', featuredTournament.id)
      .eq('registration_status', 'confirmed')

    confirmedPlayers = count || 0
  }

  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pt-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <div className="mb-5 inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs text-cyan-300 sm:text-sm">
              Premium eFootball turnir platforması
            </div>

            <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Qoşul, yarış, qalib gəl və{' '}
              <span className="bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">
                mükafat qazan
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-lg">
              Peşəkar görünüşlü eFootball turnirləri, sadə qoşulma axını,
              təhlükəsiz hesab sistemi və premium istifadəçi təcrübəsi.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/tournaments"
                className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 text-center font-semibold text-black shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02]"
              >
                Turnirlərə bax
              </Link>
<Link
  href="/profile"
  className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-white hover:bg-white/10 transition"
>
  Profilim
</Link>
              
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl">
              <div className="rounded-[24px] border border-white/10 bg-[#0b1020] p-6">
                {featuredTournament ? (
                  <>
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-zinc-400">Featured Tournament</p>
                        <h2 className="text-2xl font-semibold">
                          {featuredTournament.title}
                        </h2>
                      </div>
                      <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-300">
                        {featuredTournament.status}
                      </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-zinc-400">Platform</p>
                        <p className="mt-1 font-medium">{featuredTournament.platform}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-zinc-400">Prize Pool</p>
                        <p className="mt-1 font-medium">
                          {featuredTournament.prize_amount} AZN
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-zinc-400">Entry Fee</p>
                        <p className="mt-1 font-medium">
                          {featuredTournament.entry_fee} AZN
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-zinc-400">Players</p>
                        <p className="mt-1 font-medium">
                          {confirmedPlayers} / {featuredTournament.max_players}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/tournaments/${featuredTournament.slug}`}
                      className="mt-6 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-4 font-semibold text-black transition hover:scale-[1.01]"
                    >
                      Turnirə bax
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="mb-6">
                      <p className="text-sm text-zinc-400">Featured Tournament</p>
                      <h2 className="text-2xl font-semibold">Hələ seçilməyib</h2>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-zinc-400">
                      Admin tərəfindən featured turnir seçiləndən sonra burada görünəcək.
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
