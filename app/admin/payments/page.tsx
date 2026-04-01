import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
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
      profiles:user_id (
        username,
        full_name
      ),
      tournaments:tournament_id (
        title,
        platform
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-3xl font-bold">Admin Payments</h1>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
            Xəta: {error.message}
          </div>
        )}

        {!payments?.length ? (
          <p>Hələ payment yoxdur.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Turnir</th>
                  <th className="p-3">Məbləğ</th>
                  <th className="p-3">Valyuta</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Payment ID</th>
                  <th className="p-3">Tarix</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((item: any) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3">
                      {item.profiles?.full_name || item.profiles?.username || 'User'}
                    </td>
                    <td className="p-3">{item.tournaments?.title}</td>
                    <td className="p-3">{item.amount}</td>
                    <td className="p-3">{item.currency}</td>
                    <td className="p-3">{item.status}</td>
                    <td className="p-3">{item.provider}</td>
                    <td className="p-3">{item.provider_payment_id || '-'}</td>
                    <td className="p-3">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}