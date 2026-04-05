import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SubmissionForm from './submission-form'

type PageProps = {
  params: Promise<{ id: string }>
}

function matchStatusLabel(status: string) {
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

function matchStatusClass(status: string) {
  switch (status) {
    case 'awaiting_confirmation':
      return 'border-yellow-400/20 bg-yellow-500/10 text-yellow-200'
    case 'disputed':
      return 'border-red-400/20 bg-red-500/10 text-red-200'
    case 'completed':
      return 'border-[#C50337]/20 bg-[#C50337]/10 text-[#ff6b81]'
    case 'cancelled':
      return 'border-zinc-400/20 bg-zinc-500/10 text-zinc-200'
    default:
      return 'border-[#C50337]/20 bg-[#C50337]/10 text-[#ff6b81]'
  }
}

async function toSignedUrl(supabase: any, path?: string | null) {
  if (!path) return null

  const { data, error } = await supabase.storage
    .from('match-proofs')
    .createSignedUrl(path, 60 * 60)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: leagueMatch, error: leagueMatchError } = await supabase
    .from('league_matches')
    .select(`
      id,
      tournament_id,
      round_no,
      home_participant_id,
      away_participant_id,
      home_score,
      away_score,
      winner_participant_id,
      match_status,
      scheduled_at,
      completed_at
    `)
    .eq('id', id)
    .maybeSingle()

  const { data: knockoutMatch } = !leagueMatch
    ? await supabase
        .from('knockout_matches')
        .select(`
          id,
          tournament_id,
          stage,
          leg_no,
          home_participant_id,
          away_participant_id,
          home_score,
          away_score,
          winner_participant_id,
          match_status,
          scheduled_at,
          completed_at
        `)
        .eq('id', id)
        .maybeSingle()
    : { data: null }

  const match = leagueMatch ?? knockoutMatch

  if (!match) {
    notFound()
  }

  const { data: myParticipant } = await supabase
    .from('tournament_participants')
    .select('id, user_id')
    .eq('tournament_id', match.tournament_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!myParticipant) {
    redirect('/my-matches')
  }

  const isParticipant =
    myParticipant.id === match.home_participant_id || myParticipant.id === match.away_participant_id

  if (!isParticipant) {
    redirect('/my-matches')
  }

  const isHome = myParticipant.id === match.home_participant_id
  const opponentParticipantId = isHome ? match.away_participant_id : match.home_participant_id

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, title, slug, competition_stage')
    .eq('id', match.tournament_id)
    .maybeSingle()

  const { data: participants } = await supabase
    .from('tournament_participants')
    .select('id, user_id')
    .in('id', [match.home_participant_id, match.away_participant_id])

  const participantMap = new Map((participants || []).map((item: any) => [item.id, item]))
  const profileIds = (participants || []).map((item: any) => item.user_id)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, full_name')
    .in('id', profileIds)

  const profileMap = new Map((profiles || []).map((item: any) => [item.id, item]))

  const homeParticipant = participantMap.get(match.home_participant_id)
  const awayParticipant = participantMap.get(match.away_participant_id)

  const homeProfile = homeParticipant ? profileMap.get(homeParticipant.user_id) : null
  const awayProfile = awayParticipant ? profileMap.get(awayParticipant.user_id) : null

  const { data: rawSubmissions } = await supabase
    .from('league_match_submissions')
    .select(`
      id,
      submitted_by_participant_id,
      reported_home_score,
      reported_away_score,
      screenshot_url,
      comment,
      submission_status,
      created_at
    `)
    .eq('match_id', match.id)
    .order('created_at', { ascending: true })

  const submissions = await Promise.all(
    (rawSubmissions || []).map(async (item: any) => ({
      ...item,
      signed_screenshot_url: await toSignedUrl(supabase, item.screenshot_url),
    }))
  )

  const mySubmission = submissions.find(
    (item: any) => item.submitted_by_participant_id === myParticipant.id
  )
  const opponentSubmission = submissions.find(
    (item: any) => item.submitted_by_participant_id === opponentParticipantId
  )

  const isCompleted = match.match_status === 'completed'
  const isDisputed = match.match_status === 'disputed'
  const showForm = !isCompleted && !isDisputed && !mySubmission

  const winnerName =
    match.winner_participant_id === match.home_participant_id
      ? homeProfile?.full_name || homeProfile?.username
      : match.winner_participant_id === match.away_participant_id
        ? awayProfile?.full_name || awayProfile?.username
        : 'Heç-heçə'

  return (
    <main className="min-h-screen px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[#ff4d6d]">
                {tournament?.title || 'Turnir'}
              </p>
              <h1 className="text-3xl font-bold sm:text-5xl">League • Round {match.round_no}</h1>
            </div>

            <span
              className={`inline-flex rounded-full border px-4 py-1 text-sm ${matchStatusClass(match.match_status)}`}
            >
              {matchStatusLabel(match.match_status)}
            </span>
          </div>
        </section>

        <div className="mt-8 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
              <p className="text-sm text-zinc-400">Home</p>
              <p className="mt-2 text-2xl font-bold">
                {homeProfile?.full_name || homeProfile?.username || 'User'}
              </p>
              {isHome && <p className="mt-2 text-sm text-[#ff4d6d]">Sən</p>}
            </div>

            <div className="text-center">
              {isCompleted ? (
                <div>
                  <p className="text-5xl font-bold">
                    {match.home_score} - {match.away_score}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">Qalib: {winnerName}</p>
                </div>
              ) : (
                <p className="text-4xl font-bold">VS</p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
              <p className="text-sm text-zinc-400">Away</p>
              <p className="mt-2 text-2xl font-bold">
                {awayProfile?.full_name || awayProfile?.username || 'User'}
              </p>
              {!isHome && <p className="mt-2 text-sm text-[#ff4d6d]">Sən</p>}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-zinc-400">Stage</p>
              <p className="mt-1 font-semibold">League</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-zinc-400">Round</p>
              <p className="mt-1 font-semibold">{match.round_no}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-zinc-400">Vaxt</p>
              <p className="mt-1 font-semibold">
                {match.scheduled_at ? new Date(match.scheduled_at).toLocaleString() : '-'}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-zinc-400">Completed</p>
              <p className="mt-1 font-semibold">
                {match.completed_at ? new Date(match.completed_at).toLocaleString() : '-'}
              </p>
            </div>
          </div>
        </div>

        {isCompleted && (
          <div className="mt-6 rounded-2xl border border-[#C50337]/20 bg-[#C50337]/10 p-4 text-[#ff6b81]">
            Bu matç tamamlanıb.
          </div>
        )}

        {isDisputed && (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-200">
            Bu matç mübahisəlidir. Admin baxışı gözlənilir.
          </div>
        )}

        {!isCompleted && !isDisputed && mySubmission && !opponentSubmission && (
          <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-4 text-yellow-200">
            Sənin nəticən göndərildi. Qarşı tərəfin cavabı gözlənilir.
          </div>
        )}

        {!isCompleted && !isDisputed && !mySubmission && opponentSubmission && (
          <div className="mt-6 rounded-2xl border border-[#C50337]/20 bg-[#C50337]/10 p-4 text-[#ff6b81]">
            Rəqib artıq nəticə göndərib. Eyni nəticəni göndərərək təsdiqləyə və ya fərqli nəticə
            ilə etiraz edə bilərsən.
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-2xl font-bold">Mənim submission-ım</h2>

            {!mySubmission ? (
              <p className="mt-4 text-zinc-400">Hələ nəticə göndərməmisən.</p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-zinc-400">Nəticə</p>
                  <p className="mt-1 text-lg font-semibold">
                    {mySubmission.reported_home_score} - {mySubmission.reported_away_score}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-zinc-400">Comment</p>
                  <p className="mt-1 text-zinc-200">{mySubmission.comment || '-'}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-zinc-400">Status</p>
                  <p className="mt-1 text-zinc-200">{mySubmission.submission_status}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-zinc-400">Göndərilmə vaxtı</p>
                  <p className="mt-1 text-zinc-200">
                    {new Date(mySubmission.created_at).toLocaleString()}
                  </p>
                </div>

                {mySubmission.signed_screenshot_url && (
                  <a
                    href={mySubmission.signed_screenshot_url}
                    target="_blank"
                    className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
                  >
                    Screenshot-a bax
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-2xl font-bold">Qarşı tərəfin submission-ı</h2>

            {!opponentSubmission ? (
              <p className="mt-4 text-zinc-400">Rəqib hələ nəticə göndərməyib.</p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-zinc-400">Nəticə</p>
                  <p className="mt-1 text-lg font-semibold">
                    {opponentSubmission.reported_home_score} -{' '}
                    {opponentSubmission.reported_away_score}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-zinc-400">Comment</p>
                  <p className="mt-1 text-zinc-200">{opponentSubmission.comment || '-'}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-zinc-400">Status</p>
                  <p className="mt-1 text-zinc-200">{opponentSubmission.submission_status}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-zinc-400">Göndərilmə vaxtı</p>
                  <p className="mt-1 text-zinc-200">
                    {new Date(opponentSubmission.created_at).toLocaleString()}
                  </p>
                </div>

                {opponentSubmission.signed_screenshot_url && (
                  <a
                    href={opponentSubmission.signed_screenshot_url}
                    target="_blank"
                    className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
                  >
                    Screenshot-a bax
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {showForm && (
          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-2xl font-bold">Nəticəni göndər</h2>
            <p className="mt-3 text-zinc-400">
              Screenshot məcburidir. Eyni nəticə göndərilərsə matç tamamlanacaq, fərqli nəticə
              göndərilərsə admin baxışı tələb olunacaq.
            </p>

            <div className="mt-6">
              <SubmissionForm matchId={match.id} />
            </div>
          </div>
        )}

        <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-bold">Qaydalar</h2>
          <ul className="mt-4 space-y-2 text-zinc-300">
            <li>Screenshot olmadan nəticə qəbul edilmir.</li>
            <li>Hər iki tərəf eyni nəticəni göndərsə matç avtomatik tamamlanır.</li>
            <li>Fərqli nəticələr göndərilərsə admin baxışı tələb olunur.</li>
            <li>Son qərar adminindir.</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
