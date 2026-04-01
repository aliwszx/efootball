import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MyTournamentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: registrations, error } = await supabase
    .from('tournament_registrations')
    .select(`
      id,
      registration_status,
      created_at,
      tournaments (
        id,
        title,
        slug,
        platform,
        format,
        start_time,
        status
      ),
      payments (
        id,
        status,
        amount,
        currency,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold">Mənim turnirlərim</h1>

        {error && (
          <p className="rounded-lg border border-red-400/20 bg-red-500/10 p-4 text-red-200">
            Xəta: {error.message}
          </p>
        )}

        {!registrations?.length ? (
          <p className="text-zinc-300">Hələ heç bir turnirə qoşulmamısan.</p>
        ) : (
          <div className="space-y-4">
            {registrations.map((item: any) => {
              const tournament = Array.isArray(item.tournaments)
                ? item.tournaments[0]
                : item.tournaments

              const payment = Array.isArray(item.payments)
                ? item.payments[0]
                : item.payments

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
                >
                  <h2 className="mb-2 text-xl font-semibold">
                    {tournament?.title || 'Adsız turnir'}
                  </h2>

                  <p className="mb-1 text-zinc-300">
                    Platform: {tournament?.platform || '-'}
                  </p>

                  <p className="mb-1 text-zinc-300">
                    Format: {tournament?.format || '-'}
                  </p>

                  <p className="mb-1 text-zinc-300">
                    Turnir statusu: {tournament?.status || '-'}
                  </p>

                  <p className="mb-1 text-zinc-300">
                    Qeydiyyat statusu: {item.registration_status || '-'}
                  </p>

                  <p className="mb-1 text-zinc-300">
                    Ödəniş statusu: {payment?.status || 'pending'}
                  </p>

                  <p className="mb-1 text-zinc-300">
                    Məbləğ: {payment?.amount ?? '-'} {payment?.currency || ''}
                  </p>

                  <p className="mb-4 text-zinc-300">
                    Başlama vaxtı:{' '}
                    {tournament?.start_time
                      ? new Date(tournament.start_time).toLocaleString()
                      : '-'}
                  </p>

                  <Link
                    href={`/tournaments/${tournament?.slug}`}
                    className="inline-block rounded-lg border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10"
                  >
                    Turnirə bax
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
