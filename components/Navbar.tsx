import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function SiteHeader() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let username = ''
  let role = 'user'

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', user.id)
      .maybeSingle()

    username = profile?.username || ''
    role = profile?.role || 'user'
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 font-bold text-black">
            E
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Platform</p>
            <p className="text-lg font-bold text-white">eFootball Tournaments</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm text-zinc-200 transition hover:text-cyan-300">
            Ana səhifə
          </Link>

          <Link
            href="/tournaments"
            className="text-sm text-zinc-200 transition hover:text-cyan-300"
          >
            Turnirlər
          </Link>

          {user && (
            <Link
              href="/profile"
              className="text-sm text-zinc-200 transition hover:text-cyan-300"
            >
              Profile
            </Link>
          )}

          {user && role === 'admin' && (
            <Link
              href="/admin"
              className="text-sm text-zinc-200 transition hover:text-cyan-300"
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 sm:inline-block">
                {username || user.email}
              </span>

              <form action="/login" method="post">
                <button
                  type="submit"
                  className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Daxil ol
              </Link>
              <Link
                href="/register"
                className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.01]"
              >
                Qeydiyyat
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
