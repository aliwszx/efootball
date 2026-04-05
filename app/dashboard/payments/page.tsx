import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  completed: { label: 'Tamamlandı', color: '#10b981', bg: '#10b98115', dot: '#10b981' },
  pending:   { label: 'Gözlənilir', color: '#f59e0b', bg: '#f59e0b15', dot: '#f59e0b' },
  failed:    { label: 'Uğursuz',    color: '#ef4444', bg: '#ef444415', dot: '#ef4444' },
  refunded:  { label: 'Geri qaytarıldı', color: '#8b5cf6', bg: '#8b5cf615', dot: '#8b5cf6' },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('az-AZ', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const PlatformIcon = ({ platform }: { platform: string }) => {
  if (platform?.toLowerCase() === 'mobile') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    )
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

export default async function PaymentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: payments, error } = await supabase
    .from('payments')
    .select(`
      id,
      amount,
      currency,
      status,
      provider,
      provider_payment_id,
      created_at,
      tournaments:tournament_id (
        title,
        slug,
        platform
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const totalPaid = payments
    ?.filter((p: any) => p.status === 'completed')
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) ?? 0

  return (
    <main className="min-h-screen px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <section className="relative mb-8 overflow-hidden rounded-[28px] border border-white/[0.07] bg-white/[0.03] p-7 backdrop-blur-xl sm:p-10">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#10b981]/8 via-transparent to-transparent" />
          <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-[#10b981]/25 bg-[#10b981]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#10b981]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            Hesabım
          </div>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl" style={{ fontFamily: 'var(--font-poppins)' }}>
            Ödənişlərim
          </h1>
          <p className="mt-2 text-sm text-zinc-500">Bütün turnir ödənişlərini buradan izlə.</p>

          {/* Stats row */}
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.04] px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#10b981]/15">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-[#10b981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-zinc-600">Cəmi ödənilmiş</p>
                <p className="text-lg font-bold text-white">{totalPaid} AZN</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.04] px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C50337]/15">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-[#ff4d6d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /><path d="M4 22h16" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-zinc-600">Turnir sayı</p>
                <p className="text-lg font-bold text-white">{payments?.length ?? 0}</p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
            Xəta: {error.message}
          </div>
        )}

        {!payments?.length ? (
          <div className="flex flex-col items-center justify-center rounded-[24px] border border-white/[0.07] bg-white/[0.02] py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <p className="text-base font-medium text-zinc-400">Hələ ödəniş yoxdur</p>
            <p className="mt-1.5 text-sm text-zinc-600">Turnirə qoşulduqda ödənişlər burada görünəcək.</p>
            <Link href="/tournaments"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#C50337]/25 bg-[#C50337]/10 px-5 py-2.5 text-sm font-medium text-[#ff4d6d] transition-colors hover:bg-[#C50337]/15">
              Turnirləri gör
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {payments.map((payment: any) => {
              const status = statusConfig[payment.status] ?? statusConfig['pending']
              return (
                <div key={payment.id}
                  className="group relative overflow-hidden rounded-[20px] border border-white/[0.07] bg-white/[0.03] p-5 backdrop-blur-xl transition-all duration-200 hover:border-white/[0.1] hover:bg-white/[0.05] sm:p-6"
                >
                  <div className="pointer-events-none absolute inset-0 -z-10 rounded-[20px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: `radial-gradient(circle at 20% 50%, ${status.color}08 0%, transparent 60%)` }}
                  />

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left: title + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        {/* Tournament icon */}
                        <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[#C50337]/20 bg-[#C50337]/10">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#ff4d6d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /><path d="M4 22h16" />
                            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                          </svg>
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-base font-semibold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>
                              {payment.tournaments?.title ?? 'Turnir'}
                            </h2>
                            {/* Status badge */}
                            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                              style={{ color: status.color, background: status.bg }}>
                              <span className="h-1.5 w-1.5 rounded-full" style={{ background: status.dot }} />
                              {status.label}
                            </span>
                          </div>

                          {/* Meta pills */}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {payment.tournaments?.platform && (
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                                <PlatformIcon platform={payment.tournaments.platform} />
                                {payment.tournaments.platform}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                              {formatDate(payment.created_at)}
                            </span>
                            {payment.provider && (
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                                {payment.provider}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: amount */}
                    <div className="flex-shrink-0 sm:text-right">
                      <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>
                        {payment.amount} <span className="text-base font-medium text-zinc-500">{payment.currency || 'AZN'}</span>
                      </p>
                      {payment.provider_payment_id && payment.provider_payment_id !== 'Yoxdur' && (
                        <p className="mt-1 text-[11px] text-zinc-600 font-mono">
                          ID: {payment.provider_payment_id}
                        </p>
                      )}
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
