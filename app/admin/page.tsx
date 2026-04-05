import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
)
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
  </svg>
)
const ClipboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="m9 14 2 2 4-4" />
  </svg>
)
const CardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /><path d="M6 15h.01M10 15h4" />
  </svg>
)
const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    <polyline points="22 10 18 6 14 10" />
  </svg>
)
const ScalesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18" /><path d="M3 7h18" /><path d="M3 7l3 8a5 5 0 0 0 6 0L15 7" /><path d="M9 7l3 8a5 5 0 0 0 6 0L21 7" /><path d="M5 21h14" />
  </svg>
)
const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

const ITEMS = [
  { title: 'Turnirlər', description: 'Bütün turnirləri idarə et', href: '/admin/tournaments', Icon: TrophyIcon, accent: '#C50337' },
  { title: 'Yeni turnir', description: 'Yeni turnir yarat', href: '/admin/tournaments/new', Icon: PlusIcon, accent: '#7c3aed' },
  { title: 'Registrations', description: 'Qeydiyyatları yoxla', href: '/admin/registrations', Icon: ClipboardIcon, accent: '#0ea5e9' },
  { title: 'Payments', description: 'Ödənişləri idarə et', href: '/admin/payments', Icon: CardIcon, accent: '#10b981' },
  { title: 'Leaderboard', description: 'Xalları idarə et', href: '/admin/leaderboard', Icon: ChartIcon, accent: '#f59e0b' },
  { title: 'Disputes', description: 'Mübahisəli matçları həll et', href: '/admin/disputes', Icon: ScalesIcon, accent: '#ef4444' },
]

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('username, role').eq('id', user.id).maybeSingle()
  if (!profile || profile.role !== 'admin') redirect('/profile')

  return (
    <main className="min-h-screen px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[28px] border border-[#C50337]/20 bg-[#C50337]/5 p-7 backdrop-blur-xl sm:p-10">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#C50337]/10 via-transparent to-[#8B0224]/5" />
          <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-[#C50337]/25 bg-[#C50337]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff4d6d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff4d6d]" />
            Admin Panel
          </div>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl" style={{ fontFamily: 'var(--font-poppins)' }}>
            İdarəetmə paneli
          </h1>
          <p className="mt-3 text-sm text-zinc-400">
            Xoş gəldin, <span className="font-medium text-white">{profile.username || 'admin'}</span>
          </p>
        </section>

        {/* Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map(({ href, title, description, Icon, accent }) => (
            <Link key={href} href={href}
              className="group relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.12] hover:bg-white/[0.05] hover:shadow-xl"
            >
              <div
                className="pointer-events-none absolute inset-0 -z-10 rounded-[24px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: `radial-gradient(circle at 30% 20%, ${accent}18 0%, transparent 60%)` }}
              />
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors duration-300"
                style={{ background: `${accent}18`, borderColor: `${accent}30`, color: accent }}
              >
                <Icon />
              </div>
              <p className="text-[15px] font-semibold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>{title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{description}</p>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-medium opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" style={{ color: accent }}>
                Keç <ArrowIcon />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
