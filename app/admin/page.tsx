import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const ITEMS = [
  { title: 'Turnirlər', description: 'Bütün turnirləri idarə et', href: '/admin/tournaments', icon: '🏆' },
  { title: 'Yeni turnir', description: 'Yeni turnir yarat', href: '/admin/tournaments/new', icon: '➕' },
  { title: 'Registrations', description: 'Qeydiyyatları yoxla', href: '/admin/registrations', icon: '📋' },
  { title: 'Payments', description: 'Ödənişləri idarə et', href: '/admin/payments', icon: '💳' },
  { title: 'Leaderboard', description: 'Xalları idarə et', href: '/admin/leaderboard', icon: '📊' },
  { title: 'Disputes', description: 'Mübahisəli matçları həll et', href: '/admin/disputes', icon: '⚖️' },
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
          <p className="mt-3 text-sm text-zinc-400 font-open-sans">
            Xoş gəldin, <span className="text-white font-medium">{profile.username || 'admin'}</span>
          </p>
        </section>

        {/* Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item) => (
            <Link key={item.href} href={item.href}
              className="group relative overflow-hidden rounded-[24px] border border-[#C50337]/10 bg-[#C50337]/4 p-6 backdrop-blur-xl transition-all duration-200 hover:border-[#C50337]/25 hover:bg-[#C50337]/8">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#C50337]/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C50337]/15 bg-[#C50337]/10 text-2xl">
                {item.icon}
              </div>
              <p className="text-lg font-semibold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>{item.title}</p>
              <p className="mt-1.5 text-sm text-zinc-500">{item.description}</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[#ff4d6d] opacity-0 transition-opacity group-hover:opacity-100">
                Keç →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
