'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function createTournament(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new Error('Bu emeliyyat ucun icazen yoxdur')
  }

  const title = String(formData.get('title') || '').trim()
  const platform = String(formData.get('platform') || '').trim()
  const format = String(formData.get('format') || '1v1').trim()
  const entry_fee = Number(formData.get('entry_fee') || 0)
  const prize_amount = Number(formData.get('prize_amount') || 0)
  const max_players = Number(formData.get('max_players') || 0)
  const registration_deadline = String(formData.get('registration_deadline') || '')
  const start_time = String(formData.get('start_time') || '')
  const description = String(formData.get('description') || '').trim()
  const rules = String(formData.get('rules') || '').trim()
  const status = String(formData.get('status') || 'draft').trim()

  if (!title || !platform || !registration_deadline || !start_time || !max_players) {
    throw new Error('Butun vacib saheleri doldur')
  }

  const slug = slugify(title)

  const { error } = await supabase.from('tournaments').insert({
    title,
    slug,
    game: 'eFootball',
    platform,
    format,
    entry_fee,
    prize_amount,
    max_players,
    registration_deadline,
    start_time,
    description,
    rules,
    status,
    created_by: user.id,
  })

  if (error) {
    if (error.message.toLowerCase().includes('duplicate')) {
      throw new Error('Bu adda slug artiq movcuddur, basligi deyis')
    }
    throw new Error(error.message)
  }

  redirect('/tournaments')
}

export async function joinTournament(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const tournamentId = String(formData.get('tournament_id') || '').trim()
  const tournamentSlug = String(formData.get('tournament_slug') || '').trim()

  if (!tournamentId || !tournamentSlug) {
    throw new Error('DEBUG: missing tournament data')
  }

  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('id, slug, title, status, max_players, registration_deadline, entry_fee')
    .eq('id', tournamentId)
    .single()

  if (tournamentError || !tournament) {
    throw new Error(`DEBUG tournament error: ${tournamentError?.message || 'not found'}`)
  }

  if (tournament.status !== 'open') {
    throw new Error(`DEBUG closed: status=${tournament.status}`)
  }

  const now = new Date()
  const deadline = new Date(tournament.registration_deadline)

  if (deadline < now) {
    throw new Error('DEBUG deadline passed')
  }

  const { count, error: countError } = await supabase
    .from('tournament_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournament.id)
    .eq('registration_status', 'confirmed')

  if (countError) {
    throw new Error(`DEBUG count error: ${countError.message}`)
  }

  if ((count || 0) >= tournament.max_players) {
    throw new Error('DEBUG full')
  }

  const { data: existing, error: existingError } = await supabase
    .from('tournament_registrations')
    .select('id, registration_status')
    .eq('tournament_id', tournament.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingError) {
    throw new Error(`DEBUG existing error: ${existingError.message}`)
  }

  if (existing && existing.registration_status !== 'cancelled') {
    throw new Error(
      `DEBUG already joined: id=${existing.id}, status=${existing.registration_status}`
    )
  }

  const { data: registration, error: registrationError } = await supabase
    .from('tournament_registrations')
    .insert({
      tournament_id: tournament.id,
      user_id: user.id,
      registration_status: 'pending',
    })
    .select('id')
    .single()

  if (registrationError || !registration) {
    throw new Error(
      `DEBUG registration insert error: ${registrationError?.message || 'unknown'}`
    )
  }

  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      user_id: user.id,
      tournament_id: tournament.id,
      registration_id: registration.id,
      provider: 'manual',
      amount: tournament.entry_fee,
      currency: 'AZN',
      status: 'pending',
    })

  if (paymentError) {
    throw new Error(`DEBUG payment insert error: ${paymentError.message}`)
  }

  redirect(`/tournaments/${tournamentSlug}?success=joined_pending`)
}

export async function updateTournament(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') {
    throw new Error('Bu əməliyyat üçün icazən yoxdur')
  }

  const id = String(formData.get('id') || '').trim()
  const title = String(formData.get('title') || '').trim()
  const platform = String(formData.get('platform') || '').trim()
  const format = String(formData.get('format') || '1v1').trim()
  const entry_fee = Number(formData.get('entry_fee') || 0)
  const prize_amount = Number(formData.get('prize_amount') || 0)
  const max_players = Number(formData.get('max_players') || 0)
  const registration_deadline = String(formData.get('registration_deadline') || '')
  const start_time = String(formData.get('start_time') || '')
  const description = String(formData.get('description') || '').trim()
  const rules = String(formData.get('rules') || '').trim()
  const status = String(formData.get('status') || 'draft').trim()

  if (!id || !title || !platform || !registration_deadline || !start_time || !max_players) {
    throw new Error('Bütün vacib sahələri doldur')
  }

  const slug = slugify(title)

  const { error } = await supabase.from('tournaments').update({
    title,
    slug,
    platform,
    format,
    entry_fee,
    prize_amount,
    max_players,
    registration_deadline,
    start_time,
    description,
    rules,
    status,
  }).eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/tournaments')
  revalidatePath('/tournaments')
  redirect('/admin/tournaments')
}

export async function setFeaturedTournament(formData: FormData) {
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
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new Error('Bu əməliyyat üçün icazən yoxdur')
  }

  const tournamentId = String(formData.get('tournament_id') || '')

  if (!tournamentId) {
    throw new Error('Turnir ID tapılmadı')
  }

  const { error: resetError } = await supabase
    .from('tournaments')
    .update({ is_featured: false })
    .eq('is_featured', true)

  if (resetError) {
    throw new Error(resetError.message)
  }

  const { error: setError } = await supabase
    .from('tournaments')
    .update({ is_featured: true })
    .eq('id', tournamentId)

  if (setError) {
    throw new Error(setError.message)
  }

  revalidatePath('/')
  revalidatePath('/tournaments')
  revalidatePath('/admin/tournaments')
}

export type StartTournamentState = { error?: string; success?: string }

// ─── UCL Swiss System: hər komanda üçün 8 oyun (4 ev + 4 səfər) generate edir ───
// Alqoritm:
//   1. İştirakçıları qarışdır (random shuffle)
//   2. Round-robin cüt siyahısından keç, hər tur üçün optimal ev/səfər balansını saxla
//   3. Hər komandanın tam olaraq 8 oyunu olana qədər davam et
//   4. Eyni iki komanda bir-biri ilə 2 dəfədən çox oynaya bilməz
function generateSwissFixtures(
  participantIds: string[]
): Array<{ home_participant_id: string; away_participant_id: string; round: number }> {
  const n = participantIds.length
  // Hər komanda üçün ev/səfər sayacı
  const homeCount = new Map<string, number>()
  const awayCount = new Map<string, number>()
  const matchCount = new Map<string, number>() // toplam oyun sayı
  const pairCount = new Map<string, number>()  // iki komanda arasında oyun sayı

  for (const id of participantIds) {
    homeCount.set(id, 0)
    awayCount.set(id, 0)
    matchCount.set(id, 0)
  }

  const pairKey = (a: string, b: string) => [a, b].sort().join('|')

  const fixtures: Array<{ home_participant_id: string; away_participant_id: string; round: number }> = []

  // Hər komanda üçün hədəf: 8 oyun (4 ev + 4 səfər)
  const TARGET_MATCHES = 8
  const TARGET_HOME = 4
  const TARGET_AWAY = 4
  const MAX_PAIR = 1 // Eyni cütlük yalnız 1 dəfə oynayır (UCL kimi)

  // Turu idarə et — maksimum n/2 oyun/tur
  let round = 1
  const maxRounds = TARGET_MATCHES * 2 // Təhlükəsizlik limiti

  while (round <= maxRounds) {
    // Hələ oyun oynamalı olan komandaları tap
    const available = participantIds.filter(
      (id) => (matchCount.get(id) ?? 0) < TARGET_MATCHES
    )

    if (available.length < 2) break

    // Qarışdır
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]]
    }

    const usedThisRound = new Set<string>()
    let foundAny = false

    for (let i = 0; i < available.length; i++) {
      const a = available[i]
      if (usedThisRound.has(a)) continue
      if ((matchCount.get(a) ?? 0) >= TARGET_MATCHES) continue

      for (let j = i + 1; j < available.length; j++) {
        const b = available[j]
        if (usedThisRound.has(b)) continue
        if ((matchCount.get(b) ?? 0) >= TARGET_MATCHES) continue

        const pk = pairKey(a, b)
        if ((pairCount.get(pk) ?? 0) >= MAX_PAIR) continue

        // Ev/səfər müəyyən et
        const aHome = homeCount.get(a) ?? 0
        const aAway = awayCount.get(a) ?? 0
        const bHome = homeCount.get(b) ?? 0
        const bAway = awayCount.get(b) ?? 0

        let home: string, away: string

        // a-nın ev ehtiyacı > b-nin ev ehtiyacı?
        const aNeedsHome = TARGET_HOME - aHome
        const bNeedsHome = TARGET_HOME - bHome

        if (aNeedsHome > bNeedsHome && aHome < TARGET_HOME) {
          home = a; away = b
        } else if (bNeedsHome > aNeedsHome && bHome < TARGET_HOME) {
          home = b; away = a
        } else if (aHome < TARGET_HOME) {
          home = a; away = b
        } else if (bHome < TARGET_HOME) {
          home = b; away = a
        } else {
          // Hər ikisi ev limitini dolduruб, bu cüt artıq mümkün deyil
          continue
        }

        // Əlavə et
        fixtures.push({ home_participant_id: home, away_participant_id: away, round })
        homeCount.set(home, (homeCount.get(home) ?? 0) + 1)
        awayCount.set(away, (awayCount.get(away) ?? 0) + 1)
        matchCount.set(home, (matchCount.get(home) ?? 0) + 1)
        matchCount.set(away, (matchCount.get(away) ?? 0) + 1)
        pairCount.set(pk, (pairCount.get(pk) ?? 0) + 1)
        usedThisRound.add(a)
        usedThisRound.add(b)
        foundAny = true
        break
      }
    }

    if (!foundAny) break
    round++
  }

  return fixtures
}

export async function startTournament(
  _prevState: StartTournamentState,
  formData: FormData
): Promise<StartTournamentState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') {
    return { error: 'Bu əməliyyat üçün icazən yoxdur.' }
  }

  const tournamentId = String(formData.get('tournament_id') || '').trim()
  if (!tournamentId) return { error: 'Turnir ID tapılmadı.' }

  // Turnir statusunu yoxla
  const { data: tournament, error: tErr } = await supabase
    .from('tournaments')
    .select('id, status, title')
    .eq('id', tournamentId)
    .single()

  if (tErr || !tournament) return { error: 'Turnir tapılmadı.' }
  if (tournament.status === 'ongoing') return { error: 'Turnir artıq başlayıb.' }
  if (tournament.status === 'completed') return { error: 'Turnir artıq tamamlanıb.' }

  // Confirmed registrationları al
  const { data: registrations, error: regErr } = await supabase
    .from('tournament_registrations')
    .select('id, user_id')
    .eq('tournament_id', tournamentId)
    .eq('registration_status', 'confirmed')

  if (regErr) return { error: `Qeydiyyatlar oxunmadı: ${regErr.message}` }
  if (!registrations || registrations.length < 2) {
    return { error: 'Ən azı 2 təsdiqlənmiş iştirakçı lazımdır.' }
  }

  // Artıq participants-də olanları yoxla (duplicate qarşısını al)
  const { data: existingParticipants } = await supabase
    .from('tournament_participants')
    .select('id, user_id')
    .eq('tournament_id', tournamentId)

  const existingUserIds = new Set((existingParticipants || []).map((p: any) => p.user_id))

  const newParticipants = registrations
    .filter((r) => !existingUserIds.has(r.user_id))
    .map((r) => ({
      tournament_id: tournamentId,
      user_id: r.user_id,
      entry_status: 'confirmed',
      registration_id: r.id,
    }))

  let allParticipantIds: string[] = (existingParticipants || []).map((p: any) => p.id)

  if (newParticipants.length > 0) {
    const { data: inserted, error: insertErr } = await supabase
      .from('tournament_participants')
      .insert(newParticipants)
      .select('id')

    if (insertErr) return { error: `Iştirakçılar əlavə edilmədi: ${insertErr.message}` }
    allParticipantIds = [...allParticipantIds, ...(inserted || []).map((p: any) => p.id)]
  }

  // ── 1. STANDINGS: Hər iştirakçı üçün boş sətir yarat ──
  // Mövcud standings-i yoxla
  const { data: existingStandings } = await supabase
    .from('tournament_standings')
    .select('participant_id')
    .eq('tournament_id', tournamentId)

  const existingStandingIds = new Set((existingStandings || []).map((s: any) => s.participant_id))

  const standingsToInsert = allParticipantIds
    .filter((pid) => !existingStandingIds.has(pid))
    .map((pid, idx) => ({
      tournament_id: tournamentId,
      participant_id: pid,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      points: 0,
      rank: idx + 1,
      updated_at: new Date().toISOString(),
    }))

  if (standingsToInsert.length > 0) {
    const { error: standingsErr } = await supabase
      .from('tournament_standings')
      .insert(standingsToInsert)

    if (standingsErr) {
      return { error: `Standings yaradılmadı: ${standingsErr.message}` }
    }
  }

  // ── 2. FİKSTÜRLƏR: UCL Swiss System ilə generate et ──
  // Artıq mövcud fikstürləri yoxla
  const { data: existingMatches } = await supabase
    .from('league_matches')
    .select('id')
    .eq('tournament_id', tournamentId)

  if (!existingMatches || existingMatches.length === 0) {
    // Swiss system fikstürlərini generate et
    const fixtures = generateSwissFixtures(allParticipantIds)

    if (fixtures.length === 0) {
      return { error: 'Fikstürlər generate edilə bilmədi. İştirakçı sayını yoxlayın.' }
    }

    const matchesToInsert = fixtures.map((f) => ({
      tournament_id: tournamentId,
      home_participant_id: f.home_participant_id,
      away_participant_id: f.away_participant_id,
      round: f.round,
      match_status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    // Batch insert (50-lik qruplarla)
    const BATCH = 50
    for (let i = 0; i < matchesToInsert.length; i += BATCH) {
      const batch = matchesToInsert.slice(i, i + BATCH)
      const { error: matchInsertErr } = await supabase
        .from('league_matches')
        .insert(batch)

      if (matchInsertErr) {
        return { error: `Matçlar əlavə edilmədi: ${matchInsertErr.message}` }
      }
    }
  }

  // ── 3. Turnir statusunu "ongoing" et ──
  const { error: updateErr } = await supabase
    .from('tournaments')
    .update({ status: 'ongoing' })
    .eq('id', tournamentId)

  if (updateErr) return { error: `Turnir statusu yenilənmədi: ${updateErr.message}` }

  revalidatePath('/admin/tournaments')
  revalidatePath('/tournaments')
  revalidatePath('/my-matches')
  revalidatePath(`/tournaments`)

  const totalParticipants = allParticipantIds.length
  const { data: createdMatches } = await supabase
    .from('league_matches')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)

  return {
    success: `✅ Turnir başladı! ${totalParticipants} iştirakçı, UCL Swiss formatında fikstürlər avtomatik yaradıldı.`,
  }
}

export type EndTournamentState = { error?: string; success?: string }

export async function endTournament(
  _prevState: EndTournamentState,
  formData: FormData
): Promise<EndTournamentState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') {
    return { error: 'Bu əməliyyat üçün icazən yoxdur.' }
  }

  const tournamentId = String(formData.get('tournament_id') || '').trim()
  if (!tournamentId) return { error: 'Turnir ID tapılmadı.' }

  const { data: tournament } = await supabase
    .from('tournaments').select('id, status').eq('id', tournamentId).single()

  if (!tournament) return { error: 'Turnir tapılmadı.' }
  if (tournament.status !== 'ongoing') return { error: 'Turnir davam etmir.' }

  const { error } = await supabase
    .from('tournaments')
    .update({ status: 'completed' })
    .eq('id', tournamentId)

  if (error) return { error: `Status yenilənmədi: ${error.message}` }

  revalidatePath('/admin/tournaments')
  revalidatePath('/tournaments')

  return { success: 'Turnir tamamlandı.' }
}
