import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PaymentStatusForm from './payment-status-form'

function formatDate(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'border-[#C50337]/25 bg-[#C50337]/10 text-[#ff4d6d]',
  pending:   'border-zinc-500/25 bg-zinc-500/10 text-zinc-400',
  failed:    'border-red-500/25 bg-red-500/10 text-red-400',
}

export default async function AdminPaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile || profile.role !== 'admin') redirect('/profile')

  const { data: payments, error } = await supabase
    .from('payments')
    .select('id, user_id, tournament_id, registration_id, provider, provider_payment_id, amount, currency, status, created_at, updated_at')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[28px] border border-[#C50337]/20 bg-[#C50337]/5 p-7 backdrop-blur-xl sm:p-10">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#C50337]/10 via-transparent to-[#8B0224]/5" />
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#C50337]/25 bg-[#C50337]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff4d6d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff4d6d]" /> Admin Panel
          </div>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl" style={{ fontFamily: 'var(--font-poppins)' }}>Payments</h1>
          <p className="mt-3 text-sm text-zinc-400">Bütün ödənişləri buradan idarə et.</p>
        </section>

        <div className="mt-6 space-y-4">
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/8 p-4 text-sm text-red-300">
              Xəta: {error.message}
            </div>
          )}
          {!error && payments?.length === 0 && (
            <div className="rounded-[24px] border border-[#C50337]/10 bg-[#C50337]/4 p-6 text-center text-zinc-500">
              Hələ payment yoxdur.
            </div>
          )}

          {!error && payments?.map((payment) => (
            <div key={payment.id}
              className="rounded-[24px] border border-[#C50337]/10 bg-[#C50337]/4 p-5 backdrop-blur-xl transition hover:border-[#C50337]/18">
              <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <div className="grid gap-3 sm:grid-cols-2">

                  <div className="rounded-xl border border-[#C50337]/10 bg-[#02060E]/60 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Məbləğ</p>
                    <p className="mt-0.5 font-semibold text-white">{payment.amount} {payment.currency}</p>
                  </div>

                  <div className="rounded-xl border border-[#C50337]/10 bg-[#02060E]/60 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Provider</p>
                    <p className="mt-0.5 font-semibold text-white">{payment.provider || '-'}</p>
                  </div>

                  <div className="rounded-xl border border-[#C50337]/10 bg-[#02060E]/60 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Status</p>
                    <span className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[payment.status] || STATUS_STYLES['pending']}`}>
                      {payment.status || 'pending'}
                    </span>
                  </div>

                  <div className="rounded-xl border border-[#C50337]/10 bg-[#02060E]/60 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Tarix</p>
                    <p className="mt-0.5 text-sm font-medium text-white">{formatDate(payment.created_at)}</p>
                  </div>

                  <div className="rounded-xl border border-[#C50337]/10 bg-[#02060E]/60 px-4 py-3 sm:col-span-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Payment ID</p>
                    <p className="mt-0.5 break-all text-xs text-zinc-300">{payment.id}</p>
                  </div>

                  <div className="rounded-xl border border-[#C50337]/10 bg-[#02060E]/60 px-4 py-3 sm:col-span-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">User ID</p>
                    <p className="mt-0.5 break-all text-xs text-zinc-300">{payment.user_id || '-'}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-[#C50337]/15 bg-[#02060E]/60 p-4">
                  <p className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>Statusu dəyiş</p>
                  <p className="mt-1 text-xs text-zinc-500">Manual payment üçün statusu buradan yenilə.</p>
                  <div className="mt-4">
                    <PaymentStatusForm paymentId={payment.id} currentStatus={payment.status || 'pending'} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
