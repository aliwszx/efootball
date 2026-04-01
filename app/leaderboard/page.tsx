import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: entries, error } = await supabase
    .from('leaderboard_entries')
    .select(`
      id,
      wins,
      draws,
      playoff_bonus,
      final_bonus,
      total_points,
      user_id,
      tournament_id,
      profiles:user_id (
        id,
        username,
        full_name
      ),
      tournaments:tournament_id (
        id,
        title,
        slug
      )
    `)
    .order('total_points', { ascending: false })
    .order('wins', { ascending: false })
    .order('draws', { ascending: false })

  return (
    <main className="min-h-screen px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-cyan-300">Ranking</p>
          <h1 className="text-3xl font-bold sm:text-5xl">Leaderboard</h1>
          <p className="mt-4 text-zinc-400">
            Qələbə = 3 xal, bərabərlik = 1 xal, playoff = +2 xal, final = +4 xal
          </p>
        </section>

        <div className="mt-8">
          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-200">
              Xəta: {error.message}
            </div>
          )}

          {!entries?.length ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-zinc-300">
              Hələ leaderboard məlumatı yoxdur.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-left text-zinc-300">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">İstifadəçi</th>
                    <th className="p-3">Turnir</th>
                    <th className="p-3">Qələbə</th>
                    <th className="p-3">Bərabərlik</th>
                    <th className="p-3">Playoff</th>
                    <th className="p-3">Final</th>
                    <th className="p-3">Xal</th>
                  </tr>
                </thead>

                <tbody>
                  {entries.map((item: any, index: number) => {
                    const profile = Array.isArray(item.profiles)
                      ? item.profiles[0]
                      : item.profiles

                    const tournament = Array.isArray(item.tournaments)
                      ? item.tournaments[0]
                      : item.tournaments

                    return (
                      <tr key={item.id} className="border-t border-white/10">
                        <td className="p-3 font-semibold text-cyan-300">{index + 1}</td>

                        <td className="p-3">
                          <div className="font-medium text-white">
                            {profile?.full_name || profile?.username || 'User'}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {profile?.username || item.user_id}
                          </div>
                        </td>

                        <td className="p-3 text-zinc-200">
                          {tournament?.slug ? (
                            <Link
                              href={`/tournaments/${tournament.slug}`}
                              className="transition hover:text-cyan-300"
                            >
                              {tournament.title}
                            </Link>
                          ) : (
                            tournament?.title || '-'
                          )}
                        </td>

                        <td className="p-3 text-zinc-200">{item.wins}</td>
                        <td className="p-3 text-zinc-200">{item.draws}</td>
                        <td className="p-3 text-zinc-200">{item.playoff_bonus}</td>
                        <td className="p-3 text-zinc-200">{item.final_bonus}</td>
                        <td className="p-3 font-bold text-white">{item.total_points}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
