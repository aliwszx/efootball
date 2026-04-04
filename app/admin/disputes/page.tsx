import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ResolveDisputeForm from './resolve-dispute-form'

async function toSignedUrl(supabase: any, path?: string | null) {
  if (!path) return null

  const { data, error } = await supabase.storage
    .from('match-proofs')
    .createSignedUrl(path, 60 * 60)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

export default async function AdminDisputesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'admin') {
    redirect('/profile')
  }

  const { data: matches, error } = await supabase
    .from('league_matches')
    .select(`
      id,
      tournament_id,
      round_no,
      home_participant_id,
      away_participant_id,
      match_status,
      scheduled_at
    `)
    .eq('match_status', 'disputed')
    .order('scheduled_at', { ascending: false })

  if (error) {
    return (
      <main className="min-h-screen px-4 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-200">
            Xəta: {error.message}
          </div>
        </div>
      </main>
    )
  }

  const tournamentIds = Array.from(new Set((matches || []).map((m: any) => m.tournament_id)))
  const participantIds = Array.from(
    new Set(
      (matches || []).flatMap((m: any) => [m.home_participant_id, m.away_participant_id]).filter(Boolean)
    )
  )
  const matchIds = (matches || []).map((m: any) => m.id)

  const { data: tournaments } = tournamentIds.length
    ? await supabase.from('tournaments').select('id, title, slug').in('id', tournamentIds)
    : { data: [] as any[] }

  const tournamentMap = new Map((tournaments || []).map((t: any) => [t.id, t]))

  const { data: participants } = participantIds.length
    ? await supabase.from('tournament_participants').select('id, user_id').in('id', participantIds)
    : { data: [] as any[] }

  const participantMap = new Map((participants || []).map((p: any) => [p.id, p]))
  const profileIds = Array.from(new Set((participants || []).map((p: any) => p.user_id)))

  const { data: profiles } = profileIds.length
    ? await supabase.from('profiles').select('id, username, full_name').in('id', profileIds)
    : { data: [] as any[] }

  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

  const { data: rawSubmissions } = matchIds.length
    ? await supabase
        .from('league_match_submissions')
        .select(`
          id,
          match_id,
          submitted_by_participant_id,
          reported_home_score,
          reported_away_score,
          screenshot_url,
          comment,
          submission_status,
          created_at
        `)
        .in('match_id', matchIds)
        .order('created_at', { ascending: true })
    : { data: [] as any[] }

  const enrichedSubmissions = await Promise.all(
    (rawSubmissions || []).map(async (item: any) => ({
      ...item,
      signed_screenshot_url: await toSignedUrl(supabase, item.screenshot_url),
    }))
  )

  const submissionMap = new Map<string, any[]>()

  for (const submission of enrichedSubmissions) {
    const existing = submissionMap.get(submission.match_id) || []
    existing.push(submission)
    submissionMap.set(submission.match_id, existing)
  }

  return (
    <main className="min-h-screen px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-cyan-300">Admin</p>
          <h1 className="text-3xl font-bold sm:text-5xl">Disputes</h1>
          <p className="mt-4 text-zinc-400">Mübahisəli matçları buradan həll et.</p>
        </section>

        <div className="mt-8 space-y-6">
          {!matches?.length ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-zinc-300">
              Hazırda mübahisəli matç yoxdur.
            </div>
          ) : (
            matches.map((match: any) => {
              const homeParticipant = participantMap.get(match.home_participant_id)
              const awayParticipant = participantMap.get(match.away_participant_id)
              const homeProfile = homeParticipant ? profileMap.get(homeParticipant.user_id) : null
              const awayProfile = awayParticipant ? profileMap.get(awayParticipant.user_id) : null
              const tournament = tournamentMap.get(match.tournament_id)
              const submissions = submissionMap.get(match.id) || []

              return (
                <div
                  key={match.id}
                  className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-wide text-cyan-300">
                        {tournament?.title || 'Turnir'}
                      </p>
                      <h2 className="mt-1 text-2xl font-bold">Round {match.round_no}</h2>
                      <p className="mt-2 text-zinc-400">
                        {homeProfile?.username || 'User'} vs {awayProfile?.username || 'User'}
                      </p>
                    </div>

                    <span className="inline-flex rounded-full border border-red-400/20 bg-red-500/10 px-4 py-1 text-sm text-red-200">
                      Mübahisəli
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    {submissions.map((submission: any) => {
                      const submitterParticipant = participantMap.get(submission.submitted_by_participant_id)
                      const submitterProfile = submitterParticipant
                        ? profileMap.get(submitterParticipant.user_id)
                        : null

                      return (
                        <div
                          key={submission.id}
                          className="rounded-2xl border border-white/10 bg-black/20 p-4"
                        >
                          <p className="text-sm text-zinc-400">Göndərən</p>
                          <p className="mt-1 font-semibold text-white">
                            {submitterProfile?.full_name || submitterProfile?.username || 'User'}
                          </p>

                          <p className="mt-4 text-sm text-zinc-400">Nəticə</p>
                          <p className="mt-1 text-lg font-semibold text-white">
                            {submission.reported_home_score} - {submission.reported_away_score}
                          </p>

                          <p className="mt-4 text-sm text-zinc-400">Comment</p>
                          <p className="mt-1 text-zinc-200">{submission.comment || '-'}</p>

                          <p className="mt-4 text-sm text-zinc-400">Vaxt</p>
                          <p className="mt-1 text-zinc-200">
                            {new Date(submission.created_at).toLocaleString()}
                          </p>

                          {submission.signed_screenshot_url && (
                            <a
                              href={submission.signed_screenshot_url}
                              target="_blank"
                              className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
                            >
                              Screenshot-a bax
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-6">
                    <ResolveDisputeForm matchId={match.id} />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </main>
  )
}
