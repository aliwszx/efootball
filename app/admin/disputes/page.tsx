import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ResolveDisputeForm from './resolve-dispute-form'

async function toSignedUrl(supabase: any, path?: string | null) {
  if (!path) return null
  const { data, error } = await supabase.storage.from('match-proofs').createSignedUrl(path, 60 * 60)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

export default async function AdminDisputesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile || profile.role !== 'admin') redirect('/profile')

  const [{ data: leagueDisputes, error }, { data: knockoutDisputes }] = await Promise.all([
    supabase
      .from('league_matches')
      .select('id, tournament_id, round_no, home_participant_id, away_participant_id, match_status, scheduled_at')
      .eq('match_status', 'disputed')
      .order('scheduled_at', { ascending: false }),
    supabase
      .from('knockout_matches')
      .select('id, tournament_id, stage, leg_no, home_participant_id, away_participant_id, match_status, scheduled_at')
      .eq('match_status', 'disputed')
      .order('scheduled_at', { ascending: false }),
  ])

  if (error) {
    return (
      <main className="min-h-screen px-4 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/8 p-4 text-sm text-red-300">Xəta: {error.message}</div>
        </div>
      </main>
    )
  }

  const stageLabel: Record<string, string> = {
    quarterfinal: 'Çərək Final',
    semifinal: 'Yarımfinal',
    final: 'Final',
    round_of_16: '1/8 Final',
  }

  const matches = [
    ...(leagueDisputes || []).map((m: any) => ({
      ...m,
      _roundLabel: `Round ${m.round_no}`,
    })),
    ...(knockoutDisputes || []).map((m: any) => ({
      ...m,
      _roundLabel: `${stageLabel[m.stage] ?? m.stage}${m.leg_no ? ` — Leg ${m.leg_no}` : ''}`,
    })),
  ]

  const tournamentIds = Array.from(new Set((matches || []).map((m: any) => m.tournament_id)))
  const participantIds = Array.from(new Set((matches || []).flatMap((m: any) => [m.home_participant_id, m.away_participant_id]).filter(Boolean)))
  const matchIds = (matches || []).map((m: any) => m.id)

  const { data: tournaments } = tournamentIds.length ? await supabase.from('tournaments').select('id, title, slug').in('id', tournamentIds) : { data: [] as any[] }
  const tournamentMap = new Map((tournaments || []).map((t: any) => [t.id, t]))

  const { data: participants } = participantIds.length ? await supabase.from('tournament_participants').select('id, user_id').in('id', participantIds) : { data: [] as any[] }
  const participantMap = new Map((participants || []).map((p: any) => [p.id, p]))
  const profileIds = Array.from(new Set((participants || []).map((p: any) => p.user_id)))

  const { data: profiles } = profileIds.length ? await supabase.from('profiles').select('id, username, full_name').in('id', profileIds) : { data: [] as any[] }
  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

  const { data: rawSubmissions } = matchIds.length
    ? await supabase.from('league_match_submissions')
        .select('id, match_id, submitted_by_participant_id, reported_home_score, reported_away_score, screenshot_url, comment, submission_status, created_at')
        .in('match_id', matchIds).order('created_at', { ascending: true })
    : { data: [] as any[] }

  const enrichedSubmissions = await Promise.all((rawSubmissions || []).map(async (item: any) => ({
    ...item, signed_screenshot_url: await toSignedUrl(supabase, item.screenshot_url),
  })))

  const submissionMap = new Map<string, any[]>()
  for (const s of enrichedSubmissions) {
    const existing = submissionMap.get(s.match_id) || []
    existing.push(s)
    submissionMap.set(s.match_id, existing)
  }

  return (
    <main className="min-h-screen px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[28px] border border-[#C50337]/20 bg-[#C50337]/5 p-7 backdrop-blur-xl sm:p-10">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#C50337]/10 via-transparent to-[#8B0224]/5" />
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#C50337]/25 bg-[#C50337]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff4d6d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff4d6d]" /> Admin Panel
          </div>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl" style={{ fontFamily: 'var(--font-poppins)' }}>Disputes</h1>
          <p className="mt-3 text-sm text-zinc-400">Mübahisəli matçları buradan həll et.</p>
        </section>

        <div className="mt-6 space-y-5">
          {!matches?.length ? (
            <div className="rounded-[24px] border border-[#C50337]/10 bg-[#C50337]/4 p-8 text-center text-zinc-500">
              Hazırda mübahisəli matç yoxdur. ✓
            </div>
          ) : matches.map((match: any) => {
            const homeParticipant = participantMap.get(match.home_participant_id)
            const awayParticipant = participantMap.get(match.away_participant_id)
            const homeProfile = homeParticipant ? profileMap.get(homeParticipant.user_id) : null
            const awayProfile = awayParticipant ? profileMap.get(awayParticipant.user_id) : null
            const tournament = tournamentMap.get(match.tournament_id)
            const submissions = submissionMap.get(match.id) || []

            return (
              <div key={match.id} className="rounded-[24px] border border-red-500/15 bg-red-500/3 p-6 backdrop-blur-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#ff4d6d]">{tournament?.title || 'Turnir'}</p>
                    <h2 className="mt-1 text-2xl font-bold" style={{ fontFamily: 'var(--font-poppins)' }}>{(match as any)._roundLabel}</h2>
                    <p className="mt-1.5 text-zinc-400">
                      <span className="text-white">{homeProfile?.username || 'User'}</span>
                      <span className="mx-2 text-zinc-600">vs</span>
                      <span className="text-white">{awayProfile?.username || 'User'}</span>
                    </p>
                  </div>
                  <span className="inline-flex rounded-full border border-red-400/25 bg-red-500/10 px-4 py-1 text-sm font-medium text-red-300">
                    ⚠ Mübahisəli
                  </span>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  {submissions.map((s: any) => {
                    const submitterP = participantMap.get(s.submitted_by_participant_id)
                    const submitterProfile = submitterP ? profileMap.get(submitterP.user_id) : null
                    return (
                      <div key={s.id} className="rounded-xl border border-[#C50337]/10 bg-[#02060E]/60 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-medium text-white">{submitterProfile?.full_name || submitterProfile?.username || 'User'}</p>
                          <span className="text-2xl font-bold text-[#ff4d6d]">{s.reported_home_score} – {s.reported_away_score}</span>
                        </div>
                        {s.comment && <p className="mb-2 text-xs text-zinc-500">{s.comment}</p>}
                        <p className="text-[10px] text-zinc-700">{new Date(s.created_at).toLocaleString('az-AZ')}</p>
                        {s.signed_screenshot_url && (
                          <a href={s.signed_screenshot_url} target="_blank"
                            className="mt-3 inline-flex rounded-xl border border-[#C50337]/15 bg-[#C50337]/8 px-3 py-1.5 text-xs text-[#ff4d6d] transition hover:bg-[#C50337]/15">
                            Screenshot →
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="mt-5">
                  <ResolveDisputeForm matchId={match.id} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
