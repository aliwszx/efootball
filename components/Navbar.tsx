'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type AuthUser = {
  email?: string
}

type ProfileData = {
  username?: string
  role?: string
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setUser(null)
        setProfile(null)
        return
      }

      setUser({ email: user.email })

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', user.id)
        .maybeSingle()

      setProfile(profile || null)
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const username = profile?.username || user?.email || ''
  const isAdmin = profile?.role === 'admin'

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

          <Link
            href="/leaderboard"
            className="text-sm text-zinc-200 transition hover:text-cyan-300"
          >
            Leaderboard
          </Link>

          {user && (
            <Link
              href="/profile"
              className="text-sm text-zinc-200 transition hover:text-cyan-300"
            >
              Profile
            </Link>
          )}

          {user && isAdmin && (
            <Link
              href="/admin"
              className="text-sm text-zinc-200 transition hover:text-cyan-300"
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
                {username}
              </span>

              <form action="/auth/signout" method="post">
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

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white md:hidden"
          aria-label="Menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {menuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 bg-[#050816]/95 px-4 py-4 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-3">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200"
            >
              Ana səhifə
            </Link>

            <Link
              href="/tournaments"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200"
            >
              Turnirlər
            </Link>

            <Link
              href="/leaderboard"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200"
            >
              Leaderboard
            </Link>

            {user && (
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200"
              >
                Profile
              </Link>
            )}

            {user && isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200"
              >
                Admin
              </Link>
            )}

            {user ? (
              <>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                  {username}
                </div>

                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200"
                  >
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                >
                  Daxil ol
                </Link>

                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3 text-sm font-semibold text-black"
                >
                  Qeydiyyat
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
