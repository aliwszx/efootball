import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { joinTournament } from '@/app/actions/tournaments'

type TournamentDetailPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ success?: string }>
}

export default async function TournamentDetailPage({
  params,
  searchParams,
}: TournamentDetailPageProps) {
  const { slug } = await params
  const { success } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('slug', slug)
    .single()

  if (tournamentError || !tournament) {
    notFound()
  }

  let alreadyJoined = false
  let confirmedCount = 0
  let registrationStatus: string | null = null

  const { count } = await supabase
    .from('tournament_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournament.id)
    .eq('registration_status', 'confirmed')

  confirmedCount = count || 0

  const { data: players } = await supabase
    .from('tournament_registrations')
    .select(`
      id,
      registration_status,
      profiles (
        id,
        username
      )
    `)
    .eq('tournament_id', tournament.id)
    .eq('registration_status', 'confirmed')

  if (user) {
    const { data: registration } = await supabase
      .from('tournament_registrations')
      .select('id, registration_status')
      .eq('tournament_id', tournament.id)
      .eq('user_id', user.id)
      .neq('registration_status', 'cancelled')
      .maybeSingle()

    alreadyJoined = !!registration
    registrationStatus = registration?.registration_status || null
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
            <span className="rounded-full border border-[#C50337]/20 bg-[#C50337]/10 px-4 py-1 text-sm text-[#ff4d6d]">
              {tournament.platform}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-zinc-300">
              {tournament.format}
            </span>
            <span className="rounded-full border border-[#C50337]/20 bg-[#C50337]/10 px-4 py-1 text-sm text-[#ff4d6d]">
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
            <h2 className="mb-4 text-2xl font-semibold">Qoşulanlar</h2>

            {players && players.length > 0 ? (
              <div className="flex flex-wrap gap-3">
  {players.map((player: any, index: number) => {
    const profile = Array.isArray(player.profiles)
      ? player.profiles[0]
      : player.profiles

    return (
      <div
        key={player.id}
        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C50337]/10 text-xs font-bold text-[#ff4d6d]">
          {index + 1}
        </div>

        <span className="text-sm">
          {profile?.username || 'user'}
        </span>
      </div>
    )
  })}
</div>
            ) : (
              <p className="text-sm text-zinc-400">Hələ qoşulan yoxdur.</p>
            )}
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
            {/* Yeni qoşulma uğurlu mesajı */}
            {success === 'joined_pending' && (
              <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
                <p className="text-sm font-semibold text-amber-300">⏳ Qeydiyyatın qəbul edildi!</p>
                <p className="mt-1 text-xs text-amber-400/80">
                  Ödənişin admin tərəfindən təsdiqlənməsini gözlə. Təsdiq edildikdən sonra turnirdə görünəcəksən.
                </p>
              </div>
            )}

            {!user && (
              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-4 text-yellow-200">
                Turnirə qoşulmaq üçün əvvəl login olmalısan.
              </div>
            )}

            {/* Pending - ödəniş gözlənilir */}
            {user && alreadyJoined && registrationStatus === 'pending' && success !== 'joined_pending' && (
              <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
                <p className="text-sm font-semibold text-amber-300">⏳ Ödəniş gözlənilir</p>
                <p className="mt-1 text-xs text-amber-400/80">
                  Qeydiyyatın qəbul edilib, admin ödənişini təsdiq etməsini gözlə.
                </p>
              </div>
            )}

            {/* Confirmed - tam qoşulub */}
            {user && alreadyJoined && registrationStatus === 'confirmed' && (
              <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4">
                <p className="text-sm font-semibold text-emerald-300">✓ Turnirdə iştirak edirsən</p>
                <p className="mt-1 text-xs text-emerald-400/80">
                  Ödənişin təsdiqlənib. Turnir başlama vaxtını gözlə.
                </p>
              </div>
            )}

            {user && deadlinePassed && !alreadyJoined && (
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
              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-[#C50337] to-[#8B0224] px-5 py-4 text-base font-semibold text-white transition hover:scale-[1.01] sm:text-lg"
              >
                Turnirə qoşul
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
