'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type MatchActionState = {
  error?: string
  success?: string
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
}

async function getAuthUser() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, user }
}

async function getAdminOrThrow() {
  const { supabase, user } = await getAuthUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'admin') {
    throw new Error('Bu əməliyyat üçün icazən yoxdur.')
  }

  return { supabase, user }
}

function compareSubmissions(a: any, b: any) {
  return (
    a.reported_home_score === b.reported_home_score &&
    a.reported_away_score === b.reported_away_score
  )
}

function getWinnerParticipantId(
  homeParticipantId: string,
  awayParticipantId: string,
  homeScore: number,
  awayScore: number
) {
  if (homeScore > awayScore) return homeParticipantId
  if (awayScore > homeScore) return awayParticipantId
  return null
}

async function upsertStandingsRows(
  supabase: any,
  tournamentId: string,
  rows: Array<{
    participant_id: string
    played: number
    wins: number
    draws: number
    losses: number
    goals_for: number
    goals_against: number
    goal_difference: number
    points: number
    rank: number
  }>
) {
  for (const row of rows) {
    const payload = {
      tournament_id: tournamentId,
      participant_id: row.participant_id,
      played: row.played,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      goals_for: row.goals_for,
      goals_against: row.goals_against,
      goal_difference: row.goal_difference,
      points: row.points,
      rank: row.rank,
      updated_at: new Date().toISOString(),
    }

    const { data: existing } = await supabase
      .from('tournament_standings')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('participant_id', row.participant_id)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('tournament_standings')
        .update(payload)
        .eq('id', existing.id)

      if (error) {
        throw new Error(`Standings update xətası: ${error.message}`)
      }
    } else {
      const { error } = await supabase.from('tournament_standings').insert(payload)

      if (error) {
        throw new Error(`Standings insert xətası: ${error.message}`)
      }
    }
  }
}

export async function recalculateLeagueStandings(tournamentId: string) {
  const supabase = createAdminClient()

  const { data: participants, error: participantError } = await supabase
    .from('tournament_participants')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('entry_status', 'confirmed')

  if (participantError) {
    throw new Error(`Participants oxunmadı: ${participantError.message}`)
  }

  const { data: matches, error: matchesError } = await supabase
    .from('league_matches')
    .select(`
      id,
      home_participant_id,
      away_participant_id,
      home_score,
      away_score,
      match_status
    `)
    .eq('tournament_id', tournamentId)
    .eq('match_status', 'completed')

  if (matchesError) {
    throw new Error(`Matçlar oxunmadı: ${matchesError.message}`)
  }

  const table = new Map<
    string,
    {
      participant_id: string
      played: number
      wins: number
      draws: number
      losses: number
      goals_for: number
      goals_against: number
      goal_difference: number
      points: number
      rank: number
    }
  >()

  for (const participant of participants || []) {
    table.set(participant.id, {
      participant_id: participant.id,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      points: 0,
      rank: 0,
    })
  }

  for (const match of matches || []) {
    const home = table.get(match.home_participant_id)
    const away = table.get(match.away_participant_id)

    if (!home || !away) continue
    if (match.home_score === null || match.away_score === null) continue

    const homeScore = Number(match.home_score)
    const awayScore = Number(match.away_score)

    home.played += 1
    away.played += 1

    home.goals_for += homeScore
    home.goals_against += awayScore

    away.goals_for += awayScore
    away.goals_against += homeScore

    if (homeScore > awayScore) {
      home.wins += 1
      home.points += 3
      away.losses += 1
    } else if (awayScore > homeScore) {
      away.wins += 1
      away.points += 3
      home.losses += 1
    } else {
      home.draws += 1
      away.draws += 1
      home.points += 1
      away.points += 1
    }
  }

  const sorted = Array.from(table.values()).map((row) => ({
    ...row,
    goal_difference: row.goals_for - row.goals_against,
  }))

  sorted.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for
    if (b.wins !== a.wins) return b.wins - a.wins
    return a.participant_id.localeCompare(b.participant_id)
  })

  sorted.forEach((row, index) => {
    row.rank = index + 1
  })

  await upsertStandingsRows(supabase, tournamentId, sorted)

  revalidatePath('/my-matches')
  revalidatePath('/admin/disputes')
  revalidatePath('/admin/standings')
}

async function resolveLeagueMatchFromSubmissions(supabase: any, matchId: string) {
  const { data: match, error: matchError } = await supabase
    .from('league_matches')
    .select(`
      id,
      tournament_id,
      home_participant_id,
      away_participant_id,
      match_status
    `)
    .eq('id', matchId)
    .maybeSingle()

  if (matchError || !match) {
    throw new Error(`Matç tapılmadı: ${matchError?.message || 'unknown'}`)
  }

  const { data: submissions, error: submissionError } = await supabase
    .from('league_match_submissions')
    .select(`
      id,
      submitted_by_participant_id,
      reported_home_score,
      reported_away_score,
      submission_status,
      created_at
    `)
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })

  if (submissionError) {
    throw new Error(`Submission-lar oxunmadı: ${submissionError.message}`)
  }

  const rows = submissions || []

  if (rows.length === 0) {
    const { error } = await supabase
      .from('league_matches')
      .update({
        match_status: 'scheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId)

    if (error) {
      throw new Error(error.message)
    }
    return
  }

  if (rows.length === 1) {
    const { error } = await supabase
      .from('league_matches')
      .update({
        match_status: 'awaiting_confirmation',
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId)

    if (error) {
      throw new Error(error.message)
    }
    return
  }

// hər participant üçün ən son submission-u götür
const latestByParticipant = new Map()

for (const row of rows) {
  latestByParticipant.set(row.submitted_by_participant_id, row)
}

const latestSubmissions = Array.from(latestByParticipant.values())

if (latestSubmissions.length < 2) {
  await supabase
    .from('league_matches')
    .update({
      match_status: 'awaiting_confirmation',
      updated_at: new Date().toISOString(),
    })
    .eq('id', matchId)

  return
}

const first = latestSubmissions[0]
const second = latestSubmissions[1]

  if (compareSubmissions(first, second)) {
    const homeScore = Number(first.reported_home_score)
    const awayScore = Number(first.reported_away_score)
    const winnerParticipantId = getWinnerParticipantId(
      match.home_participant_id,
      match.away_participant_id,
      homeScore,
      awayScore
    )

    const { error: matchUpdateError } = await supabase
      .from('league_matches')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        winner_participant_id: winnerParticipantId,
        match_status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId)

    if (matchUpdateError) {
      throw new Error(matchUpdateError.message)
    }

    const { error: submissionUpdateError } = await supabase
      .from('league_match_submissions')
      .update({
        submission_status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('match_id', matchId)

    if (submissionUpdateError) {
      throw new Error(submissionUpdateError.message)
    }

    await recalculateLeagueStandings(match.tournament_id)
    return
  }

  const { error: disputedError } = await supabase
    .from('league_matches')
    .update({
      match_status: 'disputed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', matchId)

  if (disputedError) {
    throw new Error(disputedError.message)
  }
}

export async function submitLeagueMatchResult(
  _prevState: MatchActionState,
  formData: FormData
): Promise<MatchActionState> {
  const { supabase, user } = await getAuthUser()

  if (!user) {
    return { error: 'Əvvəlcə daxil ol.' }
  }

  const matchId = String(formData.get('match_id') || '').trim()
  const homeScoreRaw = String(formData.get('reported_home_score') || '').trim()
  const awayScoreRaw = String(formData.get('reported_away_score') || '').trim()
  const comment = String(formData.get('comment') || '').trim()
  const screenshot = formData.get('screenshot') as File | null

  if (!matchId) {
    return { error: 'Match ID tapılmadı.' }
  }

  if (homeScoreRaw === '' || awayScoreRaw === '') {
    return { error: 'Score sahələri boş ola bilməz.' }
  }

  const reportedHomeScore = Number(homeScoreRaw)
  const reportedAwayScore = Number(awayScoreRaw)

  if (
    Number.isNaN(reportedHomeScore) ||
    Number.isNaN(reportedAwayScore) ||
    reportedHomeScore < 0 ||
    reportedAwayScore < 0
  ) {
    return { error: 'Score düzgün deyil.' }
  }

  if (!screenshot || screenshot.size === 0) {
    return { error: 'Screenshot mütləqdir.' }
  }

  const { data: match, error: matchError } = await supabase
    .from('league_matches')
    .select(`
      id,
      tournament_id,
      home_participant_id,
      away_participant_id,
      match_status
    `)
    .eq('id', matchId)
    .maybeSingle()

  if (matchError || !match) {
    return { error: 'Matç tapılmadı.' }
  }

  if (match.match_status === 'completed') {
    return { error: 'Bu matç artıq tamamlanıb.' }
  }

  const { data: myParticipant, error: participantError } = await supabase
    .from('tournament_participants')
    .select('id, tournament_id')
    .eq('tournament_id', match.tournament_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (participantError || !myParticipant) {
    return { error: 'Bu turnirdə iştirakçı deyilsən.' }
  }

  const isParticipant =
    myParticipant.id === match.home_participant_id || myParticipant.id === match.away_participant_id

  if (!isParticipant) {
    return { error: 'Bu matç üçün nəticə göndərə bilməzsən.' }
  }

  const extension = screenshot.name.includes('.')
    ? screenshot.name.split('.').pop()
    : 'png'

  const filePath = `${match.tournament_id}/${match.id}/${user.id}-${Date.now()}-${sanitizeFilename(
    screenshot.name || `proof.${extension}`
  )}`

  const { error: uploadError } = await supabase.storage
    .from('match-proofs')
    .upload(filePath, screenshot, {
      cacheControl: '3600',
      upsert: true,
      contentType: screenshot.type || 'image/png',
    })

  if (uploadError) {
    return { error: `Screenshot upload olmadı: ${uploadError.message}` }
  }

  const { data: existingSubmission } = await supabase
    .from('league_match_submissions')
    .select('id')
    .eq('match_id', match.id)
    .eq('submitted_by_participant_id', myParticipant.id)
    .maybeSingle()

  if (existingSubmission) {
    const { error: updateError } = await supabase
      .from('league_match_submissions')
      .update({
        reported_home_score: reportedHomeScore,
        reported_away_score: reportedAwayScore,
        screenshot_url: filePath,
        comment: comment || null,
        submission_status: 'submitted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSubmission.id)

    if (updateError) {
      return { error: `Submission yenilənmədi: ${updateError.message}` }
    }
  } else {
    const { error: insertError } = await supabase
      .from('league_match_submissions')
      .insert({
        match_id: match.id,
        submitted_by_participant_id: myParticipant.id,
        reported_home_score: reportedHomeScore,
        reported_away_score: reportedAwayScore,
        screenshot_url: filePath,
        comment: comment || null,
        submission_status: 'submitted',
      })

    if (insertError) {
      return { error: `Submission yaradılmadı: ${insertError.message}` }
    }
  }

 try {
  const adminSupabase = createAdminClient()
  await resolveLeagueMatchFromSubmissions(adminSupabase, match.id)
} catch (error: any) {
  return { error: error.message || 'Match nəticəsi işlənmədi.' }
}

  revalidatePath('/my-matches')
  revalidatePath(`/matches/${match.id}`)
  revalidatePath('/admin/disputes')
  revalidatePath('/tournaments')

  return { success: 'Nəticə göndərildi.' }
}

export async function adminResolveLeagueDispute(
  _prevState: MatchActionState,
  formData: FormData
): Promise<MatchActionState> {
  const { supabase, user } = await getAdminOrThrow()

  const matchId = String(formData.get('match_id') || '').trim()
  const finalHomeScore = Number(formData.get('final_home_score') || 0)
  const finalAwayScore = Number(formData.get('final_away_score') || 0)
  const note = String(formData.get('note') || '').trim()

  if (!matchId) {
    return { error: 'Match ID tapılmadı.' }
  }

  if (
    Number.isNaN(finalHomeScore) ||
    Number.isNaN(finalAwayScore) ||
    finalHomeScore < 0 ||
    finalAwayScore < 0
  ) {
    return { error: 'Final score düzgün deyil.' }
  }

  const { data: match, error: matchError } = await supabase
    .from('league_matches')
    .select(`
      id,
      tournament_id,
      home_participant_id,
      away_participant_id
    `)
    .eq('id', matchId)
    .maybeSingle()

  if (matchError || !match) {
    return { error: 'Matç tapılmadı.' }
  }

  const winnerParticipantId = getWinnerParticipantId(
    match.home_participant_id,
    match.away_participant_id,
    finalHomeScore,
    finalAwayScore
  )

  const { error: matchUpdateError } = await supabase
    .from('league_matches')
    .update({
      home_score: finalHomeScore,
      away_score: finalAwayScore,
      winner_participant_id: winnerParticipantId,
      match_status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', match.id)

  if (matchUpdateError) {
    return { error: `Match tamamlanmadı: ${matchUpdateError.message}` }
  }

  const { error: submissionsUpdateError } = await supabase
    .from('league_match_submissions')
    .update({
      submission_status: 'accepted',
      updated_at: new Date().toISOString(),
    })
    .eq('match_id', match.id)

  if (submissionsUpdateError) {
    return { error: submissionsUpdateError.message }
  }

  const { error: reviewLogError } = await supabase.from('match_review_logs').insert({
    tournament_id: match.tournament_id,
    review_target_type: 'league_match',
    review_target_id: match.id,
    reviewed_by: user.id,
    action_taken: 'admin_resolved_dispute',
    note: note || null,
  })

  if (reviewLogError) {
    return { error: reviewLogError.message }
  }

  try {
    await recalculateLeagueStandings(match.tournament_id)
  } catch (error: any) {
    return { error: error.message || 'Standings yenilənmədi.' }
  }

  revalidatePath('/admin/disputes')
  revalidatePath(`/matches/${match.id}`)
  revalidatePath('/my-matches')
  revalidatePath('/tournaments')

  return { success: 'Mübahisə həll olundu.' }
}
