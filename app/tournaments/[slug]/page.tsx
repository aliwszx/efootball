import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { joinTournament } from '@/app/actions/tournaments'

type TournamentDetailPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ success?: string; tab?: string }>
}

// ─── Mövqe rəngi: 1-8 → birbaşa R16, 9-24 → playoff, 25+ → çıxır ──────────
function getRankStyle(rank: number, total: number) {
  if (rank <= 8)  return { dot: 'bg-emerald-500', label: 'R16', labelClass: 'text-emerald-400' }
  if (rank <= 24) return { dot: 'bg-amber-500',   label: 'PO',  labelClass: 'text-amber-400'   }
  return          { dot: 'bg-red-600',             label: '—',   labelClass: 'text-red-500'     }
}

const STAGE_LABELS: Record<string, string> = {
  registration: 'Qeydiyyat',
  league:       'Liqa mərhələsi',
  playoff:      'Play-off',
  round_of_16:  '1/8 Final',
  quarterfinal: '1/4 Final',
  semifinal:    'Yarımfinal',
  final:        'Final',
  finished:     'Tamamlandı',
}

export default async function TournamentDetailPage({
  params,
  searchParams,
}: TournamentDetailPageProps) {
  const { slug }    = await params
  const { success, tab } = await searchParams
  const supabase    = await createClient()
  const activeTab   = tab ?? 'info'

  const { data: { user } } = await supabase.auth.getUser()

  // ── Turnir ──────────────────────────────────────────────────────────────────
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('slug', slug)
    .single()

  if (tournamentError || !tournament) notFound()

  const isOngoing   = tournament.status === 'ongoing' || tournament.status === 'completed'
  const isLeague    = tournament.competition_stage === 'league' || isOngoing

  // ── Qeydiyyat məlumatları ────────────────────────────────────────────────────
  let alreadyJoined     = false
  let registrationStatus: string | null = null

  const { count } = await supabase
    .from('tournament_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournament.id)
    .eq('registration_status', 'confirmed')
  const confirmedCount = count || 0

  const { data: players } = await supabase
    .from('tournament_registrations')
    .select('id, registration_status, profiles(id, username)')
    .eq('tournament_id', tournament.id)
    .eq('registration_status', 'confirmed')

  if (user) {
    const { data: registration } = await supabase
      .from('tournament_registrations')
      .select('id, registration_status')
      .eq('tournament_id', tournament.id)
      .eq('user_id', user.id)
      .neq('registration_status', 'cancelled')
      .maybeSingle()
    alreadyJoined      = !!registration
    registrationStatus = registration?.registration_status || null
  }

  const isFull        = confirmedCount >= tournament.max_players
  const deadlinePassed = new Date(tournament.registration_deadline) < new Date()
  const canJoin       = !!user && tournament.status === 'open' && !alreadyJoined && !isFull && !deadlinePassed

  // ── STANDINGS ────────────────────────────────────────────────────────────────
  // tournament_standings JOIN tournament_participants JOIN profiles
  const { data: standingsRaw } = isOngoing ? await supabase
    .from('tournament_standings')
    .select(`
      id,
      participant_id,
      played,
      wins,
      draws,
      losses,
      goals_for,
      goals_against,
      goal_difference,
      points,
      rank,
      tournament_participants (
        id,
        user_id,
        profiles (
          id,
          username
        )
      )
    `)
    .eq('tournament_id', tournament.id)
    .order('rank', { ascending: true })
    : { data: null }

  const standings = (standingsRaw || []).map((s: any) => {
    const participant = Array.isArray(s.tournament_participants)
      ? s.tournament_participants[0]
      : s.tournament_participants
    const profile = participant
      ? (Array.isArray(participant.profiles) ? participant.profiles[0] : participant.profiles)
      : null
    return {
      ...s,
      username: profile?.username ?? '—',
    }
  })

  // ── FİKSTÜRLƏR ──────────────────────────────────────────────────────────────
  // league_matches JOIN ev/səfər iştirakçıları + usernames
  const { data: matchesRaw } = isOngoing ? await supabase
    .from('league_matches')
    .select(`
      id,
      round_no,
      match_status,
      home_score,
      away_score,
      home_participant_id,
      away_participant_id,
      home:tournament_participants!league_matches_home_participant_id_fkey (
        id,
        profiles ( username )
      ),
      away:tournament_participants!league_matches_away_participant_id_fkey (
        id,
        profiles ( username )
      )
    `)
    .eq('tournament_id', tournament.id)
    .order('round_no', { ascending: true })
    : { data: null }

  // Turları qruplaşdır
  const roundsMap = new Map<number, any[]>()
  for (const m of matchesRaw || []) {
    const rn = m.round_no ?? 1
    if (!roundsMap.has(rn)) roundsMap.set(rn, [])
    roundsMap.get(rn)!.push(m)
  }
  const rounds = Array.from(roundsMap.entries()).sort((a, b) => a[0] - b[0])

  const getUsername = (participant: any) => {
    if (!participant) return '?'
    const p = Array.isArray(participant) ? participant[0] : participant
    const prof = Array.isArray(p?.profiles) ? p.profiles[0] : p?.profiles
    return prof?.username ?? '?'
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':           return { text: 'Gözlənilir', cls: 'text-zinc-400' }
      case 'awaiting_confirmation': return { text: 'Təsdiq gözlənilir', cls: 'text-amber-400' }
      case 'disputed':            return { text: 'Mübahisəli', cls: 'text-red-400' }
      case 'completed':           return { text: 'Tamamlandı', cls: 'text-emerald-400' }
      default:                    return { text: status, cls: 'text-zinc-400' }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

      {/* Başlıq + status */}
      <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="rounded-full border border-[#C50337]/20 bg-[#C50337]/10 px-4 py-1 text-sm text-[#ff4d6d]">
          {tournament.platform}
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-zinc-300">
          {tournament.format}
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-zinc-300">
          {STAGE_LABELS[tournament.competition_stage] ?? tournament.competition_stage}
        </span>
        {tournament.status === 'ongoing' && (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-sm text-emerald-400">
            🟢 Davam edir
          </span>
        )}
        {tournament.status === 'completed' && (
          <span className="rounded-full border border-zinc-500/30 bg-zinc-500/10 px-4 py-1 text-sm text-zinc-400">
            Tamamlandı
          </span>
        )}
      </div>

      <h1 className="mb-2 text-3xl font-bold sm:text-5xl">{tournament.title}</h1>
      <p className="mb-8 max-w-3xl text-zinc-400">
        {tournament.description || 'Bu turnir üçün həyəcanlı rəqabət və premium iştirak təcrübəsi.'}
      </p>

      {/* Stat kartları */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-zinc-400">Entry Fee</p>
          <p className="mt-2 text-2xl font-semibold">{tournament.entry_fee} AZN</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-zinc-400">Prize Pool</p>
          <p className="mt-2 text-2xl font-semibold">{tournament.prize_amount} AZN</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-zinc-400">İştirakçılar</p>
          <p className="mt-2 text-2xl font-semibold">{confirmedCount}/{tournament.max_players}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-zinc-400">Hər oyunçu</p>
          <p className="mt-2 text-2xl font-semibold">{tournament.league_match_count ?? 8} matç</p>
        </div>
      </div>

      {/* ── TAB NAVİQASİYA ── */}
      {isOngoing && (
        <div className="mb-6 flex gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
          {[
            { key: 'standings', label: '🏆 Cədvəl' },
            { key: 'fixtures',  label: '📅 Fikstürlər' },
            { key: 'info',      label: 'ℹ️ Məlumat' },
          ].map(({ key, label }) => (
            <a
              key={key}
              href={`?tab=${key}`}
              className={`flex-1 rounded-xl px-4 py-2 text-center text-sm font-medium transition ${
                activeTab === key
                  ? 'bg-[#C50337] text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {label}
            </a>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:gap-8">
        {/* ── SOL PANEL ── */}
        <div className="space-y-8">

          {/* ══ STANDINGS TAB ══ */}
          {(activeTab === 'standings' || !isOngoing) && isOngoing && (
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 sm:rounded-[32px] sm:p-8">
              <h2 className="mb-1 text-2xl font-bold">Cədvəl</h2>
              <p className="mb-5 text-sm text-zinc-500">
                1–8 → birbaşa 1/8 Final &nbsp;|&nbsp; 9–24 → Play-off &nbsp;|&nbsp; 25+ → çıxır
              </p>

              {standings.length === 0 ? (
                <p className="text-sm text-zinc-400">Hələ cədvəl məlumatı yoxdur.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-xs text-zinc-500">
                        <th className="pb-3 pr-3 font-medium">#</th>
                        <th className="pb-3 pr-3 font-medium">Oyunçu</th>
                        <th className="pb-3 pr-3 text-center font-medium">O</th>
                        <th className="pb-3 pr-3 text-center font-medium">Q</th>
                        <th className="pb-3 pr-3 text-center font-medium">H</th>
                        <th className="pb-3 pr-3 text-center font-medium">M</th>
                        <th className="pb-3 pr-3 text-center font-medium">QF</th>
                        <th className="pb-3 pr-3 text-center font-medium">GF</th>
                        <th className="pb-3 font-medium text-center text-white">Xal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((row: any, idx: number) => {
                        const rank  = row.rank ?? idx + 1
                        const style = getRankStyle(rank, standings.length)
                        const isMe  = false // İstəsən user participant_id ilə müqayisə edə bilərsən
                        return (
                          <tr
                            key={row.id}
                            className={`border-b border-white/5 transition ${
                              rank <= 8  ? 'hover:bg-emerald-500/5' :
                              rank <= 24 ? 'hover:bg-amber-500/5'   :
                                           'hover:bg-red-500/5'
                            }`}
                          >
                            {/* Sıra + rəng nöqtəsi */}
                            <td className="py-3 pr-3">
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                                <span className="font-semibold text-white">{rank}</span>
                              </div>
                            </td>
                            {/* Oyunçu adı + qurşaq etiketi */}
                            <td className="py-3 pr-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">{row.username}</span>
                                <span className={`text-xs ${style.labelClass}`}>{style.label}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-3 text-center text-zinc-300">{row.played}</td>
                            <td className="py-3 pr-3 text-center text-emerald-400">{row.wins}</td>
                            <td className="py-3 pr-3 text-center text-zinc-300">{row.draws}</td>
                            <td className="py-3 pr-3 text-center text-red-400">{row.losses}</td>
                            <td className="py-3 pr-3 text-center text-zinc-300">
                              {row.goals_for}:{row.goals_against}
                            </td>
                            <td className="py-3 pr-3 text-center text-zinc-300">
                              {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
                            </td>
                            <td className="py-3 text-center text-lg font-bold text-white">
                              {row.points}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* İzahat */}
              <div className="mt-5 flex flex-wrap gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />1–8: 1/8 Finala birbaşa</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" />9–24: Play-off</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-600" />25+: Çıxır</span>
                <span className="ml-auto">O=Oyun  Q=Qələbə  H=Heç  M=Məğlubiyyət  QF=Qol fərqi</span>
              </div>
            </div>
          )}

          {/* ══ FİKSTÜRLƏR TAB ══ */}
          {activeTab === 'fixtures' && isOngoing && (
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 sm:rounded-[32px] sm:p-8">
              <h2 className="mb-6 text-2xl font-bold">Fikstürlər</h2>

              {rounds.length === 0 ? (
                <p className="text-sm text-zinc-400">Fikstürlər hələ generate edilməyib.</p>
              ) : (
                <div className="space-y-8">
                  {rounds.map(([roundNo, matches]) => (
                    <div key={roundNo}>
                      <h3 className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-zinc-500">
                        <span className="flex-1 border-t border-white/10" />
                        Tur {roundNo}
                        <span className="flex-1 border-t border-white/10" />
                      </h3>
                      <div className="space-y-2">
                        {matches.map((m: any) => {
                          const sl    = statusLabel(m.match_status)
                          const done  = m.match_status === 'completed'
                          return (
                            <a
                              key={m.id}
                              href={`/matches/${m.id}`}
                              className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-5 py-3 transition hover:border-white/20 hover:bg-white/5"
                            >
                              {/* Ev sahibi */}
                              <span className="w-32 truncate text-right text-sm font-medium text-white sm:w-44">
                                {getUsername(m.home)}
                              </span>

                              {/* Skor / status */}
                              <div className="mx-4 flex min-w-[80px] flex-col items-center gap-0.5">
                                {done ? (
                                  <span className="text-lg font-bold text-white">
                                    {m.home_score} – {m.away_score}
                                  </span>
                                ) : (
                                  <span className="text-xs font-semibold text-zinc-500">vs</span>
                                )}
                                <span className={`text-xs ${sl.cls}`}>{sl.text}</span>
                              </div>

                              {/* Səfər */}
                              <span className="w-32 truncate text-left text-sm font-medium text-white sm:w-44">
                                {getUsername(m.away)}
                              </span>
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ INFO TAB (turnir başlamadan əvvəl həmişə, sonra tab seçimlə) ══ */}
          {(activeTab === 'info' || !isOngoing) && (
            <>
              {/* Qoşulanlar */}
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 sm:rounded-[32px] sm:p-8">
                <h2 className="mb-4 text-2xl font-semibold">Qoşulanlar</h2>
                {players && players.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {players.map((player: any, index: number) => {
                      const profile = Array.isArray(player.profiles) ? player.profiles[0] : player.profiles
                      return (
                        <div
                          key={player.id}
                          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C50337]/10 text-xs font-bold text-[#ff4d6d]">
                            {index + 1}
                          </div>
                          <span className="text-sm">{profile?.username || 'user'}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">Hələ qoşulan yoxdur.</p>
                )}
              </div>

              {/* Qaydalar */}
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 sm:rounded-[32px] sm:p-8">
                <h2 className="mb-4 text-2xl font-semibold">Qaydalar</h2>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-zinc-300">
                  <p className="whitespace-pre-line">
                    {tournament.rules || 'Qaydalar tezliklə əlavə olunacaq.'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── SAĞ PANEL ── */}
        <div className="h-fit rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:rounded-[32px] sm:p-6">
          <h2 className="text-2xl font-semibold">Turnir məlumatı</h2>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-zinc-400">Başlama vaxtı</p>
              <p className="mt-1 font-medium">{new Date(tournament.start_time).toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-zinc-400">Qeydiyyat deadline</p>
              <p className="mt-1 font-medium">{new Date(tournament.registration_deadline).toLocaleString()}</p>
            </div>
          </div>

          {/* Mərhələ prosess barı */}
          {isOngoing && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="mb-3 text-sm text-zinc-400">Mərhələ</p>
              <div className="space-y-2">
                {(['league', 'playoff', 'round_of_16', 'quarterfinal', 'semifinal', 'final'] as const).map((stage) => {
                  const stageOrder = ['league', 'playoff', 'round_of_16', 'quarterfinal', 'semifinal', 'final']
                  const currentIdx = stageOrder.indexOf(tournament.competition_stage)
                  const thisIdx    = stageOrder.indexOf(stage)
                  const isDone     = thisIdx < currentIdx
                  const isCurrent  = thisIdx === currentIdx
                  return (
                    <div key={stage} className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${isDone ? 'bg-emerald-500' : isCurrent ? 'bg-[#C50337]' : 'bg-zinc-700'}`} />
                      <span className={`text-xs ${isCurrent ? 'font-semibold text-white' : isDone ? 'text-emerald-500' : 'text-zinc-600'}`}>
                        {STAGE_LABELS[stage]}
                      </span>
                      {isCurrent && <span className="ml-auto text-xs text-[#ff4d6d]">← İndi</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-6 space-y-3">
            {success === 'joined_pending' && (
              <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
                <p className="text-sm font-semibold text-amber-300">⏳ Qeydiyyatın qəbul edildi!</p>
                <p className="mt-1 text-xs text-amber-400/80">
                  Ödənişin admin tərəfindən təsdiqlənməsini gözlə.
                </p>
              </div>
            )}

            {!user && (
              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-4 text-yellow-200">
                Turnirə qoşulmaq üçün əvvəl login olmalısan.
              </div>
            )}

            {user && alreadyJoined && registrationStatus === 'pending' && success !== 'joined_pending' && (
              <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
                <p className="text-sm font-semibold text-amber-300">⏳ Ödəniş gözlənilir</p>
                <p className="mt-1 text-xs text-amber-400/80">Admin ödənişini təsdiq etməsini gözlə.</p>
              </div>
            )}

            {user && alreadyJoined && registrationStatus === 'confirmed' && (
              <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4">
                <p className="text-sm font-semibold text-emerald-300">✓ Turnirdə iştirak edirsən</p>
                <p className="mt-1 text-xs text-emerald-400/80">Ödənişin təsdiqlənib.</p>
              </div>
            )}

            {user && deadlinePassed && !alreadyJoined && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-200">
                Qeydiyyat müddəti bitib.
              </div>
            )}

            {user && isFull && !alreadyJoined && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-200">
                Turnirdə boş yer qalmayıb.
              </div>
            )}

            {user && tournament.status !== 'open' && !alreadyJoined && !isOngoing && (
              <div className="rounded-2xl border border-zinc-400/20 bg-zinc-500/10 p-4 text-zinc-200">
                Bu turnir hazırda qeydiyyata açıq deyil.
              </div>
            )}
          </div>

          {canJoin && (
            <form action={joinTournament} className="mt-6">
              <input type="hidden" name="tournament_id" value={tournament.id} />
              <input type="hidden" name="tournament_slug" value={tournament.slug} />
              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-[#C50337] to-[#8B0224] px-5 py-4 text-base font-semibold text-white transition hover:scale-[1.01] sm:text-lg"
              >
                Turnirə qoşul
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
