import { createClient } from '@/lib/supabase/server'

const MEDAL = ['🥇', '🥈', '🥉']
const RANK_STYLES = [
  'border-yellow-400/25 bg-gradient-to-b from-yellow-500/10 to-yellow-500/5',
  'border-zinc-400/20 bg-gradient-to-b from-zinc-400/8 to-zinc-400/3',
  'border-amber-600/25 bg-gradient-to-b from-amber-700/10 to-amber-700/5',
]

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')

  const { data: leaderboardEntries, error: leaderboardError } = await supabase
    .from('global_leaderboard')
    .select('id, user_id, wins_total, draws_total, playoff_qualifications_total, final_appearances_total, global_points')

  const error = profilesError || leaderboardError
  const leaderboardMap = new Map((leaderboardEntries || []).map((e: any) => [e.user_id, e]))

  const entries = (profiles || [])
    .map((profile: any) => {
      const entry = leaderboardMap.get(profile.id)
      return {
        user_id: profile.id,
        wins_total: entry?.wins_total ?? 0,
        draws_total: entry?.draws_total ?? 0,
        playoff_qualifications_total: entry?.playoff_qualifications_total ?? 0,
        final_appearances_total: entry?.final_appearances_total ?? 0,
        global_points: entry?.global_points ?? 0,
        profile,
      }
    })
    .sort((a, b) => {
      if (b.global_points !== a.global_points) return b.global_points - a.global_points
      const nameA = (a.profile?.full_name || a.profile?.username || '').toLowerCase()
      const nameB = (b.profile?.full_name || b.profile?.username || '').toLowerCase()
      return nameA.localeCompare(nameB, 'az')
    })
    .slice(0, 20)

  return (
    <main className="min-h-screen px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-7 backdrop-blur-xl sm:p-10">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-600/5" />
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">Ranking</p>
          <h1 className="text-4xl font-bold sm:text-6xl" style={{ fontFamily: 'var(--font-syne)' }}>
            Ümumi Leaderboard
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
            Bütün turnirlər üzrə ümumi nəticələr.{' '}
            <span className="text-zinc-300">Qələbə = 3 xal</span>,{' '}
            <span className="text-zinc-300">bərabərlik = 1 xal</span>,{' '}
            <span className="text-zinc-300">playoff = +2 xal</span>,{' '}
            <span className="text-zinc-300">final = +4 xal</span>.
          </p>
        </section>

        <div className="mt-8">
          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/8 p-4 text-sm text-red-300">
              Xəta: {error.message}
            </div>
          )}

          {!entries?.length ? (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 text-zinc-400">
              Hələ ümumi leaderboard məlumatı yoxdur.
            </div>
          ) : (
            <>
              {/* Top 3 */}
              <div className="mb-6 grid gap-4 md:grid-cols-3">
                {entries.slice(0, 3).map((item: any, index: number) => {
                  const profile = item.profile
                  const displayName = profile?.full_name || profile?.username || 'User'
                  const username = profile?.username || 'username'
                  const avatarUrl = profile?.avatar_url || ''
                  const avatarLetter = username.charAt(0).toUpperCase()

                  return (
                    <div key={item.user_id}
                      className={`relative overflow-hidden rounded-[24px] border p-5 backdrop-blur-xl transition-transform hover:scale-[1.01] ${RANK_STYLES[index]}`}>
                      <div className="mb-5 flex items-center justify-between">
                        <span className="text-2xl">{MEDAL[index]}</span>
                        <span className="rounded-full border border-white/[0.1] bg-black/30 px-3 py-1 text-xs font-bold text-white">
                          {item.global_points} xal
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-2 border-white/20 bg-white/5">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-cyan-300">
                              {avatarLetter}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white" style={{ fontFamily: 'var(--font-syne)' }}>
                            {displayName}
                          </p>
                          <p className="truncate text-xs text-zinc-500">@{username}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-xl border border-white/[0.07] bg-black/25 px-3 py-2.5">
                          <p className="text-[11px] text-zinc-500">Qələbə</p>
                          <p className="mt-0.5 font-bold text-white">{item.wins_total}</p>
                        </div>
                        <div className="rounded-xl border border-white/[0.07] bg-black/25 px-3 py-2.5">
                          <p className="text-[11px] text-zinc-500">Bərabərlik</p>
                          <p className="mt-0.5 font-bold text-white">{item.draws_total}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.07]">
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">#</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">İstifadəçi</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Qələbə</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Bərabərlik</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Playoff</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Final</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Xal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((item: any, index: number) => {
                        const profile = item.profile
                        const displayName = profile?.full_name || profile?.username || 'User'
                        const username = profile?.username || 'username'
                        const avatarUrl = profile?.avatar_url || ''
                        const avatarLetter = username.charAt(0).toUpperCase()
                        const isTop3 = index < 3

                        return (
                          <tr key={item.user_id}
                            className={`border-b border-white/[0.05] transition-colors hover:bg-white/[0.03] ${isTop3 ? 'bg-white/[0.01]' : ''}`}>
                            <td className="px-5 py-4">
                              <span className={`text-sm font-bold ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-zinc-300' : index === 2 ? 'text-amber-500' : 'text-zinc-600'}`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-white/[0.12] bg-white/[0.05]">
                                  {avatarUrl ? (
                                    <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-cyan-300">
                                      {avatarLetter}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium text-white">{displayName}</div>
                                  <div className="truncate text-xs text-zinc-600">@{username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-zinc-300">{item.wins_total}</td>
                            <td className="px-5 py-4 text-zinc-300">{item.draws_total}</td>
                            <td className="px-5 py-4 text-zinc-300">{item.playoff_qualifications_total}</td>
                            <td className="px-5 py-4 text-zinc-300">{item.final_appearances_total}</td>
                            <td className="px-5 py-4">
                              <span className="font-bold text-white">{item.global_points}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
