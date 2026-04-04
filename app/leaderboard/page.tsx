import { createClient } from '@/lib/supabase/server'

export default async function LeaderboardPage() {
  const supabase = await createClient()

  // Əvvəlcə bütün profilləri gətir
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')

  // Leaderboard məlumatlarını gətir
  const { data: leaderboardEntries, error: leaderboardError } = await supabase
    .from('global_leaderboard')
    .select(`
      id,
      user_id,
      wins_total,
      draws_total,
      playoff_qualifications_total,
      final_appearances_total,
      global_points
    `)

  const error = profilesError || leaderboardError

  // Bütün profilləri leaderboard məlumatları ilə birləşdir
  const leaderboardMap = new Map(
    (leaderboardEntries || []).map((e: any) => [e.user_id, e])
  )

  const merged = (profiles || []).map((profile: any) => {
    const entry = leaderboardMap.get(profile.id)
    return {
      id: entry?.id ?? profile.id,
      user_id: profile.id,
      wins_total: entry?.wins_total ?? 0,
      draws_total: entry?.draws_total ?? 0,
      playoff_qualifications_total: entry?.playoff_qualifications_total ?? 0,
      final_appearances_total: entry?.final_appearances_total ?? 0,
      global_points: entry?.global_points ?? 0,
      profile,
    }
  })

  // Sıralama: xal (azalan) → əlifba (artan)
  const entries = merged
    .sort((a, b) => {
      if (b.global_points !== a.global_points) return b.global_points - a.global_points
      const nameA = (a.profile?.full_name || a.profile?.username || '').toLowerCase()
      const nameB = (b.profile?.full_name || b.profile?.username || '').toLowerCase()
      return nameA.localeCompare(nameB, 'az')
    })
    .slice(0, 20)

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-cyan-300">Ranking</p>
          <h1 className="text-3xl font-bold sm:text-5xl">Ümumi Leaderboard</h1>
          <p className="mt-4 text-zinc-400">
            Bütün turnirlər üzrə ümumi nəticələr. Qələbə = 3 xal, bərabərlik = 1 xal,
            playoff = +2 xal, final = +4 xal.
          </p>
        </section>

        <div className="mt-8">
          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-200">
              Xəta: {error.message}
            </div>
          )}

          {!entries?.length ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-zinc-300 backdrop-blur-xl">
              Hələ ümumi leaderboard məlumatı yoxdur.
            </div>
          ) : (
            <>
              <div className="mb-6 grid gap-4 md:grid-cols-3">
                {entries.slice(0, 3).map((item: any, index: number) => {
                  const profile = item.profile
                  const displayName = profile?.full_name || profile?.username || 'User'
                  const username = profile?.username || 'username'
                  const avatarUrl = profile?.avatar_url || ''
                  const avatarLetter = username.charAt(0).toUpperCase()

                  const placeStyles =
                    index === 0
                      ? 'border-yellow-400/30 bg-yellow-500/10'
                      : index === 1
                      ? 'border-zinc-300/20 bg-zinc-400/10'
                      : 'border-amber-600/30 bg-amber-700/10'

                  return (
                    <div
                      key={item.user_id}
                      className={`rounded-[28px] border p-5 backdrop-blur-xl ${placeStyles}`}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-medium text-zinc-300">
                          {item.global_points} xal
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 overflow-hidden rounded-full border border-white/10 bg-white/5">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-cyan-300">
                              {avatarLetter}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-lg font-semibold text-white">{displayName}</p>
                          <p className="truncate text-sm text-zinc-400">@{username}</p>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                          <p className="text-zinc-400">Qələbə</p>
                          <p className="mt-1 font-semibold text-white">{item.wins_total}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                          <p className="text-zinc-400">Bərabərlik</p>
                          <p className="mt-1 font-semibold text-white">{item.draws_total}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/5 text-left text-zinc-300">
                    <tr>
                      <th className="p-4">#</th>
                      <th className="p-4">İstifadəçi</th>
                      <th className="p-4">Qələbə</th>
                      <th className="p-4">Bərabərlik</th>
                      <th className="p-4">Playoff</th>
                      <th className="p-4">Final</th>
                      <th className="p-4">Xal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {entries.map((item: any, index: number) => {
                      const profile = item.profile
                      const displayName = profile?.full_name || profile?.username || 'User'
                      const username = profile?.username || 'username'
                      const avatarUrl = profile?.avatar_url || ''
                      const avatarLetter = username.charAt(0).toUpperCase()

                      return (
                        <tr key={item.user_id} className="border-t border-white/10">
                          <td className="p-4 font-semibold text-cyan-300">{index + 1}</td>

                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-11 w-11 overflow-hidden rounded-full border border-white/10 bg-white/5">
                                {avatarUrl ? (
                                  <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-cyan-300">
                                    {avatarLetter}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate font-medium text-white">{displayName}</div>
                                <div className="truncate text-xs text-zinc-500">@{username}</div>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 text-zinc-200">{item.wins_total}</td>
                          <td className="p-4 text-zinc-200">{item.draws_total}</td>
                          <td className="p-4 text-zinc-200">{item.playoff_qualifications_total}</td>
                          <td className="p-4 text-zinc-200">{item.final_appearances_total}</td>
                          <td className="p-4 font-bold text-white">{item.global_points}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
