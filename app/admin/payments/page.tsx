import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PaymentStatusForm from './payment-status-form'

function formatDate(value?: string | null) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('az-AZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default async function AdminPaymentsPage() {
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

  const { data: payments, error } = await supabase
    .from('payments')
    .select(`
      id,
      user_id,
      tournament_id,
      registration_id,
      provider,
      provider_payment_id,
      amount,
      currency,
      status,
      created_at,
      updated_at
    `)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-cyan-300">Admin</p>
          <h1 className="text-3xl font-bold sm:text-5xl">Payments</h1>
          <p className="mt-3 text-zinc-400">Bütün ödənişləri buradan idarə et.</p>
        </section>

        <div className="mt-8 space-y-4">
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
              Payments yüklənərkən xəta baş verdi.
            </div>
          )}

          {!error && payments?.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-zinc-300">
              Hələ payment yoxdur.
            </div>
          )}

          {!error &&
            payments?.map((payment) => (
              <div
                key={payment.id}
                className="rounded-[28px] border border-white/10 bg-white/5 p-5"
              >
                <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Məbləğ</p>
                      <p className="mt-1 font-semibold text-white">
                        {payment.amount} {payment.currency}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Provider</p>
                      <p className="mt-1 font-semibold text-white">{payment.provider || '-'}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Cari status</p>
                      <p className="mt-1 font-semibold text-white">{payment.status || '-'}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Tarix</p>
                      <p className="mt-1 font-semibold text-white">
                        {formatDate(payment.created_at)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Payment ID</p>
                      <p className="mt-1 break-all text-sm text-white">{payment.id}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Registration ID</p>
                      <p className="mt-1 break-all text-sm text-white">
                        {payment.registration_id || '-'}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">User ID</p>
                      <p className="mt-1 break-all text-sm text-white">{payment.user_id || '-'}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-semibold text-white">Statusu dəyiş</p>
                    <p className="mt-1 text-sm text-zinc-400">
                      Manual payment üçün statusu buradan yenilə.
                    </p>

                    <div className="mt-4">
                      <PaymentStatusForm
                        paymentId={payment.id}
                        currentStatus={payment.status || 'pending'}
                      />
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
