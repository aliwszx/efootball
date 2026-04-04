'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type AuthUser = {
  id: string
  email?: string
}

type ProfileData = {
  username?: string
  avatar_url?: string | null
  role?: string
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  const profileMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const loadUser = async () => {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      setUser({
        id: user.id,
        email: user.email,
      })

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url, role')
        .eq('id', user.id)
        .maybeSingle()

      setProfile(profile || null)
      setLoading(false)
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false)
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const username = profile?.username || user?.email || 'İstifadəçi'
  const isAdmin = profile?.role === 'admin'
  const avatarUrl = profile?.avatar_url || ''
  const avatarLetter = username.charAt(0).toUpperCase()

  const closeMobileMenu = () => setMenuOpen(false)
  const closeProfileMenu = () => setProfileOpen(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 font-bold text-black shadow-lg shadow-cyan-500/20">
            E
          </div>

          <div className="hidden sm:block">
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
            href="/my-matches"
            className="text-sm text-zinc-200 transition hover:text-cyan-300"
          >
            Mənim matçlarım
          </Link>

          <Link
            href="/leaderboard"
            className="text-sm text-zinc-200 transition hover:text-cyan-300"
          >
            Reytinq
          </Link>

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
          {loading ? (
            <div className="h-11 w-32 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          ) : user ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10"
              >
                <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-white/10">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profil şəkli"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-cyan-300">
                      {avatarLetter}
                    </div>
                  )}
                </div>

                <div className="max-w-[140px] text-left">
                  <p className="truncate text-sm font-medium text-white">{username}</p>
                  <p className="truncate text-xs text-zinc-400">{user.email}</p>
                </div>

                <svg
                  className={`h-4 w-4 text-zinc-400 transition ${profileOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1120] p-2 shadow-2xl shadow-black/40">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                    <p className="truncate text-sm font-semibold text-white">{username}</p>
                    <p className="truncate text-xs text-zinc-400">{user.email}</p>
                  </div>

                  <div className="mt-2 space-y-1">
                    <Link
                      href="/profile"
                      onClick={closeProfileMenu}
                      className="flex items-center rounded-xl px-3 py-3 text-sm text-zinc-200 transition hover:bg-white/10"
                    >
                      Profil
                    </Link>

                    <Link
                      href="/my-matches"
                      onClick={closeProfileMenu}
                      className="flex items-center rounded-xl px-3 py-3 text-sm text-zinc-200 transition hover:bg-white/10"
                    >
                      Mənim matçlarım
                    </Link>

                    <Link
                      href="/dashboard/my-tournaments"
                      onClick={closeProfileMenu}
                      className="flex items-center rounded-xl px-3 py-3 text-sm text-zinc-200 transition hover:bg-white/10"
                    >
                      Mənim turnirlərim
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={closeProfileMenu}
                        className="flex items-center rounded-xl px-3 py-3 text-sm text-zinc-200 transition hover:bg-white/10"
                      >
                        Admin panel
                      </Link>
                    )}
                  </div>

                  <div className="mt-2 border-t border-white/10 pt-2">
                    <form action="/auth/signout" method="post">
                      <button
                        type="submit"
                        className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-left text-sm font-medium text-red-200 transition hover:bg-red-500/20"
                      >
                        Çıxış
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
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
            {user && !loading && (
              <Link
                href="/profile"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-white/10">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profil şəkli"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-cyan-300">
                      {avatarLetter}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{username}</p>
                  <p className="truncate text-xs text-zinc-400">{user.email}</p>
                </div>
              </Link>
            )}

            <Link
              href="/"
              onClick={closeMobileMenu}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200"
            >
              Ana səhifə
            </Link>

            <Link
              href="/tournaments"
              onClick={closeMobileMenu}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200"
            >
              Turnirlər
            </Link>

            <Link
              href="/my-matches"
              onClick={closeMobileMenu}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200"
            >
              Mənim matçlarım
            </Link>

            <Link
              href="/leaderboard"
              onClick={closeMobileMenu}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200"
            >
              Reytinq
            </Link>

            {user && (
              <>
                <Link
                  href="/profile"
                  onClick={closeMobileMenu}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200"
                >
                  Profil
                </Link>

                <Link
                  href="/dashboard/my-tournaments"
                  onClick={closeMobileMenu}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200"
                >
                  Mənim turnirlərim
                </Link>
              </>
            )}

            {user && isAdmin && (
              <Link
                href="/admin"
                onClick={closeMobileMenu}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200"
              >
                Admin panel
              </Link>
            )}

            {loading ? (
              <div className="h-12 animate-pulse rounded-xl border border-white/10 bg-white/5" />
            ) : user ? (
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200"
                >
                  Çıxış
                </button>
              </form>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                >
                  Daxil ol
                </Link>

                <Link
                  href="/register"
                  onClick={closeMobileMenu}
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
