import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NavbarLogoutButton from './NavbarLogoutButton'
import MobileMenu from './MobileMenu'

export default async function Navbar() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 font-bold text-black shadow-lg shadow-cyan-500/20">
            E
          </div>

          <div className="min-w-0">
            <p className="truncate text-xs text-zinc-400 sm:text-sm">Platform</p>
            <h1 className="truncate text-sm font-semibold tracking-wide sm:text-lg">
              eFootball Tournaments
            </h1>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
          <Link href="/" className="transition hover:text-white">
            Ana səhifə
          </Link>

          <Link href="/tournaments" className="transition hover:text-white">
            Turnirlər
          </Link>

          <Link href="/dashboard" className="transition hover:text-white">
            Dashboard
          </Link>

          {user ? (
            <NavbarLogoutButton />
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10"
              >
                Daxil ol
              </Link>

              <Link
                href="/register"
                className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2 font-medium text-black transition hover:scale-[1.02]"
              >
                Qeydiyyat
              </Link>
            </div>
          )}
        </nav>

        <MobileMenu isLoggedIn={!!user} />
      </div>
    </header>
  )
}