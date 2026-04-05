import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { joinTournament } from '@/app/actions/tournaments'

type TournamentDetailPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ success?: string; tab?: string }>
}

function getRankStyle(rank: number, total: number) {
  if (rank <= 8) return { dot: 'bg-emerald-500', label: 'R16', labelClass: 'text-emerald-400' }
  if (rank <= 24) return { dot: 'bg-amber-500', label: 'PO', labelClass: 'text-amber-400' }
  return { dot: 'bg-red-600', label: '—', labelClass: 'text-red-500' }
}

const STAGE_LABELS: Record<string, string> = {
  registration: 'Qeydiyyat',
  league: 'Liqa mərhələsi',
  playoff: 'Play-off',
  round_of_16: '1/8 Final',
  quarterfinal: '1/4 Final',
  semifinal: 'Yarımfinal',
  final: 'Final',
  finished: 'Tamamlandı',
}

function getKnockoutStages(): string[] {
  return ['quarterfinal', 'semifinal', 'final']
}

function getLeagueStages(): string[] {
  return ['league', 'playoff', 'round_of_16', 'quarterfinal', 'semifinal', 'final']
}

function getParticipantUsername(participant: any) {
  if (!participant) return 'TBD'
  const p = Array.isArray(participant) ? participant[0] : participant
  const profile = Array.isArray(p?.profiles) ? p.profiles[0] : p?.profiles
  return profile?.username ?? profile?.full_name ?? 'TBD'
}

function statusLabel(status: string) {
  switch (status) {
    case 'scheduled':
      return { text: 'Gözlənilir', cls: 'text-zinc-400' }
    case 'awaiting_reports':
      return { text: 'Nəticə gözlənilir', cls: 'text-sky-400' }
    case 'awaiting_confirmation':
      return { text: 'Təsdiq gözlənilir', cls: 'text-amber-400' }
    case 'disputed':
      return { text: 'Mübahisəli', cls: 'text-red-400' }
    case 'completed':
      return { text: 'Tamamlandı', cls: 'text-emerald-400' }
    case 'cancelled':
      return { text: 'Ləğv edildi', cls: 'text-zinc-500' }
    default:
      return { text: status, cls: 'text-zinc-400' }
  }
}

function stageTitle(stage: string) {
  return STAGE_LABELS[stage] ?? stage
}

function TieCard({ legs }: { legs: any[] }) {
  // legs: array of knockout_matches with same tie_id, sorted by leg_no
  const sorted = [...legs].sort((a, b) => (a.leg_no ?? 1) - (b.leg_no ?? 1))
  const leg1 = sorted[0]
  const leg2 = sorted[1]

  // Home participant is leg1's home (leg2's away)
  const homeParticipant = leg1?.home_participant
  const awayParticipant = leg1?.away_participant
  const homeName = getParticipantUsername(homeParticipant)
  const awayName = getParticipantUsername(awayParticipant)

  // Aggregate: homeAgg = leg1.home_score + leg2.away_score
  const leg1HomeScore = leg1?.home_score
  const leg1AwayScore = leg1?.away_score
  const leg2HomeScore = leg2?.home_score  // leg2 home = original away player
  const leg2AwayScore = leg2?.away_score  // leg2 away = original home player

  const homeAgg = (leg1HomeScore ?? null) !== null && (leg2AwayScore ?? null) !== null
    ? (leg1HomeScore ?? 0) + (leg2AwayScore ?? 0)
    : null
  const awayAgg = (leg1AwayScore ?? null) !== null && (leg2HomeScore ?? null) !== null
    ? (leg1AwayScore ?? 0) + (leg2HomeScore ?? 0)
    : null

  // Overall winner from tie result (use winner from last completed leg or tie_status)
  const winner = leg2?.winner_participant_id ?? leg1?.winner_participant_id
  const homeWinner = winner && winner === leg1?.home_participant_id
  const awayWinner = winner && winner === leg1?.away_participant_id

  // Overall tie status
  const allCompleted = sorted.every(l => l.match_status === 'completed')
  const anyDisputed = sorted.some(l => l.match_status === 'disputed')
  const tieStatus = anyDisputed ? 'disputed' : allCompleted ? 'completed' : 'scheduled'
  const sl = statusLabel(tieStatus)

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-zinc-500">{stageTitle(leg1?.stage)}</span>
        <span className={`text-xs ${sl.cls}`}>{sl.text}</span>
      </div>

      {/* Home row */}
      <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${homeWinner ? 'border border-emerald-500/30 bg-emerald-500/10' : 'bg-white/5'}`}>
        <span className="truncate pr-3 text-sm text-white">{homeName}</span>
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          {leg2 && (
            <span className="text-xs text-zinc-400 font-normal">
              ({leg1HomeScore ?? '-'} + {leg2AwayScore ?? '-'})
            </span>
          )}
          <span>{homeAgg ?? '-'}</span>
        </div>
      </div>

      {/* Away row */}
      <div className={`mt-2 flex items-center justify-between rounded-xl px-3 py-2 ${awayWinner ? 'border border-emerald-500/30 bg-emerald-500/10' : 'bg-white/5'}`}>
        <span className="truncate pr-3 text-sm text-white">{awayName}</span>
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          {leg2 && (
            <span className="text-xs text-zinc-400 font-normal">
              ({leg1AwayScore ?? '-'} + {leg2HomeScore ?? '-'})
            </span>
          )}
          <span>{awayAgg ?? '-'}</span>
        </div>
      </div>
    </div>
  )
}

function MatchCard({ match }: { match: any }) {
  return <TieCard legs={[match]} />
}

function groupByTie(matches: any[]): any[][] {
  const tieMap = new Map<string, any[]>()
  for (const m of matches) {
    const key = m.tie_id ?? m.id
    if (!tieMap.has(key)) tieMap.set(key, [])
    tieMap.get(key)!.push(m)
  }
  return Array.from(tieMap.values())
}

function KnockoutBracket({ matches }: { matches: any[] }) {
  const quarterfinalTies = groupByTie(matches.filter((m) => m.stage === 'quarterfinal'))
  const semifinalTies = groupByTie(matches.filter((m) => m.stage === 'semifinal'))
  const finalTies = groupByTie(matches.filter((m) => m.stage === 'final'))

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 sm:rounded-[32px] sm:p-8">
      <h2 className="mb-1 text-2xl font-bold">Bracket</h2>
      <p className="mb-5 text-sm text-zinc-500">
        8 nəfərlik knockout mərhələ görünüşü
      </p>

      <div className="grid gap-6 xl:grid-cols-3">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-500">
            1/4 Final
          </h3>
          <div className="space-y-3">
            {quarterfinalTies.length > 0 ? (
              quarterfinalTies.map((legs) => <TieCard key={legs[0].tie_id ?? legs[0].id} legs={legs} />)
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                Hələ 1/4 final matçları yoxdur.
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-500">
            Yarımfinal
          </h3>
          <div className="space-y-3">
            {semifinalTies.length > 0 ? (
              semifinalTies.map((legs) => <TieCard key={legs[0].tie_id ?? legs[0].id} legs={legs} />)
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                Hələ yarımfinal matçları yoxdur.
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-500">
            Final
          </h3>
          <div className="space-y-3">
            {finalTies.length > 0 ? (
              finalTies.map((legs) => <TieCard key={legs[0].tie_id ?? legs[0].id} legs={legs} />)
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                Hələ final matçı yoxdur.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function TournamentDetailPage({
  params,
  searchParams,
}: TournamentDetailPageProps) {
  const { slug } = await params
  const { success, tab } = await searchParams
  const supabase = await createClient()
  const activeTab = tab ?? 'info'

  const { data: { user } } = await supabase.auth.getUser()

  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('slug', slug)
    .single()

  if (tournamentError || !tournament) notFound()

  const isKnockout8 =
    tournament.tournament_type === 'knockout_8' ||
    tournament.participant_limit === 8

  const isOngoing = tournament.status === 'ongoing' || tournament.status === 'completed'
  const standingsTabLabel = isKnockout8 ? 'Bracket' : 'Cədvəl'
  const stageOrder = isKnockout8 ? getKnockoutStages() : getLeagueStages()

  let alreadyJoined = false
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

    alreadyJoined = !!registration
    registrationStatus = registration?.registration_status || null
  }

  const isFull = confirmedCount >= tournament.max_players
  const deadlinePassed = new Date(tournament.registration_deadline) < new Date()
  const canJoin = !!user && tournament.status === 'open' && !alreadyJoined && !isFull && !deadlinePassed

  const { data: standingsRaw } = isOngoing && !isKnockout8
    ? await supabase
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

  const { data: matchesRaw } = isOngoing && !isKnockout8
    ? await supabase
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

  const { data: knockoutMatchesRaw } = isOngoing && isKnockout8
    ? await supabase
        .from('knockout_matches')
        .select(`
          id,
          tie_id,
          stage,
          leg_no,
          match_status,
          home_score,
          away_score,
          home_participant_id,
          away_participant_id,
          winner_participant_id,
          created_at,
          home_participant:tournament_participants!knockout_matches_home_participant_id_fkey (
            id,
            user_id,
            profiles ( id, username, full_name )
          ),
          away_participant:tournament_participants!knockout_matches_away_participant_id_fkey (
            id,
            user_id,
            profiles ( id, username, full_name )
          )
        `)
        .eq('tournament_id', tournament.id)
        .in('stage', ['quarterfinal', 'semifinal', 'final'])
        .order('created_at', { ascending: true })
    : { data: null }

  const roundsMap = new Map<number, any[]>()

  for (const m of matchesRaw || []) {
    const rn = m.round_no ?? 1
    if (!roundsMap.has(rn)) roundsMap.set(rn, [])
    roundsMap.get(rn)!.push(m)
  }

  const rounds = Array.from(roundsMap.entries()).sort((a, b) => a[0] - b[0])

  const knockoutFixturesByStage = (knockoutMatchesRaw || []).reduce((acc: Record<string, any[]>, match: any) => {
    if (!acc[match.stage]) acc[match.stage] = []
    acc[match.stage].push(match)
    return acc
  }, {})

  const knockoutStageList = ['quarterfinal', 'semifinal', 'final'].filter(
    (stage) => (knockoutFixturesByStage[stage] || []).length > 0
  )

  const perPlayerMatchesText = isKnockout8
    ? 'maksimum 3 matç'
    : `${tournament.league_match_count ?? 8} matç`

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
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
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Davam edir
            </span>
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
          <p className="mt-2 text-2xl font-semibold">{perPlayerMatchesText}</p>
        </div>
      </div>

      {isOngoing && (
        <div className="mb-6 flex gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
          {[
            {
              key: 'standings',
              label: standingsTabLabel,
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                </svg>
              ),
            },
            {
              key: 'fixtures',
              label: 'Fikstürlər',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              ),
            },
            {
              key: 'info',
              label: 'Məlumat',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              ),
            },
          ].map(({ key, label, icon }) => (
            <a
              key={key}
              href={`?tab=${key}`}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === key ? 'bg-[#C50337] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {icon}
              {label}
            </a>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:gap-8">
        <div className="space-y-8">
          {(activeTab === 'standings' || !isOngoing) && isOngoing && (
            <>
              {isKnockout8 ? (
                <KnockoutBracket matches={knockoutMatchesRaw || []} />
              ) : (
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
                            <th className="pb-3 pr-3 text-center font-medium">Qol</th>
                            <th className="pb-3 pr-3 text-center font-medium">QF</th>
                            <th className="pb-3 text-center font-medium text-white">Xal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standings.map((row: any, idx: number) => {
                            const rank = row.rank ?? idx + 1
                            const style = getRankStyle(rank, standings.length)

                            return (
                              <tr
                                key={row.id}
                                className={`border-b border-white/5 transition ${
                                  rank <= 8
                                    ? 'hover:bg-emerald-500/5'
                                    : rank <= 24
                                      ? 'hover:bg-amber-500/5'
                                      : 'hover:bg-red-500/5'
                                }`}
                              >
                                <td className="py-3 pr-3">
                                  <div className="flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                                    <span className="font-semibold text-white">{rank}</span>
                                  </div>
                                </td>
                                <td className="py-3 pr-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-white">{row.username}</span>
                                    <span
                                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${
                                        style.label === 'R16'
                                          ? 'bg-emerald-500/15 text-emerald-400'
                                          : style.label === 'PO'
                                            ? 'bg-amber-500/15 text-amber-400'
                                            : 'bg-red-500/15 text-red-400'
                                      }`}
                                    >
                                      {style.label}
                                    </span>
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

                  <div className="mt-5 flex flex-wrap gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      1–8: 1/8 Finala birbaşa
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      9–24: Play-off
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-600" />
                      25+: Çıxır
                    </span>
                    <span className="ml-auto">
                      O=Oyun Q=Qələbə H=Heç M=Məğlubiyyət Qol=Vurulmuş:Buraxılmış QF=Qol fərqi
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'fixtures' && isOngoing && (
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 sm:rounded-[32px] sm:p-8">
              <h2 className="mb-6 text-2xl font-bold">Fikstürlər</h2>

              {!isKnockout8 && rounds.length === 0 && (
                <p className="text-sm text-zinc-400">Fikstürlər hələ generate edilməyib.</p>
              )}

              {isKnockout8 && knockoutStageList.length === 0 && (
                <p className="text-sm text-zinc-400">Bracket matçları hələ generate edilməyib.</p>
              )}

              {!isKnockout8 && rounds.length > 0 && (
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
                          const sl = statusLabel(m.match_status)
                          const done = m.match_status === 'completed'

                          return (
                            <a
                              key={m.id}
                              href={`/matches/${m.id}`}
                              className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-5 py-3 transition hover:border-white/20 hover:bg-white/5"
                            >
                              <span className="w-32 truncate text-right text-sm font-medium text-white sm:w-44">
                                {getParticipantUsername(m.home)}
                              </span>

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

                              <span className="w-32 truncate text-left text-sm font-medium text-white sm:w-44">
                                {getParticipantUsername(m.away)}
                              </span>
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isKnockout8 && knockoutStageList.length > 0 && (
                <div className="space-y-8">
                  {knockoutStageList.map((stage) => (
                    <div key={stage}>
                      <h3 className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-zinc-500">
                        <span className="flex-1 border-t border-white/10" />
                        {stageTitle(stage)}
                        <span className="flex-1 border-t border-white/10" />
                      </h3>

                      <div className="space-y-2">
                        {(knockoutFixturesByStage[stage] || []).map((m: any) => {
                          const sl = statusLabel(m.match_status)
                          const done = m.match_status === 'completed'

                          return (
                            <a
                              key={m.id}
                              href={`/matches/${m.id}`}
                              className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-5 py-3 transition hover:border-white/20 hover:bg-white/5"
                            >
                              <span className="w-32 truncate text-right text-sm font-medium text-white sm:w-44">
                                {getParticipantUsername(m.home_participant)}
                              </span>

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

                              <span className="w-32 truncate text-left text-sm font-medium text-white sm:w-44">
                                {getParticipantUsername(m.away_participant)}
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

          {(activeTab === 'info' || !isOngoing) && (
            <>
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

          {isOngoing && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="mb-3 text-sm text-zinc-400">Mərhələ</p>
              <div className="space-y-2">
                {stageOrder.map((stage: string) => {
  const currentIdx = stageOrder.indexOf(tournament.competition_stage as string)
  const thisIdx = stageOrder.indexOf(stage)
                  const isDone = currentIdx !== -1 && thisIdx < currentIdx
                  const isCurrent = thisIdx === currentIdx

                  return (
                    <div key={stage} className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isDone ? 'bg-emerald-500' : isCurrent ? 'bg-[#C50337]' : 'bg-zinc-700'
                        }`}
                      />
                      <span
                        className={`text-xs ${
                          isCurrent
                            ? 'font-semibold text-white'
                            : isDone
                              ? 'text-emerald-500'
                              : 'text-zinc-600'
                        }`}
                      >
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
                <p className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Qeydiyyatın qəbul edildi!
                </p>
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
                <p className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Ödəniş gözlənilir
                </p>
                <p className="mt-1 text-xs text-amber-400/80">
                  Admin ödənişini təsdiq etməsini gözlə.
                </p>
              </div>
            )}

            {user && alreadyJoined && registrationStatus === 'confirmed' && (
              <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  Turnirdə iştirak edirsən
                </p>
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
