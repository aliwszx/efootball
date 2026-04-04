import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function statusLabel(status: string) {
  switch (status) {
    case 'awaiting_confirmation':
      return 'Təsdiq gözləyir'
    case 'disputed':
      return 'Mübahisəli'
    case 'completed':
      return 'Tamamlandı'
    case 'cancelled':
      return 'Ləğv edildi'
    default:
      return 'Gözləyir'
  }
}

function statusClass(status: string) {
  switch (status) {
    case 'awaiting_confirmation':
      return 'border-yellow-400/20 bg-yellow-500/10 text-yellow-200'
    case 'disputed':
      return 'border-red-400/20 bg-red-500/10 text-red-200'
    case 'completed':
      return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
    case 'cancelled':
      return 'border-zinc-400/20 bg-zinc-500/10 text-zinc-200'
    default:
      return 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200'
  }
}

export default async function MyMatchesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: myParticipants, error: participantError } = await supabase
    .from('tournament_participants')
    .select('id, tournament_id, user_id')
    .eq('user_id', user.id)

  if (participantError) {
    return (
      <main className="min-h-screen px-4 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-200">
            Xəta: {participantError.message}
          </div>
        </div>
      </main>
    )
  }

  const participantIds = (myParticipants || []).map((item) => item.id)

  if (participantIds.length === 0) {
    return (
      <main className="min-h-screen px-4 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
            <p className="mb-2 text-sm uppercase tracking-[0.2em] text-cyan-300">Matches</p>
            <h1 className="text-3xl font-bold sm:text-5xl">Mənim matçlarım</h1>
            <p className="mt-4 text-zinc-400">
              Aktiv, mübahisəli və tamamlanmış matçlarını buradan izləyə bilərsən.
            </p>
          </section>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6 text-zinc-300">
            Hazırda matçın yoxdur.
            <div className="mt-4">
              <Link
                href="/tournaments"
                className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10"
              >
                Turnirlərə bax
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const [{ data: homeMatches }, { data: awayMatches }] = await Promise.all([
    supabase.from('league_matches').select('*').in('home_participant_id', participantIds),
    supabase.from('league_matches').select('*').in('away_participant_id', participantIds),
  ])

  const mergedMap = new Map<string, any>()

  for (const match of [...(homeMatches || []), ...(awayMatches || [])]) {
    mergedMap.set(match.id, match)
  }

  const matches = Array.from(mergedMap.values())

  const matchIds = matches.map((match) => match.id)
  const tournamentIds = Array.from(new Set(matches.map((match) => match.tournament_id)))

  const { data: tournaments } = tournamentIds.length
    ? await supabase
        .from('tournaments')
        .select('id, title, slug, competition_stage')
        .in('id', tournamentIds)
    : { data: [] as any[] }

  const tournamentMap = new Map((tournaments || []).map((t: any) => [t.id, t]))

  const { data: submissions } = matchIds.length
    ? await supabase
        .from('league_match_submissions')
        .select('id, match_id, submitted_by_participant_id, submission_status, created_at')
        .in('match_id', matchIds)
    : { data: [] as any[] }

  const submissionMap = new Map<string, any[]>()

  for (const submission of submissions || []) {
    const key = submission.match_id
    const existing = submissionMap.get(key) || []
    existing.push(submission)
    submissionMap.set(key, existing)
  }

  const opponentParticipantIds = Array.from(
    new Set(
      matches.map((match) => {
        const isMineHome = participantIds.includes(match.home_participant_id)
        return isMineHome ? match.away_participant_id : match.home_participant_id
      })
    )
  )

  const { data: opponentParticipants } = opponentParticipantIds.length
    ? await supabase
        .from('tournament_participants')
        .select('id, user_id')
        .in('id', opponentParticipantIds)
    : { data: [] as any[] }

  const opponentParticipantMap = new Map(
    (opponentParticipants || []).map((item: any) => [item.id, item])
  )

  const opponentUserIds = Array.from(
    new Set((opponentParticipants || []).map((item: any) => item.user_id))
  )

  const { data: opponentProfiles } = opponentUserIds.length
    ? await supabase
        .from('profiles')
        .select('id, username, full_name')
        .in('id', opponentUserIds)
    : { data: [] as any[] }

  const profileMap = new Map((opponentProfiles || []).map((item: any) => [item.id, item]))

  const normalized = matches
    .map((match) => {
      const isHome = participantIds.includes(match.home_participant_id)
      const myParticipantId = isHome ? match.home_participant_id : match.away_participant_id
      const opponentParticipantId = isHome ? match.away_participant_id : match.home_participant_id

      const opponentParticipant = opponentParticipantMap.get(opponentParticipantId)
      const opponentProfile = opponentParticipant ? profileMap.get(opponentParticipant.user_id) : null
      const tournament = tournamentMap.get(match.tournament_id)
      const matchSubmissions = submissionMap.get(match.id) || []

      const mySubmissionExists = matchSubmissions.some(
        (submission) => submission.submitted_by_participant_id === myParticipantId
      )

      const opponentSubmissionExists = matchSubmissions.some(
        (submission) => submission.submitted_by_participant_id === opponentParticipantId
      )

      return {
        matchId: match.id,
        tournamentTitle: tournament?.title || 'Turnir',
        tournamentSlug: tournament?.slug || '',
        roundNo: match.round_no,
        opponentName: opponentProfile?.full_name || opponentProfile?.username || 'User',
        isHome,
        matchStatus: match.match_status,
        mySubmissionExists,
        opponentSubmissionExists,
        scheduledAt: match.scheduled_at,
        homeScore: match.home_score,
        awayScore: match.away_score,
      }
    })
    .sort((a, b) => {
      const order = ['disputed', 'awaiting_confirmation', 'scheduled', 'completed', 'cancelled']
      const aIndex = order.indexOf(a.matchStatus)
      const bIndex = order.indexOf(b.matchStatus)
      if (aIndex !== bIndex) return aIndex - bIndex

      const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0
      const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0
      return bTime - aTime
    })

  const activeCount = normalized.filter(
    (item) => item.matchStatus === 'scheduled' || item.matchStatus === 'awaiting_confirmation'
  ).length
  const disputedCount = normalized.filter((item) => item.matchStatus === 'disputed').length
  const completedCount = normalized.filter((item) => item.matchStatus === 'completed').length
  const waitingMyResponseCount = normalized.filter(
    (item) => !item.mySubmissionExists && item.opponentSubmissionExists && item.matchStatus !== 'completed'
  ).length

  return (
    <main className="min-h-screen px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-cyan-300">Matches</p>
          <h1 className="text-3xl font-bold sm:text-5xl">Mənim matçlarım</h1>
          <p className="mt-4 text-zinc-400">
            Aktiv, mübahisəli və tamamlanmış matçlarını buradan idarə et.
          </p>
        </section>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-zinc-400">Aktiv</p>
            <p className="mt-2 text-3xl font-bold">{activeCount}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-zinc-400">Mübahisəli</p>
            <p className="mt-2 text-3xl font-bold">{disputedCount}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-zinc-400">Tamamlanmış</p>
            <p className="mt-2 text-3xl font-bold">{completedCount}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-zinc-400">Cavab gözləyən</p>
            <p className="mt-2 text-3xl font-bold">{waitingMyResponseCount}</p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {normalized.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-zinc-300">
              Hazırda matçın yoxdur.
            </div>
          ) : (
            normalized.map((item) => (
              <div
                key={item.matchId}
                className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-cyan-300">
                      {item.tournamentTitle}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold">Round {item.roundNo}</h2>
                  </div>

                  <span
                    className={`inline-flex rounded-full border px-4 py-1 text-sm ${statusClass(item.matchStatus)}`}
                  >
                    {statusLabel(item.matchStatus)}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm text-zinc-400">{item.isHome ? 'Evdə' : 'Səfərdə'}</p>
                    <p className="mt-1 text-lg font-semibold">vs {item.opponentName}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm text-zinc-400">Submission vəziyyəti</p>
                    <p className="mt-1 text-sm text-zinc-200">
                      Sən: {item.mySubmissionExists ? 'göndərmisən' : 'göndərməmisən'}
                    </p>
                    <p className="mt-1 text-sm text-zinc-200">
                      Rəqib: {item.opponentSubmissionExists ? 'göndərib' : 'gözlənilir'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-zinc-300">
                    {item.matchStatus === 'completed' ? (
                      <span>
                        Final nəticə: {item.homeScore} - {item.awayScore}
                      </span>
                    ) : (
                      <span>
                        Vaxt:{' '}
                        {item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : '-'}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/matches/${item.matchId}`}
                    className="inline-flex rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.01]"
                  >
                    Matçı aç
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
