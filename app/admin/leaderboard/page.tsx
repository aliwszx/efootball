import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EntryForm from './entry-form'

export default async function AdminLeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile || profile.role !== 'admin') redirect('/profile')

  const { data: registrations } = await supabase
    .from('tournament_registrations')
    .select(`
      id, user_id, tournament_id, registration_status,
      profiles:user_id (id, username, full_name),
      tournaments:tournament_id (id, title, slug)
    `)
    .order('created_at', { ascending: false })

  const { data: entries } = await supabase.from('leaderboard_entries').select('*')
  const entryMap = new Map((entries || []).map((e: any) => [`${e.user_id}_${e.tournament_id}`, e]))

  return (
    <main className="min-h-screen px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[28px] border border-[#C50337]/20 bg-[#C50337]/5 p-7 backdrop-blur-xl sm:p-10">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#C50337]/10 via-transparent to-[#8B0224]/5" />
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#C50337]/25 bg-[#C50337]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff4d6d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff4d6d]" /> Admin Panel
          </div>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl" style={{ fontFamily: 'var(--font-poppins)' }}>Leaderboard idarəsi</h1>
          <p className="mt-3 text-sm text-zinc-400">
            Qələbə = <span className="text-zinc-300">3 xal</span>, Bərabərlik = <span className="text-zinc-300">1 xal</span>, Playoff = <span className="text-zinc-300">+2 xal</span>, Final = <span className="text-zinc-300">+4 xal</span>
          </p>
        </section>

        <div className="mt-6 space-y-4">
          {!registrations?.length ? (
            <div className="rounded-[24px] border border-[#C50337]/10 bg-[#C50337]/4 p-8 text-center text-zinc-500">
              Hələ registration yoxdur.
            </div>
          ) : registrations.map((item: any) => {
            const p = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
            const t = Array.isArray(item.tournaments) ? item.tournaments[0] : item.tournaments
            const key = `${item.user_id}_${item.tournament_id}`
            const entry = entryMap.get(key)

            return (
              <div key={item.id}
                className="grid gap-4 rounded-[24px] border border-[#C50337]/10 bg-[#C50337]/4 p-5 backdrop-blur-xl lg:grid-cols-[1fr_380px]">
                <div>
                  <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>
                    {p?.full_name || p?.username || 'User'}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">@{p?.username || '-'}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
                    <span>Turnir: <span className="text-zinc-300">{t?.title || '-'}</span></span>
                    <span>Status: <span className="text-zinc-300">{item.registration_status || '-'}</span></span>
                  </div>
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
          })}
        </div>
      </div>
    </main>
  )
}
