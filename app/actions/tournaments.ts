'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function slugify(value: string) {
  return value.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE TOURNAMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function createTournament(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('id, role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') throw new Error('İcazən yoxdur')

  const title                 = String(formData.get('title') || '').trim()
  const platform              = String(formData.get('platform') || '').trim()
  const format                = String(formData.get('format') || '1v1').trim()
  const tournament_type       = String(formData.get('tournament_type') || 'swiss_36').trim()
  const group_legs            = Number(formData.get('group_legs') || 1)
  const entry_fee             = Number(formData.get('entry_fee') || 0)
  const prize_amount          = Number(formData.get('prize_amount') || 0)
  const max_players           = Number(formData.get('max_players') || 0)
  const league_match_count    = Number(formData.get('league_match_count') || 8)
  const registration_deadline = String(formData.get('registration_deadline') || '')
  const start_time            = String(formData.get('start_time') || '')
  const description           = String(formData.get('description') || '').trim()
  const rules                 = String(formData.get('rules') || '').trim()
  const status                = String(formData.get('status') || 'draft').trim()

  if (!title || !platform || !registration_deadline || !start_time || !max_players) {
    throw new Error('Bütün vacib sahələri doldur')
  }

  const slug = slugify(title)

  const { error } = await supabase.from('tournaments').insert({
    title, slug, game: 'eFootball', platform, format,
    tournament_type, group_legs,
    entry_fee, prize_amount, max_players,
    league_match_count,
    registration_deadline, start_time,
    description, rules, status,
    created_by: user.id,
  })

  if (error) {
    if (error.message.toLowerCase().includes('duplicate')) {
      throw new Error('Bu adda turnir artıq mövcuddur, başlığı dəyiş')
    }
    throw new Error(error.message)
  }

  redirect('/tournaments')
}

// ─────────────────────────────────────────────────────────────────────────────
// JOIN TOURNAMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function joinTournament(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tournamentId   = String(formData.get('tournament_id') || '').trim()
  const tournamentSlug = String(formData.get('tournament_slug') || '').trim()
  if (!tournamentId || !tournamentSlug) throw new Error('Turnir məlumatı çatışmır')

  const { data: tournament, error: tErr } = await supabase
    .from('tournaments')
    .select('id, slug, title, status, max_players, registration_deadline, entry_fee')
    .eq('id', tournamentId).single()

  if (tErr || !tournament) throw new Error('Turnir tapılmadı')
  if (tournament.status !== 'open') throw new Error('Turnir qeydiyyata açıq deyil')
  if (new Date(tournament.registration_deadline) < new Date()) throw new Error('Qeydiyyat müddəti bitib')

  const { count } = await supabase
    .from('tournament_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournament.id)
    .eq('registration_status', 'confirmed')

  if ((count || 0) >= tournament.max_players) throw new Error('Turnirdə yer qalmayıb')

  const { data: existing } = await supabase
    .from('tournament_registrations')
    .select('id, registration_status')
    .eq('tournament_id', tournament.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing && existing.registration_status !== 'cancelled') throw new Error('Artıq qeydiyyatdan keçmisən')

  const { data: registration, error: regErr } = await supabase
    .from('tournament_registrations')
    .insert({ tournament_id: tournament.id, user_id: user.id, registration_status: 'pending' })
    .select('id').single()

  if (regErr || !registration) throw new Error('Qeydiyyat uğursuz oldu')

  await supabase.from('payments').insert({
    user_id: user.id, tournament_id: tournament.id, registration_id: registration.id,
    provider: 'manual', amount: tournament.entry_fee, currency: 'AZN', status: 'pending',
  })

  redirect(`/tournaments/${tournamentSlug}?success=joined_pending`)
}

// ─────────────────────────────────────────────────────────────────────────────
// SWISS FIKSTUR GENERATOR (36 nəfərlik liqa mərhələsi üçün)
// ─────────────────────────────────────────────────────────────────────────────

function generateSwissFixtures(
  participantIds: string[],
  targetMatches = 8
): Array<{ home_participant_id: string; away_participant_id: string; round_no: number }> {
  const TARGET_HOME = Math.ceil(targetMatches / 2)
  const TARGET_AWAY = Math.floor(targetMatches / 2)

  const homeCount  = new Map<string, number>()
  const matchCount = new Map<string, number>()
  const pairCount  = new Map<string, number>()

  for (const id of participantIds) {
    homeCount.set(id, 0)
    matchCount.set(id, 0)
  }

  const pairKey = (a: string, b: string) => [a, b].sort().join('|')
  const fixtures: Array<{ home_participant_id: string; away_participant_id: string; round_no: number }> = []
  let roundNo = 1
  const maxRounds = targetMatches * 3

  while (roundNo <= maxRounds) {
    const available = shuffle(participantIds.filter(id => (matchCount.get(id) ?? 0) < targetMatches))
    if (available.length < 2) break

    const usedThisRound = new Set<string>()
    let foundAny = false

    for (let i = 0; i < available.length; i++) {
      const a = available[i]
      if (usedThisRound.has(a) || (matchCount.get(a) ?? 0) >= targetMatches) continue

      for (let j = i + 1; j < available.length; j++) {
        const b = available[j]
        if (usedThisRound.has(b) || (matchCount.get(b) ?? 0) >= targetMatches) continue
        if ((pairCount.get(pairKey(a, b)) ?? 0) >= 1) continue

        const aHome = homeCount.get(a) ?? 0
        const bHome = homeCount.get(b) ?? 0
        let home: string, away: string

        if (TARGET_HOME - aHome > TARGET_HOME - bHome && aHome < TARGET_HOME) {
          home = a; away = b
        } else if (TARGET_HOME - bHome > TARGET_HOME - aHome && bHome < TARGET_HOME) {
          home = b; away = a
        } else if (aHome < TARGET_HOME) {
          home = a; away = b
        } else if (bHome < TARGET_HOME) {
          home = b; away = a
        } else continue

        fixtures.push({ home_participant_id: home, away_participant_id: away, round_no: roundNo })
        homeCount.set(home, (homeCount.get(home) ?? 0) + 1)
        matchCount.set(home, (matchCount.get(home) ?? 0) + 1)
        matchCount.set(away, (matchCount.get(away) ?? 0) + 1)
        pairCount.set(pairKey(a, b), 1)
        usedThisRound.add(a)
        usedThisRound.add(b)
        foundAny = true
        break
      }
    }

    if (!foundAny) break
    roundNo++
  }

  return fixtures
}

// ─────────────────────────────────────────────────────────────────────────────
// QRUP FIKSTUR GENERATOR (16 nəfərlik üçün)
// legs=1: hər cüt 1 dəfə, legs=2: hər cüt ev+səfər olaraq 2 dəfə
// ─────────────────────────────────────────────────────────────────────────────

function generateGroupFixtures(
  memberIds: string[],
  legs: 1 | 2
): Array<{ home_participant_id: string; away_participant_id: string; round_no: number }> {
  const fixtures: Array<{ home_participant_id: string; away_participant_id: string; round_no: number }> = []
  let round = 1

  for (let i = 0; i < memberIds.length; i++) {
    for (let j = i + 1; j < memberIds.length; j++) {
      fixtures.push({ home_participant_id: memberIds[i], away_participant_id: memberIds[j], round_no: round })
      if (legs === 2) {
        round++
        // Cavab oyunu: ev/səfər yer dəyişdirilir
        fixtures.push({ home_participant_id: memberIds[j], away_participant_id: memberIds[i], round_no: round })
      }
      round++
    }
  }
  return fixtures
}

// ─────────────────────────────────────────────────────────────────────────────
// KNOCKOUT TIE CREATOR
// Hər cüt üçün tie + 2 matç (leg 1 və leg 2) yaradır.
// Final üçün leg_count=1, yalnız 1 matç yaradılır.
// ─────────────────────────────────────────────────────────────────────────────

async function createKnockoutTie(
  supabase: any,
  tournamentId: string,
  stage: string,
  participantAId: string,
  participantBId: string,
  seedLabel: string,
  legCount: 1 | 2
) {
  // Tie yarat
  const { data: tie, error: tieErr } = await supabase
    .from('knockout_ties')
    .insert({
      tournament_id:  tournamentId,
      stage,
      seed_label:     seedLabel,
      participant_a_id: participantAId,
      participant_b_id: participantBId,
      leg_count:      legCount,
      tie_status:     'scheduled',
      agg_a:          0,
      agg_b:          0,
    })
    .select('id').single()

  if (tieErr || !tie) throw new Error(`Tie yaradılmadı: ${tieErr?.message}`)

  // Matçları yarat
  const matches = []

  // Leg 1: A ev sahibi
  matches.push({
    tie_id:              tie.id,
    tournament_id:       tournamentId,
    stage,
    leg_no:              1,
    home_participant_id: participantAId,
    away_participant_id: participantBId,
    match_status:        'scheduled',
  })

  if (legCount === 2) {
    // Leg 2: B ev sahibi (cavab oyunu)
    matches.push({
      tie_id:              tie.id,
      tournament_id:       tournamentId,
      stage,
      leg_no:              2,
      home_participant_id: participantBId,
      away_participant_id: participantAId,
      match_status:        'scheduled',
    })
  }

  const { error: matchErr } = await supabase.from('knockout_matches').insert(matches)
  if (matchErr) throw new Error(`Knockout matçları yaradılmadı: ${matchErr.message}`)

  return tie.id
}

// ─────────────────────────────────────────────────────────────────────────────
// START TOURNAMENT
// ─────────────────────────────────────────────────────────────────────────────

export type StartTournamentState = { error?: string; success?: string }

export async function startTournament(
  _prevState: StartTournamentState,
  formData: FormData
): Promise<StartTournamentState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return { error: 'İcazən yoxdur.' }

  const tournamentId = String(formData.get('tournament_id') || '').trim()
  if (!tournamentId) return { error: 'Turnir ID tapılmadı.' }

  const { data: t, error: tErr } = await supabase
    .from('tournaments')
    .select('id, status, title, tournament_type, group_legs, league_match_count, max_players')
    .eq('id', tournamentId).single()

  if (tErr || !t) return { error: 'Turnir tapılmadı.' }
  if (t.status === 'ongoing')   return { error: 'Turnir artıq başlayıb.' }
  if (t.status === 'completed') return { error: 'Turnir tamamlanıb.' }

  // ── Təsdiqlənmiş qeydiyyatları al ──
  const { data: registrations, error: regErr } = await supabase
    .from('tournament_registrations')
    .select('id, user_id')
    .eq('tournament_id', tournamentId)
    .eq('registration_status', 'confirmed')

  if (regErr) return { error: `Qeydiyyatlar oxunmadı: ${regErr.message}` }
  if (!registrations || registrations.length < 2) {
    return { error: 'Ən azı 2 təsdiqlənmiş iştirakçı lazımdır.' }
  }

  // ── Mövcud iştirakçıları yoxla, yenilərini əlavə et ──
  const { data: existingParts } = await supabase
    .from('tournament_participants')
    .select('id, user_id')
    .eq('tournament_id', tournamentId)

  const existingUserIds = new Set((existingParts || []).map((p: any) => p.user_id))
  const newParts = registrations
    .filter(r => !existingUserIds.has(r.user_id))
    .map(r => ({
      tournament_id: tournamentId,
      user_id: r.user_id,
      entry_status: 'confirmed',
      registration_id: r.id,
      qualified_to: 'none',
    }))

  let allParticipantIds: string[] = (existingParts || []).map((p: any) => p.id)

  if (newParts.length > 0) {
    const { data: inserted, error: insErr } = await supabase
      .from('tournament_participants').insert(newParts).select('id')
    if (insErr) return { error: `İştirakçılar əlavə edilmədi: ${insErr.message}` }
    allParticipantIds = [...allParticipantIds, ...(inserted || []).map((p: any) => p.id)]
  }

  try {
    // ════════════════════════════════════════════════════════
    // FORMAT 1: knockout_8 — Birbaşa Knockout
    // ════════════════════════════════════════════════════════
    if (t.tournament_type === 'knockout_8') {
      if (allParticipantIds.length < 4) return { error: 'Ən azı 4 iştirakçı lazımdır.' }

      const seeded = shuffle(allParticipantIds).slice(0, 8)

      // Çərək final: 4 cüt, hər biri 2 oyun (leg_count=2)
      // 1v8, 2v7, 3v6, 4v5 seeding
      const qfPairs = [
        [seeded[0], seeded[7] ?? seeded[0]],
        [seeded[1], seeded[6] ?? seeded[1]],
        [seeded[2], seeded[5] ?? seeded[2]],
        [seeded[3], seeded[4] ?? seeded[3]],
      ]
      for (let i = 0; i < qfPairs.length; i++) {
        const [a, b] = qfPairs[i]
        await createKnockoutTie(supabase, tournamentId, 'quarterfinal', a, b, `QF${i + 1}`, 2)
      }

      await supabase.from('tournaments').update({
        status: 'ongoing', competition_stage: 'quarterfinal',
      }).eq('id', tournamentId)

      revalidatePath('/admin/tournaments')
      revalidatePath('/tournaments')
      return { success: `✅ 8 nəfərlik turnir başladı! Çərək final: ${qfPairs.length} cüt × 2 oyun yaradıldı.` }
    }

    // ════════════════════════════════════════════════════════
    // FORMAT 2: group_knockout_16 — Qrup + Playoff
    // ════════════════════════════════════════════════════════
    if (t.tournament_type === 'group_knockout_16') {
      if (allParticipantIds.length < 8) return { error: 'Ən azı 8 iştirakçı lazımdır.' }

      const legs = (t.group_legs === 2 ? 2 : 1) as 1 | 2
      const shuffled = shuffle(allParticipantIds)
      const groupCount = 4
      const groupSize  = 4

      // Mövcud qrupları yoxla
      const { data: existingGroups } = await supabase
        .from('tournament_groups')
        .select('id').eq('tournament_id', tournamentId)

      if (!existingGroups || existingGroups.length === 0) {
        const groupLabels = ['A', 'B', 'C', 'D']

        for (let g = 0; g < groupCount; g++) {
          const label = groupLabels[g]
          const members = shuffled.slice(g * groupSize, (g + 1) * groupSize)
          if (members.length === 0) continue

          // Qrup yarat
          const { data: group, error: grpErr } = await supabase
            .from('tournament_groups')
            .insert({ tournament_id: tournamentId, group_index: g, group_label: label })
            .select('id').single()

          if (grpErr || !group) return { error: `Qrup ${label} yaradılmadı: ${grpErr?.message}` }

          // Qrup üzvlərini əlavə et
          await supabase.from('group_members').insert(
            members.map(pid => ({
              group_id: group.id,
              tournament_id: tournamentId,
              participant_id: pid,
            }))
          )

          // Qrup matçlarını yarat (league_matches cədvəlinə, group_id ilə)
          const fixtures = generateGroupFixtures(members, legs)
          const matchesToInsert = fixtures.map(f => ({
            tournament_id:        tournamentId,
            group_id:             group.id,
            home_participant_id:  f.home_participant_id,
            away_participant_id:  f.away_participant_id,
            round_no:             f.round_no,
            round:                f.round_no,
            match_status:         'scheduled',
          }))

          const { error: mErr } = await supabase.from('league_matches').insert(matchesToInsert)
          if (mErr) return { error: `Qrup ${label} matçları yaradılmadı: ${mErr.message}` }
        }
      }

      // Standings yarat
      const { data: existingStandings } = await supabase
        .from('tournament_standings').select('participant_id').eq('tournament_id', tournamentId)
      const existingStandingIds = new Set((existingStandings || []).map((s: any) => s.participant_id))

      const standingsToInsert = allParticipantIds
        .filter(pid => !existingStandingIds.has(pid))
        .map((pid, idx) => ({
          tournament_id: tournamentId, participant_id: pid,
          played: 0, wins: 0, draws: 0, losses: 0,
          goals_for: 0, goals_against: 0, goal_difference: 0, points: 0, rank: idx + 1,
        }))

      if (standingsToInsert.length > 0) {
        const { error: stErr } = await supabase.from('tournament_standings').insert(standingsToInsert)
        if (stErr) return { error: `Standings yaradılmadı: ${stErr.message}` }
      }

      await supabase.from('tournaments').update({
        status: 'ongoing', competition_stage: 'league',
      }).eq('id', tournamentId)

      revalidatePath('/admin/tournaments')
      revalidatePath('/tournaments')

      const totalMatches = groupCount * (legs === 1 ? 6 : 12)
      return { success: `✅ 16 nəfərlik turnir başladı! 4 qrup × ${legs === 1 ? '6' : '12'} matç = ${totalMatches} matç yaradıldı. Qrup bitmədən playoff yaradılmayacaq.` }
    }

    // ════════════════════════════════════════════════════════
    // FORMAT 3: swiss_36 — Swiss Liqa + Playoff + Final bracket
    // ════════════════════════════════════════════════════════
    if (t.tournament_type === 'swiss_36') {
      const leagueMatchCount = t.league_match_count ?? 8

      // Standings yarat
      const { data: existingStandings } = await supabase
        .from('tournament_standings').select('participant_id').eq('tournament_id', tournamentId)
      const existingStandingIds = new Set((existingStandings || []).map((s: any) => s.participant_id))

      const standingsToInsert = allParticipantIds
        .filter(pid => !existingStandingIds.has(pid))
        .map((pid, idx) => ({
          tournament_id: tournamentId, participant_id: pid,
          played: 0, wins: 0, draws: 0, losses: 0,
          goals_for: 0, goals_against: 0, goal_difference: 0, points: 0, rank: idx + 1,
        }))

      if (standingsToInsert.length > 0) {
        const { error: stErr } = await supabase.from('tournament_standings').insert(standingsToInsert)
        if (stErr) return { error: `Standings yaradılmadı: ${stErr.message}` }
      }

      // Swiss fikstürləri yarat
      const { data: existingMatches } = await supabase
        .from('league_matches').select('id').eq('tournament_id', tournamentId)

      if (!existingMatches || existingMatches.length === 0) {
        const fixtures = generateSwissFixtures(allParticipantIds, leagueMatchCount)
        if (fixtures.length === 0) return { error: 'Fikstürlər generate edilə bilmədi.' }

        const matchesToInsert = fixtures.map(f => ({
          tournament_id:        tournamentId,
          home_participant_id:  f.home_participant_id,
          away_participant_id:  f.away_participant_id,
          round_no:             f.round_no,
          round:                f.round_no,
          match_status:         'scheduled',
        }))

        const BATCH = 50
        for (let i = 0; i < matchesToInsert.length; i += BATCH) {
          const { error: mErr } = await supabase.from('league_matches').insert(matchesToInsert.slice(i, i + BATCH))
          if (mErr) return { error: `Matçlar əlavə edilmədi: ${mErr.message}` }
        }
      }

      await supabase.from('tournaments').update({
        status: 'ongoing', competition_stage: 'league',
      }).eq('id', tournamentId)

      revalidatePath('/admin/tournaments')
      revalidatePath('/tournaments')
      revalidatePath('/my-matches')

      return {
        success: `✅ Swiss liqa başladı! ${allParticipantIds.length} iştirakçı, hər biri ${leagueMatchCount} matç. Liqa bitdikdən sonra playoff + final bracket yaradılacaq.`,
      }
    }

    return { error: 'Naməlum turnir növü.' }

  } catch (err: any) {
    return { error: err.message || 'Xəta baş verdi.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADVANCE TO NEXT STAGE
// Liqa/qrup bitdikdən sonra admin bu funksiyanı çağırır.
// Növbəti mərhələ üçün knockout ties yaradır.
// ─────────────────────────────────────────────────────────────────────────────

export type AdvanceStageState = { error?: string; success?: string }

export async function advanceToNextStage(
  _prevState: AdvanceStageState,
  formData: FormData
): Promise<AdvanceStageState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return { error: 'İcazən yoxdur.' }

  const tournamentId = String(formData.get('tournament_id') || '').trim()
  if (!tournamentId) return { error: 'Turnir ID tapılmadı.' }

  const { data: t } = await supabase
    .from('tournaments')
    .select('id, tournament_type, competition_stage, group_legs')
    .eq('id', tournamentId).single()

  if (!t) return { error: 'Turnir tapılmadı.' }

  try {
    // ── swiss_36: Liqa → Playoff mərhələsi ──────────────────────────────────
    if (t.tournament_type === 'swiss_36' && t.competition_stage === 'league') {
      // Cədvəldən sıralanmış iştirakçıları al
      const { data: standings } = await supabase
        .from('tournament_standings')
        .select('participant_id, rank')
        .eq('tournament_id', tournamentId)
        .order('rank', { ascending: true })

      if (!standings || standings.length < 16) {
        return { error: 'Cədvəldə kifayət qədər iştirakçı yoxdur.' }
      }

      // 9-24cü yerlər → Play-off (16 oyunçu, 8 cüt)
      // 25+ çıxır, 1-8 birbaşa round_of_16-ya keçir
      const playoffParticipants = standings.slice(8, 24).map((s: any) => s.participant_id)

      if (playoffParticipants.length < 2) {
        return { error: 'Play-off üçün kifayət qədər iştirakçı yoxdur.' }
      }

      // Mövcud playoff ties yoxla
      const { data: existingTies } = await supabase
        .from('knockout_ties').select('id')
        .eq('tournament_id', tournamentId).eq('stage', 'playoff')

      if (!existingTies || existingTies.length === 0) {
        // Playoff: 8 cüt, hər biri 2 oyun
        for (let i = 0; i < playoffParticipants.length - 1; i += 2) {
          const a = playoffParticipants[i]
          const b = playoffParticipants[i + 1]
          if (!b) continue
          await createKnockoutTie(supabase, tournamentId, 'playoff', a, b, `PO${i / 2 + 1}`, 2)
        }
      }

      await supabase.from('tournaments').update({ competition_stage: 'playoff' }).eq('id', tournamentId)
      revalidatePath('/admin/tournaments')
      revalidatePath('/tournaments')
      return { success: '✅ Play-off mərhələsi yaradıldı! 8 cüt × 2 oyun.' }
    }

    // ── swiss_36: Playoff → Round of 16 ────────────────────────────────────
    if (t.tournament_type === 'swiss_36' && t.competition_stage === 'playoff') {
      const { data: standings } = await supabase
        .from('tournament_standings')
        .select('participant_id, rank')
        .eq('tournament_id', tournamentId)
        .order('rank', { ascending: true })

      // Top 8 birbaşa keçənlər
      const direct8 = (standings || []).slice(0, 8).map((s: any) => s.participant_id)

      // Playoff qaliblərini al
      const { data: playoffTies } = await supabase
        .from('knockout_ties')
        .select('id, winner_participant_id, tie_status')
        .eq('tournament_id', tournamentId)
        .eq('stage', 'playoff')

      const playoffWinners = (playoffTies || [])
        .filter((tie: any) => tie.tie_status === 'completed' && tie.winner_participant_id)
        .map((tie: any) => tie.winner_participant_id)

      if (playoffWinners.length < 8) {
        return { error: `Hələ bütün play-off oyunları bitməyib. Tamamlanan: ${playoffWinners.length}/8` }
      }

      const r16Participants = [...direct8, ...playoffWinners] // 16 oyunçu

      const { data: existingR16 } = await supabase
        .from('knockout_ties').select('id')
        .eq('tournament_id', tournamentId).eq('stage', 'round_of_16')

      if (!existingR16 || existingR16.length === 0) {
        const shuffledR16 = shuffle(r16Participants)
        for (let i = 0; i < shuffledR16.length - 1; i += 2) {
          const a = shuffledR16[i]
          const b = shuffledR16[i + 1]
          if (!b) continue
          await createKnockoutTie(supabase, tournamentId, 'round_of_16', a, b, `R16-${i / 2 + 1}`, 2)
        }
      }

      await supabase.from('tournaments').update({ competition_stage: 'round_of_16' }).eq('id', tournamentId)
      revalidatePath('/admin/tournaments')
      revalidatePath('/tournaments')
      return { success: '✅ 1/8 Final yaradıldı! 8 cüt × 2 oyun.' }
    }

    // ── group_knockout_16: Qrup → Çərək Final ──────────────────────────────
    if (t.tournament_type === 'group_knockout_16' && t.competition_stage === 'league') {
      // Hər qrupdan TOP 2 oyunçunu tap
      const { data: groups } = await supabase
        .from('tournament_groups')
        .select('id, group_label')
        .eq('tournament_id', tournamentId)
        .order('group_index', { ascending: true })

      if (!groups || groups.length === 0) return { error: 'Qruplar tapılmadı.' }

      const qualifiers: { groupLabel: string; participantId: string; position: number }[] = []

      for (const group of groups) {
        const { data: members } = await supabase
          .from('group_members')
          .select('participant_id, position')
          .eq('group_id', group.id)
          .order('position', { ascending: true })

        if (!members) continue

        // Qrup standings-dən sıralama al
        const memberIds = members.map((m: any) => m.participant_id)
        const { data: groupStandings } = await supabase
          .from('tournament_standings')
          .select('participant_id, points, goal_difference, goals_for, rank')
          .eq('tournament_id', tournamentId)
          .in('participant_id', memberIds)
          .order('points', { ascending: false })
          .order('goal_difference', { ascending: false })
          .order('goals_for', { ascending: false })

        const top2 = (groupStandings || []).slice(0, 2)
        top2.forEach((s: any, idx: number) => {
          qualifiers.push({ groupLabel: group.group_label, participantId: s.participant_id, position: idx + 1 })
        })
      }

      if (qualifiers.length < 8) {
        return { error: `Hələ bütün qrup oyunları bitməyib. Keçən oyunçu: ${qualifiers.length}` }
      }

      // Çərək final bracketi: A1 vs B2, B1 vs A2, C1 vs D2, D1 vs C2
      // groups: [A, B, C, D], qualifiers sıra ilə
      const byGroup: Record<string, string[]> = {}
      for (const q of qualifiers) {
        if (!byGroup[q.groupLabel]) byGroup[q.groupLabel] = []
        byGroup[q.groupLabel].push(q.participantId)
      }

      const groupLabels = groups.map((g: any) => g.group_label)
      const qfPairs: [string, string][] = []

      // A1 vs B2, B1 vs A2 (cross-qrup)
      for (let i = 0; i < groupLabels.length; i += 2) {
        const g1 = groupLabels[i]
        const g2 = groupLabels[i + 1]
        if (!g1 || !g2) continue
        const g1members = byGroup[g1] || []
        const g2members = byGroup[g2] || []
        if (g1members[0] && g2members[1]) qfPairs.push([g1members[0], g2members[1]])
        if (g2members[0] && g1members[1]) qfPairs.push([g2members[0], g1members[1]])
      }

      const { data: existingQF } = await supabase
        .from('knockout_ties').select('id')
        .eq('tournament_id', tournamentId).eq('stage', 'quarterfinal')

      if (!existingQF || existingQF.length === 0) {
        for (let i = 0; i < qfPairs.length; i++) {
          const [a, b] = qfPairs[i]
          await createKnockoutTie(supabase, tournamentId, 'quarterfinal', a, b, `QF${i + 1}`, 2)
        }
      }

      await supabase.from('tournaments').update({ competition_stage: 'quarterfinal' }).eq('id', tournamentId)
      revalidatePath('/admin/tournaments')
      revalidatePath('/tournaments')
      return { success: `✅ Çərək final yaradıldı! ${qfPairs.length} cüt × 2 oyun.` }
    }

    // ── Ümumi: Yarımfinal → Final, Çərək Final → Yarımfinal ─────────────────
    const stageFlow: Record<string, { next: string; label: string }> = {
      quarterfinal: { next: 'semifinal',   label: 'Yarımfinal' },
      round_of_16:  { next: 'quarterfinal', label: 'Çərək Final' },
      semifinal:    { next: 'final',        label: 'Final' },
    }

    const flow = stageFlow[t.competition_stage]
    if (!flow) return { error: `Bu mərhələdən (${t.competition_stage}) irəliləmə mümkün deyil.` }

    // Cari mərhələnin qaliblərini al
    const { data: currentTies } = await supabase
      .from('knockout_ties')
      .select('id, winner_participant_id, tie_status, participant_a_id, participant_b_id')
      .eq('tournament_id', tournamentId)
      .eq('stage', t.competition_stage)

    const winners = (currentTies || [])
      .filter((tie: any) => tie.tie_status === 'completed' && tie.winner_participant_id)
      .map((tie: any) => tie.winner_participant_id)

    const expectedCount = (currentTies || []).length
    if (winners.length < expectedCount) {
      return { error: `Hələ bütün oyunlar bitməyib. Tamamlanan: ${winners.length}/${expectedCount}` }
    }

    // Mövcud ties yoxla
    const { data: existingNext } = await supabase
      .from('knockout_ties').select('id')
      .eq('tournament_id', tournamentId).eq('stage', flow.next)

    if (!existingNext || existingNext.length === 0) {
      const isLegCount = flow.next === 'final' ? 1 : 2

      if (flow.next === 'final') {
        // Final: 1 oyun, 1 cüt
        if (winners.length >= 2) {
          await createKnockoutTie(supabase, tournamentId, 'final', winners[0], winners[1], 'Final', 1)
        }
      } else {
        // Digər mərhələlər: 2 oyun
        const shuffledW = shuffle(winners)
        for (let i = 0; i < shuffledW.length - 1; i += 2) {
          const a = shuffledW[i]
          const b = shuffledW[i + 1]
          if (!b) continue
          await createKnockoutTie(supabase, tournamentId, flow.next, a, b, `${flow.label.substring(0, 2).toUpperCase()}${i / 2 + 1}`, isLegCount as 1 | 2)
        }
      }
    }

    await supabase.from('tournaments').update({ competition_stage: flow.next }).eq('id', tournamentId)
    revalidatePath('/admin/tournaments')
    revalidatePath('/tournaments')

    const legNote = flow.next === 'final' ? '1 oyun (final)' : '2 oyun (ev + cavab)'
    return { success: `✅ ${flow.label} yaradıldı! ${legNote}.` }

  } catch (err: any) {
    return { error: err.message || 'Xəta baş verdi.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// END TOURNAMENT
// ─────────────────────────────────────────────────────────────────────────────

export type EndTournamentState = { error?: string; success?: string }

export async function endTournament(
  _prevState: EndTournamentState,
  formData: FormData
): Promise<EndTournamentState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return { error: 'İcazən yoxdur.' }

  const tournamentId = String(formData.get('tournament_id') || '').trim()
  if (!tournamentId) return { error: 'Turnir ID tapılmadı.' }

  const { data: tournament } = await supabase
    .from('tournaments').select('id, status').eq('id', tournamentId).single()

  if (!tournament) return { error: 'Turnir tapılmadı.' }
  if (tournament.status !== 'ongoing') return { error: 'Turnir davam etmir.' }

  const { error } = await supabase.from('tournaments')
    .update({ status: 'completed', competition_stage: 'finished' }).eq('id', tournamentId)

  if (error) return { error: `Status yenilənmədi: ${error.message}` }

  revalidatePath('/admin/tournaments')
  revalidatePath('/tournaments')
  return { success: 'Turnir tamamlandı.' }
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE TOURNAMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function updateTournament(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') throw new Error('İcazən yoxdur')

  const id                    = String(formData.get('id') || '').trim()
  const title                 = String(formData.get('title') || '').trim()
  const platform              = String(formData.get('platform') || '').trim()
  const format                = String(formData.get('format') || '1v1').trim()
  const tournament_type       = String(formData.get('tournament_type') || 'swiss_36').trim()
  const group_legs            = Number(formData.get('group_legs') || 1)
  const entry_fee             = Number(formData.get('entry_fee') || 0)
  const prize_amount          = Number(formData.get('prize_amount') || 0)
  const max_players           = Number(formData.get('max_players') || 0)
  const league_match_count    = Number(formData.get('league_match_count') || 8)
  const registration_deadline = String(formData.get('registration_deadline') || '')
  const start_time            = String(formData.get('start_time') || '')
  const description           = String(formData.get('description') || '').trim()
  const rules                 = String(formData.get('rules') || '').trim()
  const status                = String(formData.get('status') || 'draft').trim()

  if (!id || !title || !platform || !registration_deadline || !start_time || !max_players) {
    throw new Error('Bütün vacib sahələri doldur')
  }

  const slug = slugify(title)
  const { error } = await supabase.from('tournaments').update({
    title, slug, platform, format, tournament_type, group_legs,
    entry_fee, prize_amount, max_players, league_match_count,
    registration_deadline, start_time, description, rules, status,
  }).eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/tournaments')
  revalidatePath('/tournaments')
  redirect('/admin/tournaments')
}

// ─────────────────────────────────────────────────────────────────────────────
// SET FEATURED TOURNAMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function setFeaturedTournament(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') throw new Error('İcazən yoxdur')

  const tournamentId = String(formData.get('tournament_id') || '')
  if (!tournamentId) throw new Error('Turnir ID tapılmadı')

  await supabase.from('tournaments').update({ is_featured: false }).eq('is_featured', true)
  const { error } = await supabase.from('tournaments').update({ is_featured: true }).eq('id', tournamentId)
  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/tournaments')
  revalidatePath('/admin/tournaments')
}
