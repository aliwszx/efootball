import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'admin') {
    redirect('/profile')
  }

  const items = [
    {
      title: 'Turnirlər',
      description: 'Bütün turnirləri idarə et',
      href: '/admin/tournaments',
    },
    {
      title: 'Yeni turnir',
      description: 'Yeni turnir yarat',
      href: '/admin/tournaments/new',
    },
    {
      title: 'Registrations',
      description: 'Qeydiyyatları yoxla',
      href: '/admin/registrations',
    },
    {
      title: 'Payments',
      description: 'Ödənişləri idarə et',
      href: '/admin/payments',
    },
  ]

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-cyan-300">Admin</p>
          <h1 className="text-3xl font-bold sm:text-5xl">Admin panel</h1>
          <p className="mt-4 text-zinc-400">
            Xoş gəldin, {profile.username || 'admin'}
          </p>
        </section>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[28px] border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
            >
              <p className="text-2xl font-bold">{item.title}</p>
              <p className="mt-3 text-sm text-zinc-400">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}