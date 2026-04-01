import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { joinTournament } from '@/app/actions/tournaments'

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!tournament) {
    notFound()
  }

  let alreadyJoined = false
  let confirmedCount = 0

  const { count } = await supabase
    .from('tournament_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournament.id)
    .eq('registration_status', 'confirmed')

  confirmedCount = count || 0

  if (user) {
    const { data: registration } = await supabase
      .from('tournament_registrations')
      .select('id')
      .eq('tournament_id', tournament.id)
      .eq('user_id', user.id)
      .maybeSingle()

    alreadyJoined = !!registration
  }

  const isFull = confirmedCount >= tournament.max_players
  const deadlinePassed = new Date(tournament.registration_deadline) < new Date()
  const canJoin =
    !!user &&
    tournament.status === 'open' &&
    !alreadyJoined &&
    !isFull &&
    !deadlinePassed

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:gap-8">
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:rounded-[32px] sm:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-sm text-cyan-300">
              {tournament.platform}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-zinc-300">
              {tournament.format}
            </span>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-sm text-emerald-300">
              {tournament.status}
            </span>
          </div>

          <h1 className="text-3xl font-bold sm:text-5xl">{tournament.title}</h1>

          <p className="mt-4 max-w-3xl text-zinc-400">
            {tournament.description ||
              'Bu turnir üçün həyəcanlı rəqabət və premium iştirak təcrübəsi.'}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-zinc-400">Entry Fee</p>
              <p className="mt-2 text-2xl font-semibold">{tournament.entry_fee} AZN</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-zinc-400">Prize Pool</p>
              <p className="mt-2 text-2xl font-semibold">{tournament.prize_amount} AZN</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-zinc-400">Players</p>
              <p className="mt-2 text-2xl font-semibold">
                {confirmedCount}/{tournament.max_players}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-zinc-400">Game</p>
              <p className="mt-2 text-2xl font-semibold">{tournament.game}</p>
            </div>
          </div>

          <div className="mt-10">
            <h2 className="mb-4 text-2xl font-semibold">Qaydalar</h2>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-zinc-300">
              <p className="whitespace-pre-line">
                {tournament.rules || 'Qaydalar tezliklə əlavə olunacaq.'}
              </p>
            </div>
          </div>
        </div>

        <div className="h-fit rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:rounded-[32px] sm:p-6">
          <h2 className="text-2xl font-semibold">Turnir məlumatı</h2>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-zinc-400">Başlama vaxtı</p>
              <p className="mt-1 font-medium">
                {new Date(tournament.start_time).toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-zinc-400">Qeydiyyat deadline</p>
              <p className="mt-1 font-medium">
                {new Date(tournament.registration_deadline).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {!user && (
              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-4 text-yellow-200">
                Turnirə qoşulmaq üçün əvvəl login olmalısan.
              </div>
            )}

            {user && alreadyJoined && (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-emerald-200">
                Sən artıq bu turnirə qoşulmusan.
              </div>
            )}

            {user && deadlinePassed && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-200">
                Qeydiyyat müddəti bitib.
              </div>
            )}

            {user && isFull && !alreadyJoined && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-200">
                Turnirdə boş yer qalmayıb.
              </div>
            )}

            {user && tournament.status !== 'open' && !alreadyJoined && (
              <div className="rounded-2xl border border-zinc-400/20 bg-zinc-500/10 p-4 text-zinc-200">
                Bu turnir hazırda qeydiyyata açıq deyil.
              </div>
            )}
          </div>

          {canJoin && (
            <form action={joinTournament} className="mt-6">
              <input type="hidden" name="tournament_id" value={tournament.id} />
              <input type="hidden" name="tournament_slug" value={tournament.slug} />
              <button className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-4 text-base font-semibold text-black transition hover:scale-[1.01] sm:text-lg">
                Turnirə qoşul
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}