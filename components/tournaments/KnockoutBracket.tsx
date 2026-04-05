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

function MatchCard({ match }: { match: KnockoutMatch }) {
  const homeName = getPlayerName(match.home_participant)
  const awayName = getPlayerName(match.away_participant)

  const homeWinner = match.winner_participant_id === match.home_participant_id
  const awayWinner = match.winner_participant_id === match.away_participant_id

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-sm backdrop-blur">
      <div className="mb-2 text-xs text-white/50">
        Matç #{match.leg_no || 1}
      </div>

      <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${homeWinner ? 'bg-emerald-500/15 border border-emerald-400/30' : 'bg-white/5'}`}>
        <span className="truncate pr-3">{homeName}</span>
        <span className="font-semibold">
          {match.home_score ?? '-'}
        </span>
      </div>

      <div className={`mt-2 flex items-center justify-between rounded-xl px-3 py-2 ${awayWinner ? 'bg-emerald-500/15 border border-emerald-400/30' : 'bg-white/5'}`}>
        <span className="truncate pr-3">{awayName}</span>
        <span className="font-semibold">
          {match.away_score ?? '-'}
        </span>
      </div>

      <div className="mt-2 text-[11px] text-white/45">
        Status: {match.match_status}
      </div>
    </div>
  )
}

export default function KnockoutBracket({ matches }: Props) {
  const quarterfinals = matches.filter((m) => m.stage === 'quarterfinal')
  const semifinals = matches.filter((m) => m.stage === 'semifinal')
  const finals = matches.filter((m) => m.stage === 'final')

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
            {quarterfinals.length > 0 ? (
              quarterfinals.map((match) => (
                <MatchCard key={match.id} match={match} />
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
            {semifinals.length > 0 ? (
              semifinals.map((match) => (
                <MatchCard key={match.id} match={match} />
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
            {finals.length > 0 ? (
              finals.map((match) => (
                <MatchCard key={match.id} match={match} />
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
