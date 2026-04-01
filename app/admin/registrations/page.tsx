import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminRegistrationsPage() {
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
    redirect('/profile')
  }

  const { data: registrations, error } = await supabase
    .from('tournament_registrations')
    .select(`
      id,
      registration_status,
      created_at,
      user_id,
      tournament_id,
      profiles:user_id (
        id,
        username,
        full_name
      ),
      tournaments:tournament_id (
        id,
        title,
        slug,
        platform,
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
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-3xl font-bold">Admin Registrations</h1>

        {error && (
          <div className="rounded-lg border border-red-400/20 bg-red-500/10 p-4 text-red-200">
            Xəta: {error.message}
          </div>
        )}

        {!registrations?.length ? (
          <p className="text-zinc-300">Hələ registration yoxdur.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-left text-zinc-300">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Turnir</th>
                  <th className="p-3">Platform</th>
                  <th className="p-3">Turnir statusu</th>
                  <th className="p-3">Registration</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Məbləğ</th>
                  <th className="p-3">Tarix</th>
                </tr>
              </thead>

              <tbody>
                {registrations.map((item: any) => {
                  const profileData = Array.isArray(item.profiles)
                    ? item.profiles[0]
                    : item.profiles

                  const tournament = Array.isArray(item.tournaments)
                    ? item.tournaments[0]
                    : item.tournaments

                  const payment = Array.isArray(item.payments)
                    ? item.payments[0]
                    : item.payments

                  return (
                    <tr key={item.id} className="border-t border-white/10">
                      <td className="p-3">
                        <div className="font-medium text-white">
                          {profileData?.full_name || profileData?.username || 'User'}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {profileData?.username || item.user_id}
                        </div>
                      </td>

                      <td className="p-3 text-zinc-200">
                        {tournament?.title || '-'}
                      </td>

                      <td className="p-3 text-zinc-200">
                        {tournament?.platform || '-'}
                      </td>

                      <td className="p-3 text-zinc-200">
                        {tournament?.status || '-'}
                      </td>

                      <td className="p-3 text-zinc-200">
                        {item.registration_status || '-'}
                      </td>

                      <td className="p-3 text-zinc-200">
                        {payment?.status || 'pending'}
                      </td>

                      <td className="p-3 text-zinc-200">
                        {payment ? `${payment.amount ?? '-'} ${payment.currency || ''}` : '-'}
                      </td>

                      <td className="p-3 text-zinc-200">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
