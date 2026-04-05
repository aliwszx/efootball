import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'border-[#C50337]/25 bg-[#C50337]/10 text-[#ff4d6d]',
  pending:   'border-zinc-500/25 bg-zinc-500/10 text-zinc-400',
  cancelled: 'border-red-500/25 bg-red-500/10 text-red-400',
}

export default async function AdminRegistrationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/profile')

  const { data: registrations, error } = await supabase
    .from('tournament_registrations')
    .select(`
      id, registration_status, created_at, user_id, tournament_id,
      profiles:user_id (id, username, full_name),
      tournaments:tournament_id (id, title, slug, platform, start_time, status),
      payments (id, status, amount, currency, created_at)
    `)
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
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl" style={{ fontFamily: 'var(--font-poppins)' }}>Registrations</h1>
          <p className="mt-3 text-sm text-zinc-400">Bütün qeydiyyatları buradan izlə.</p>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/8 p-4 text-sm text-red-300">
            Xəta: {error.message}
          </div>
        )}

        <div className="mt-6">
          {!registrations?.length ? (
            <div className="rounded-[24px] border border-[#C50337]/10 bg-[#C50337]/4 p-8 text-center text-zinc-500">
              Hələ registration yoxdur.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-[#C50337]/10 bg-[#C50337]/4 backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#C50337]/10">
                      {['İstifadəçi', 'Turnir', 'Platform', 'Turnir statusu', 'Qeydiyyat', 'Ödəniş', 'Məbləğ', 'Tarix'].map(h => (
                        <th key={h} className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((item: any) => {
                      const p = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
                      const t = Array.isArray(item.tournaments) ? item.tournaments[0] : item.tournaments
                      const pay = Array.isArray(item.payments) ? item.payments[0] : item.payments
                      const regStatus = item.registration_status || 'pending'
                      return (
                        <tr key={item.id} className="border-b border-[#C50337]/5 transition-colors hover:bg-[#C50337]/5">
                          <td className="px-5 py-4">
                            <div className="font-medium text-white">{p?.full_name || p?.username || 'User'}</div>
                            <div className="text-xs text-zinc-600">@{p?.username || item.user_id?.slice(0,8)}</div>
                          </td>
                          <td className="px-5 py-4 text-zinc-200">{t?.title || '-'}</td>
                          <td className="px-5 py-4 text-zinc-400 text-xs">{t?.platform || '-'}</td>
                          <td className="px-5 py-4 text-zinc-400 text-xs">{t?.status || '-'}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[regStatus] || STATUS_BADGE['pending']}`}>
                              {regStatus}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[pay?.status] || STATUS_BADGE['pending']}`}>
                              {pay?.status || 'pending'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-zinc-300">{pay ? `${pay.amount ?? '-'} ${pay.currency || ''}` : '-'}</td>
                          <td className="px-5 py-4 text-xs text-zinc-500">{item.created_at ? new Date(item.created_at).toLocaleDateString('az-AZ') : '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
