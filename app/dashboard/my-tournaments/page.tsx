import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function RegistrationBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
    pending:   'border-amber-500/25 bg-amber-500/10 text-amber-400',
    cancelled: 'border-zinc-500/25 bg-zinc-500/10 text-zinc-400',
  }
  const labels: Record<string, string> = {
    confirmed: '✓ Təsdiqlənib',
    pending:   '⏳ Gözləyir',
    cancelled: '✕ Ləğv edilib',
  }
  const cls = styles[status] || styles['pending']
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {labels[status] || status}
    </span>
  )
}

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
    pending:   'border-amber-500/25 bg-amber-500/10 text-amber-400',
    failed:    'border-red-500/25 bg-red-500/10 text-red-400',
  }
  const labels: Record<string, string> = {
    completed: 'Ödənilib',
    pending:   'Gözləyir',
    failed:    'Uğursuz',
  }
  const cls = styles[status] || styles['pending']
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {labels[status] || status}
    </span>
  )
}

function TournamentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open:      'border-[#C50337]/25 bg-[#C50337]/10 text-[#ff4d6d]',
    ongoing:   'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
    draft:     'border-zinc-500/25 bg-zinc-500/10 text-zinc-400',
    completed: 'border-zinc-600/25 bg-zinc-600/10 text-zinc-500',
    cancelled: 'border-red-500/25 bg-red-500/10 text-red-400',
  }
  const cls = styles[status] || styles['draft']
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  )
}

export default async function MyTournamentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
        status,
        entry_fee,
        prize_amount
      ),
      payments (
        id,
        status,
        amount,
        currency
      )
    `)
    .eq('user_id', user.id)
    .neq('registration_status', 'cancelled')
    .order('created_at', { ascending: false })

  const confirmedCount = (registrations || []).filter((r: any) => r.registration_status === 'confirmed').length
  const pendingCount = (registrations || []).filter((r: any) => r.registration_status === 'pending').length

  return (
    <main className="min-h-screen px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <section className="relative overflow-hidden rounded-[28px] border border-[#C50337]/20 bg-[#C50337]/5 p-7 backdrop-blur-xl sm:p-10">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#C50337]/10 via-transparent to-[#8B0224]/5" />
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#C50337]/25 bg-[#C50337]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff4d6d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff4d6d]" /> Hesabım
          </div>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-poppins)' }}>
            Mənim turnirlərim
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Qoşulduğun bütün turnirləri buradan izləyə bilərsən.
          </p>

          {/* Stats */}
          {(registrations?.length ?? 0) > 0 && (
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Cəmi</p>
                <p className="mt-0.5 text-xl font-bold text-white">{registrations?.length}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] px-4 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Təsdiqlənmiş</p>
                <p className="mt-0.5 text-xl font-bold text-emerald-400">{confirmedCount}</p>
              </div>
              <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.06] px-4 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Gözləyir</p>
                <p className="mt-0.5 text-xl font-bold text-amber-400">{pendingCount}</p>
              </div>
            </div>
          )}
        </section>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/8 p-4 text-sm text-red-300">
            Xəta: {error.message}
          </div>
        )}

        {/* Empty state */}
        {!registrations?.length ? (
          <div className="mt-6 rounded-[24px] border border-[#C50337]/10 bg-[#C50337]/4 p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C50337]/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#ff4d6d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /><path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              </svg>
            </div>
            <p className="text-sm font-medium text-zinc-300">Hələ heç bir turnirə qoşulmamısan.</p>
            <p className="mt-1 text-xs text-zinc-500">Aktiv turnirlərə baxıb qoşula bilərsən.</p>
            <Link href="/tournaments"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C50337] to-[#8B0224] px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02] hover:shadow-lg hover:shadow-[#C50337]/20">
              Turnirlərə bax
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {registrations.map((item: any) => {
              const tournament = Array.isArray(item.tournaments) ? item.tournaments[0] : item.tournaments
              const payment = Array.isArray(item.payments) ? item.payments[0] : item.payments

              return (
                <div key={item.id}
                  className="group rounded-[24px] border border-[#C50337]/10 bg-[#C50337]/4 p-5 backdrop-blur-xl transition hover:border-[#C50337]/18">

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left — tournament info */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>
                          {tournament?.title || 'Adsız turnir'}
                        </h2>
                        {tournament?.status && <TournamentStatusBadge status={tournament.status} />}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                        {tournament?.platform && <span>📱 {tournament.platform}</span>}
                        {tournament?.format && <span>⚔️ {tournament.format}</span>}
                        {tournament?.start_time && (
                          <span>🕐 {new Date(tournament.start_time).toLocaleString('az-AZ')}</span>
                        )}
                      </div>

                      {/* Status badges row */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase tracking-wider text-zinc-600">Qeydiyyat</span>
                          <RegistrationBadge status={item.registration_status || 'pending'} />
                        </div>
                        <span className="text-zinc-700">·</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase tracking-wider text-zinc-600">Ödəniş</span>
                          <PaymentBadge status={payment?.status || 'pending'} />
                        </div>
                        {payment?.amount != null && (
                          <>
                            <span className="text-zinc-700">·</span>
                            <span className="text-xs font-semibold text-zinc-300">
                              {payment.amount} {payment.currency || 'AZN'}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Pending info message */}
                      {item.registration_status === 'pending' && (
                        <p className="mt-3 text-xs text-amber-400/80">
                          Ödənişin admin tərəfindən təsdiqlənməsini gözlə.
                        </p>
                      )}
                    </div>

                    {/* Right — action */}
                    <div className="flex shrink-0 items-start">
                      <Link href={`/tournaments/${tournament?.slug}`}
                        className="rounded-xl border border-[#C50337]/20 bg-[#C50337]/10 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-[#C50337]/35 hover:text-white">
                        Turnirə bax →
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
