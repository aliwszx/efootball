import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function formatDate(value?: string | null) {
  if (!value) return 'Təyin edilməyib'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Təyin edilməyib'
  return new Intl.DateTimeFormat('az-AZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date)
}

const STATUS_STYLES: Record<string, string> = {
  open:   'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
  active: 'border-cyan-400/25 bg-cyan-400/10 text-cyan-300',
  draft:  'border-zinc-500/25 bg-zinc-500/10 text-zinc-400',
  closed: 'border-red-400/25 bg-red-400/10 text-red-300',
}

export default async function TournamentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="min-h-screen px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[24px] border border-red-500/20 bg-red-500/8 p-6 text-sm text-red-300">
            Turnirlər yüklənərkən xəta baş verdi.
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-7 backdrop-blur-xl sm:p-10">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-600/5 via-transparent to-cyan-500/5" />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">Turnirlər</p>
              <h1 className="text-4xl font-bold sm:text-6xl" style={{ fontFamily: 'var(--font-syne)' }}>
                Aktiv turnirlər
              </h1>
              <p className="mt-3 text-sm text-zinc-400">
                Bütün turnirləri buradan izləyə və qeydiyyatdan keçə bilərsən.
              </p>
            </div>
            {user && (
              <Link href="/dashboard/my-tournaments"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-2.5 text-sm font-semibold text-black transition-all hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-[1.02] flex-shrink-0">
                Mənim turnirlərim
              </Link>
            )}
          </div>
        </section>

        {/* Grid */}
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tournaments && tournaments.length > 0 ? (
            tournaments.map((tournament: any) => {
              const title = tournament.title || 'Adsız turnir'
              const description = tournament.description || tournament.details || 'Təsvir əlavə edilməyib'
              const format = tournament.format || tournament.mode || tournament.type || 'Təyin edilməyib'
              const participants = tournament.max_players || tournament.player_limit || tournament.participants_limit || '—'
              const fee = tournament.entry_fee ?? tournament.price ?? tournament.registration_fee ?? 0
              const status = (tournament.status || 'active').toLowerCase()
              const startDate = tournament.start_date || tournament.starts_at || tournament.event_date || tournament.created_at
              const statusStyle = STATUS_STYLES[status] || STATUS_STYLES['active']

              return (
                <div key={tournament.id}
                  className="group relative flex flex-col overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.05]">

                  {/* Top row */}
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <h2 className="text-xl font-bold leading-snug text-white" style={{ fontFamily: 'var(--font-syne)' }}>
                      {title}
                    </h2>
                    <span className={`flex-shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusStyle}`}>
                      {status}
                    </span>
                  </div>

                  <p className="mb-5 line-clamp-2 text-sm leading-relaxed text-zinc-500">
                    {description}
                  </p>

                  {/* Stats grid */}
                  <div className="mt-auto grid grid-cols-2 gap-2 text-sm">
                    {[
                      { label: 'Format', value: format },
                      { label: 'İştirakçı', value: participants },
                      { label: 'Qeydiyyat', value: typeof fee === 'number' ? `${fee} ₼` : fee },
                      { label: 'Başlama', value: formatDate(startDate) },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-xl border border-white/[0.07] bg-black/20 px-3 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{label}</p>
                        <p className="mt-0.5 text-sm font-medium text-zinc-200">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <Link href={`/tournaments/${tournament.slug}`}
                      className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-2 text-sm font-medium text-zinc-200 transition-all hover:bg-white/[0.1] hover:text-white">
                      Ətraflı bax →
                    </Link>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-full rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-8 text-center text-zinc-500">
              Hələ turnir yoxdur.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
