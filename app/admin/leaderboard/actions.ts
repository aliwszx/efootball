'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type UpsertLeaderboardState = {
  error?: string
  success?: string
}

function calculatePoints(
  wins: number,
  draws: number,
  playoffBonus: number,
  finalBonus: number
) {
  return wins * 3 + draws * 1 + playoffBonus + finalBonus
}

export async function upsertLeaderboardEntry(
  _prevState: UpsertLeaderboardState,
  formData: FormData
): Promise<UpsertLeaderboardState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Əvvəlcə daxil ol.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Bu əməliyyat üçün icazən yoxdur.' }
  }

  const entryId = String(formData.get('entry_id') || '').trim()
  const userId = String(formData.get('user_id') || '').trim()
  const tournamentId = String(formData.get('tournament_id') || '').trim()

  const wins = Number(formData.get('wins') || 0)
  const draws = Number(formData.get('draws') || 0)
  const playoffQualified = formData.get('playoff_qualified') === 'on'
  const reachedFinal = formData.get('reached_final') === 'on'

  if (!userId || !tournamentId) {
    return { error: 'User və ya turnir tapılmadı.' }
  }

  if (wins < 0 || draws < 0) {
    return { error: 'Wins və draws mənfi ola bilməz.' }
  }

  const playoffBonus = playoffQualified ? 2 : 0
  const finalBonus = reachedFinal ? 4 : 0
  const totalPoints = calculatePoints(wins, draws, playoffBonus, finalBonus)

  if (entryId) {
    const { error } = await supabase
      .from('leaderboard_entries')
      .update({
        wins,
        draws,
        playoff_bonus: playoffBonus,
        final_bonus: finalBonus,
        total_points: totalPoints,
        updated_at: new Date().toISOString(),
      })
      .eq('id', entryId)

    if (error) {
      return { error: error.message }
    }
  } else {
    const { error } = await supabase
      .from('leaderboard_entries')
      .insert({
        user_id: userId,
        tournament_id: tournamentId,
        wins,
        draws,
        playoff_bonus: playoffBonus,
        final_bonus: finalBonus,
        total_points: totalPoints,
      })

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath('/leaderboard')
  revalidatePath('/admin/leaderboard')

  return { success: 'Leaderboard yeniləndi.' }
}
