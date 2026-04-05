'use client'

type Participant = {
  id: string
  user_id?: string
  profiles?: {
    username?: string | null
    full_name?: string | null
  } | null
}

type KnockoutMatch = {
  id: string
  tie_id?: string
  stage: 'playoff' | 'round_of_16' | 'quarterfinal' | 'semifinal' | 'final'
  leg_no: number
  home_score: number | null
  away_score: number | null
  match_status: string
  home_participant_id: string
  away_participant_id: string
  winner_participant_id: string | null
  home_participant?: Participant | null
  away_participant?: Participant | null
}

type Props = {
  matches: KnockoutMatch[]
}

function getPlayerName(p?: Participant | null) {
  if (!p) return 'TBD'
  return p.profiles?.username || p.profiles?.full_name || 'Player'
}

function stageTitle(stage: KnockoutMatch['stage']) {
  if (stage === 'quarterfinal') return '1/4 Final'
  if (stage === 'semifinal') return 'Yarımfinal'
  if (stage === 'final') return 'Final'
  if (stage === 'round_of_16') return '1/8 Final'
  if (stage === 'playoff') return 'Play-off'
  return stage
}

function statusLabel(status: string) {
  switch (status) {
    case 'scheduled': return { text: 'Gözlənilir', cls: 'text-zinc-400' }
    case 'awaiting_confirmation': return { text: 'Təsdiq gözləyir', cls: 'text-yellow-400' }
    case 'disputed': return { text: 'Mübahisəli', cls: 'text-red-400' }
    case 'completed': return { text: 'Tamamlandı', cls: 'text-emerald-400' }
    default: return { text: status, cls: 'text-zinc-400' }
  }
}

function groupByTie(matches: KnockoutMatch[]): KnockoutMatch[][] {
  const tieMap = new Map<string, KnockoutMatch[]>()
  for (const m of matches) {
    const key = m.tie_id ?? m.id
    if (!tieMap.has(key)) tieMap.set(key, [])
    tieMap.get(key)!.push(m)
  }
  return Array.from(tieMap.values())
}

function TieCard({ legs }: { legs: KnockoutMatch[] }) {
  const sorted = [...legs].sort((a, b) => (a.leg_no ?? 1) - (b.leg_no ?? 1))
  const leg1 = sorted[0]
  const leg2 = sorted[1]

  const homeName = getPlayerName(leg1?.home_participant)
  const awayName = getPlayerName(leg1?.away_participant)

  // homeAgg = leg1.home_score + leg2.away_score (leg2 home is original away player)
  const l1h = leg1?.home_score
  const l1a = leg1?.away_score
  const l2h = leg2?.home_score
  const l2a = leg2?.away_score

  const homeAgg = l1h !== null && l1h !== undefined && l2a !== null && l2a !== undefined
    ? l1h + l2a : null
  const awayAgg = l1a !== null && l1a !== undefined && l2h !== null && l2h !== undefined
    ? l1a + l2h : null

  const winner = leg2?.winner_participant_id ?? leg1?.winner_participant_id
  const homeWinner = !!winner && winner === leg1?.home_participant_id
  const awayWinner = !!winner && winner === leg1?.away_participant_id

  const allCompleted = sorted.every(l => l.match_status === 'completed')
  const anyDisputed = sorted.some(l => l.match_status === 'disputed')
  const tieStatus = anyDisputed ? 'disputed' : allCompleted ? 'completed' : 'scheduled'
  const sl = statusLabel(tieStatus)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-sm backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-white/50">{stageTitle(leg1?.stage)}</span>
        <span className={`text-xs ${sl.cls}`}>{sl.text}</span>
      </div>

      <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${homeWinner ? 'bg-emerald-500/15 border border-emerald-400/30' : 'bg-white/5'}`}>
        <span className="truncate pr-3 text-sm">{homeName}</span>
        <div className="flex items-center gap-2 text-sm font-semibold">
          {leg2 && (
            <span className="text-xs text-white/40 font-normal">
              ({l1h ?? '-'} + {l2a ?? '-'})
            </span>
          )}
          <span>{homeAgg ?? (l1h ?? '-')}</span>
        </div>
      </div>

      <div className={`mt-2 flex items-center justify-between rounded-xl px-3 py-2 ${awayWinner ? 'bg-emerald-500/15 border border-emerald-400/30' : 'bg-white/5'}`}>
        <span className="truncate pr-3 text-sm">{awayName}</span>
        <div className="flex items-center gap-2 text-sm font-semibold">
          {leg2 && (
            <span className="text-xs text-white/40 font-normal">
              ({l1a ?? '-'} + {l2h ?? '-'})
            </span>
          )}
          <span>{awayAgg ?? (l1a ?? '-')}</span>
        </div>
      </div>
    </div>
  )
}

export default function KnockoutBracket({ matches }: Props) {
  const quarterfinalTies = groupByTie(matches.filter((m) => m.stage === 'quarterfinal'))
  const semifinalTies = groupByTie(matches.filter((m) => m.stage === 'semifinal'))
  const finalTies = groupByTie(matches.filter((m) => m.stage === 'final'))

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Bracket</h2>
        <p className="mt-1 text-sm text-white/55">
          8 nəfərlik knockout turniri üçün mərhələ görünüşü
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div>
          <h3 className="mb-3 text-lg font-semibold text-white">
            {stageTitle('quarterfinal')}
          </h3>
          <div className="space-y-4">
            {quarterfinalTies.length > 0 ? (
              quarterfinalTies.map((legs) => (
                <TieCard key={legs[0].tie_id ?? legs[0].id} legs={legs} />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-white/50">
                Hələ 1/4 final matçları yoxdur.
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-white">
            {stageTitle('semifinal')}
          </h3>
          <div className="space-y-4">
            {semifinalTies.length > 0 ? (
              semifinalTies.map((legs) => (
                <TieCard key={legs[0].tie_id ?? legs[0].id} legs={legs} />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-white/50">
                Hələ yarımfinal matçları yoxdur.
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-white">
            {stageTitle('final')}
          </h3>
          <div className="space-y-4">
            {finalTies.length > 0 ? (
              finalTies.map((legs) => (
                <TieCard key={legs[0].tie_id ?? legs[0].id} legs={legs} />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-white/50">
                Hələ final matçı yoxdur.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
