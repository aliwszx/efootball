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
    redirect('/dashboard')
  }

  const { data: registrations, error } = await supabase
    .from('tournament_registrations')
    .select(`
      id,
      payment_status,
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
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-3xl font-bold">Admin Registrations</h1>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
            Xəta: {error.message}
          </div>
        )}

        {!registrations?.length ? (
          <p>Hələ registration yoxdur.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Turnir</th>
                  <th className="p-3">Platform</th>
                  <th className="p-3">Turnir statusu</th>
                  <th className="p-3">Registration</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Tarix</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((item: any) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">
                        {item.profiles?.full_name || item.profiles?.username || 'User'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.profiles?.username || item.user_id}
                      </div>
                    </td>

                    <td className="p-3">{item.tournaments?.title}</td>
                    <td className="p-3">{item.tournaments?.platform}</td>
                    <td className="p-3">{item.tournaments?.status}</td>
                    <td className="p-3">{item.registration_status}</td>
                    <td className="p-3">{item.payment_status}</td>
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