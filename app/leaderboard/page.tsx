import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: entries, error } = await supabase
    .from('global_leaderboard')
    .select(`
      id,
      user_id,
      wins_total,
      draws_total,
      playoff_qualifications_total,
      final_appearances_total,
      global_points,
      profiles:user_id (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .order('global_points', { ascending: false })
    .order('wins_total', { ascending: false })
    .order('draws_total', { ascending: false })

  return (
    <main className="min-h-screen px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-cyan-300">Ranking</p>
          <h1 className="text-3xl font-bold sm:text-5xl">Ümumi Leaderboard</h1>
          <p className="mt-4 text-zinc-400">
            Bütün turnirlər üzrə ümumi nəticələr. Qələbə, bərabərlik və bonus xalları burada toplanır.
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
              Hələ ümumi leaderboard məlumatı yoxdur.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-left text-zinc-300">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">İstifadəçi</th>
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

                    const displayName =
                      profile?.full_name || profile?.username || 'User'

                    const username = profile?.username || 'username'
                    const avatarUrl = profile?.avatar_url || ''
                    const avatarLetter = username.charAt(0).toUpperCase()

                    return (
                      <tr key={item.id} className="border-t border-white/10">
                        <td className="p-3 font-semibold text-cyan-300">
                          {index + 1}
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 overflow-hidden rounded-full border border-white/10 bg-white/5">
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt={displayName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-cyan-300">
                                  {avatarLetter}
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="font-medium text-white">
                                {displayName}
                              </div>
                              <div className="text-xs text-zinc-500">
                                @{username}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 text-zinc-200">{item.wins_total}</td>
                        <td className="p-3 text-zinc-200">{item.draws_total}</td>
                        <td className="p-3 text-zinc-200">
                          {item.playoff_qualifications_total}
                        </td>
                        <td className="p-3 text-zinc-200">
                          {item.final_appearances_total}
                        </td>
                        <td className="p-3 font-bold text-white">
                          {item.global_points}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6">
            <Link
              href="/tournaments"
              className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Turnirlərə keç
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
