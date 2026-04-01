import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PaymentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

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

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold">Ödənişlərim</h1>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
            Xəta: {error.message}
          </div>
        )}

        {!payments?.length ? (
          <p>Hələ ödəniş yoxdur.</p>
        ) : (
          <div className="space-y-4">
            {payments.map((payment: any) => (
              <div key={payment.id} className="rounded-2xl border p-5">
                <h2 className="mb-2 text-xl font-semibold">
                  {payment.tournaments?.title}
                </h2>
                <p className="mb-1">Platform: {payment.tournaments?.platform}</p>
                <p className="mb-1">Məbləğ: {payment.amount} {payment.currency}</p>
                <p className="mb-1">Status: {payment.status}</p>
                <p className="mb-1">Provider: {payment.provider}</p>
                <p className="mb-1">
                  Payment ID: {payment.provider_payment_id || 'Yoxdur'}
                </p>
                <p>
                  Tarix: {new Date(payment.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}