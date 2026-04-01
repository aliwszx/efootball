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
      payment_status,
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
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold">Mənim turnirlərim</h1>

        {error && (
          <p className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
            Xəta: {error.message}
          </p>
        )}

        {!registrations?.length ? (
          <p>Hələ heç bir turnirə qoşulmamısan.</p>
        ) : (
          <div className="space-y-4">
            {registrations.map((item: any) => (
              <div key={item.id} className="rounded-2xl border p-5">
                <h2 className="mb-2 text-xl font-semibold">
                  {item.tournaments?.title}
                </h2>
                <p className="mb-1">Platform: {item.tournaments?.platform}</p>
                <p className="mb-1">Format: {item.tournaments?.format}</p>
                <p className="mb-1">Turnir statusu: {item.tournaments?.status}</p>
                <p className="mb-1">Qeydiyyat statusu: {item.registration_status}</p>
                <p className="mb-1">Ödəniş statusu: {item.payment_status}</p>
                <p className="mb-4">
                  Başlama vaxtı: {new Date(item.tournaments?.start_time).toLocaleString()}
                </p>

                <Link
                  href={`/tournaments/${item.tournaments?.slug}`}
                  className="inline-block rounded-lg border px-4 py-2"
                >
                  Turnirə bax
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}