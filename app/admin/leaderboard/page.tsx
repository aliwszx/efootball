import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EntryForm from './entry-form'

export default async function AdminLeaderboardPage() {
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

  const { data: registrations } = await supabase
    .from('tournament_registrations')
    .select(`
      id,
      user_id,
      tournament_id,
      registration_status,
      profiles:user_id (
        id,
        username,
        full_name
      ),
      tournaments:tournament_id (
        id,
        title,
        slug
      )
    `)
    .order('created_at', { ascending: false })

  const { data: entries } = await supabase
    .from('leaderboard_entries')
    .select('*')

  const entryMap = new Map(
    (entries || []).map((entry: any) => [`${entry.user_id}_${entry.tournament_id}`, entry])
  )

  return (
    <main className="min-h-screen px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-cyan-300">Admin</p>
          <h1 className="text-3xl font-bold sm:text-5xl">Leaderboard idarəsi</h1>
          <p className="mt-4 text-zinc-400">
            Qələbə = 3, bərabərlik = 1, playoff = +2, final = +4
          </p>
        </section>

        <div className="mt-8 space-y-6">
          {!registrations?.length ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-zinc-300">
              Hələ registration yoxdur.
            </div>
          ) : (
            registrations.map((item: any) => {
              const profileData = Array.isArray(item.profiles)
                ? item.profiles[0]
                : item.profiles

              const tournament = Array.isArray(item.tournaments)
                ? item.tournaments[0]
                : item.tournaments

              const key = `${item.user_id}_${item.tournament_id}`
              const entry = entryMap.get(key)

              return (
                <div
                  key={item.id}
                  className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 lg:grid-cols-[1fr_380px]"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {profileData?.full_name || profileData?.username || 'User'}
                    </h2>

                    <p className="mt-2 text-zinc-300">
                      Username: {profileData?.username || '-'}
                    </p>

                    <p className="mt-1 text-zinc-300">
                      Turnir: {tournament?.title || '-'}
                    </p>

                    <p className="mt-1 text-zinc-300">
                      Registration status: {item.registration_status || '-'}
                    </p>
                  </div>

                  <EntryForm
                    entryId={entry?.id}
                    userId={item.user_id}
                    tournamentId={item.tournament_id}
                    wins={entry?.wins || 0}
                    draws={entry?.draws || 0}
                    playoffBonus={entry?.playoff_bonus || 0}
                    finalBonus={entry?.final_bonus || 0}
                  />
                </div>
              )
            })
          )}
        </div>
      </div>
    </main>
  )
}
