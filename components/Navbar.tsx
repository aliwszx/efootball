'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type AuthUser = { id: string; email?: string }
type ProfileData = { username?: string; avatar_url?: string | null; role?: string }

const NAV_LINKS = [
  { href: '/', label: 'Ana səhifə' },
  { href: '/tournaments', label: 'Turnirlər' },
  { href: '/my-matches', label: 'Matçlarım' },
  { href: '/leaderboard', label: 'Reytinq' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const loadUser = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setUser(null); setProfile(null); setLoading(false); return }
      setUser({ id: user.id, email: user.email })
      const { data: profile } = await supabase
        .from('profiles').select('username, avatar_url, role')
        .eq('id', user.id).maybeSingle()
      setProfile(profile || null)
      setLoading(false)
    }
    loadUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => loadUser())
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node))
        setProfileOpen(false)
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setProfileOpen(false); setMenuOpen(false) }
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

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'border-b border-white/[0.08] bg-[#04050a]/90 backdrop-blur-2xl'
        : 'border-b border-white/[0.06] bg-[#04050a]/75 backdrop-blur-xl'
    }`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/25 transition-shadow group-hover:shadow-cyan-500/40">
            <span className="text-lg font-bold text-black" style={{ fontFamily: 'var(--font-syne)' }}>E</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Platform</p>
            <p className="text-[15px] font-bold leading-tight text-white" style={{ fontFamily: 'var(--font-syne)' }}>eFootball</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}
              className="rounded-lg px-4 py-2 text-sm text-zinc-300 transition-colors duration-150 hover:bg-white/[0.07] hover:text-white">
              {label}
            </Link>
          ))}
          {user && isAdmin && (
            <Link href="/admin"
              className="rounded-lg px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/[0.07] hover:text-white">
              Admin
            </Link>
          )}
        </nav>

       {/* Desktop Right */}
<div className="hidden md:flex items-center gap-2 min-w-[160px] justify-end">
  {loading ? (
    <div className="h-9 w-36 animate-pulse rounded-xl bg-white/[0.1] border border-white/[0.1]" />
  ) : user ? (
    <div className="relative" ref={profileMenuRef}>
      <button
        type="button"
        onClick={() => setProfileOpen(p => !p)}
        className="flex items-center gap-2.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 transition-all hover:bg-white/15 hover:border-white/30"
      >
        <div className="h-7 w-7 overflow-hidden rounded-full border border-white/30 bg-cyan-500/20 flex-shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profil" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-cyan-300">
              {avatarLetter}
            </div>
          )}
        </div>
        <span className="max-w-[110px] truncate text-sm font-medium text-white">{username}</span>
        <svg className={`h-3.5 w-3.5 text-zinc-300 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {profileOpen && (
        <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-white/[0.12] bg-[#08090f] shadow-2xl shadow-black/80 p-1.5" style={{ backdropFilter: 'blur(24px)' }}>
          <div className="px-3 py-2.5 mb-1">
            <p className="truncate text-sm font-semibold text-white">{username}</p>
            <p className="truncate text-xs text-zinc-500 mt-0.5">{user.email}</p>
          </div>
          <div className="h-px bg-white/[0.08] mx-1 mb-1" />
          {[
            { href: '/profile', label: 'Profil', icon: '👤' },
            { href: '/my-matches', label: 'Mənim matçlarım', icon: '⚽' },
            { href: '/dashboard/my-tournaments', label: 'Turnirlərim', icon: '🏆' },
            ...(isAdmin ? [{ href: '/admin', label: 'Admin panel', icon: '⚙️' }] : []),
          ].map(({ href, label, icon }) => (
            <Link key={href} href={href} onClick={() => setProfileOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white">
              <span>{icon}</span>{label}
            </Link>
          ))}
          <div className="h-px bg-white/[0.08] mx-1 my-1" />
          <form action="/auth/signout" method="post">
            <button type="submit"
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300">
              <span>→</span> Çıxış
            </button>
          </form>
        </div>
      )}
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link href="/login"
        className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/15">
        Daxil ol
      </Link>
      <Link href="/register"
        className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-semibold text-black transition-all hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-[1.02]">
        Qeydiyyat
      </Link>
    </div>
  )}
</div>

        {/* Mobile burger */}
        <button type="button" onClick={() => setMenuOpen(p => !p)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.07] text-zinc-300 transition hover:text-white md:hidden"
          aria-label="Menu">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {menuOpen
              ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-white/[0.07] bg-[#04050a]/98 backdrop-blur-2xl px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {user && !loading && (
              <Link href="/profile" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 mb-2">
                <div className="h-10 w-10 overflow-hidden rounded-full border border-white/20 bg-white/10 flex-shrink-0">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="Profil" className="h-full w-full object-cover" />
                    : <div className="flex h-full w-full items-center justify-center text-sm font-bold text-cyan-300">{avatarLetter}</div>}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{username}</p>
                  <p className="truncate text-xs text-zinc-500">{user.email}</p>
                </div>
              </Link>
            )}
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors">
                {label}
              </Link>
            ))}
            {user && (
              <>
                <Link href="/dashboard/my-tournaments" onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors">
                  Turnirlərim
                </Link>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors">
                    Admin panel
                  </Link>
                )}
              </>
            )}
            <div className="h-px bg-white/[0.07] my-1" />
            {loading ? (
              <div className="h-11 animate-pulse rounded-xl bg-white/5" />
            ) : user ? (
              <form action="/auth/signout" method="post">
                <button type="submit"
                  className="w-full rounded-xl px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors text-left">
                  Çıxış
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link href="/login" onClick={() => setMenuOpen(false)}
                  className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-sm text-white text-center">
                  Daxil ol
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)}
                  className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 text-sm font-semibold text-black text-center">
                  Qeydiyyat
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
