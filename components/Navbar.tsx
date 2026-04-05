'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AuthUser = { id: string; email?: string }
type ProfileData = { username?: string; avatar_url?: string | null; role?: string }

const NAV_LINKS = [
  {
    href: '/',
    label: 'Ana səhifə',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/tournaments',
    label: 'Turnirlər',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
  },
  {
    href: '/my-matches',
    label: 'Matçlarım',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    href: '/leaderboard',
    label: 'Reytinq',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
]

export default function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const loadUser = async (initial = false) => {
      if (initial) setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setUser(null); setProfile(null); setLoading(false); return }
      setUser({ id: user.id, email: user.email })
      const { data: profile } = await supabase.from('profiles').select('username, avatar_url, role').eq('id', user.id).maybeSingle()
      setProfile(profile || null)
      setLoading(false)
    }
    loadUser(true)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { loadUser(false) })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenuOpen(false); setProfileOpen(false) }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  const username = profile?.username || user?.email || 'İstifadəçi'
  const isAdmin = profile?.role === 'admin'
  const avatarUrl = profile?.avatar_url || ''
  const avatarLetter = username.charAt(0).toUpperCase()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'border-b border-white/[0.06] shadow-[0_1px_40px_rgba(197,3,55,0.12)]'
            : 'border-b border-transparent'
        }`}
        style={{
          background: scrolled
            ? 'rgba(2, 6, 14, 0.92)'
            : 'rgba(2, 6, 14, 0.6)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        }}
      >
        {/* top accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C50337]/60 to-transparent" />

        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-0 sm:px-6 lg:px-8" style={{ height: 60 }}>

          {/* ── LOGO ── */}
          <Link href="/" className="group relative flex shrink-0 items-center gap-3">
            {/* logo badge */}
            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl">
              {/* background layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#C50337] to-[#7a0120]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              {/* shine */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
              {/* border */}
              <div className="absolute inset-0 rounded-xl ring-1 ring-white/10" />
              {/* icon */}
              <svg className="relative h-5 w-5 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              </svg>
            </div>

            {/* wordmark */}
            <div className="hidden sm:block">
              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-[15px] font-bold tracking-tight text-white"
                  style={{ fontFamily: 'var(--font-poppins)', letterSpacing: '-0.01em' }}
                >
                  eFootball
                </span>
                <span className="rounded-md bg-[#C50337]/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-[#ff4d6d]">
                  AZ
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Tournament Platform</p>
            </div>
          </Link>

          {/* ── NAV LINKS ── */}
          <nav className="hidden flex-1 items-center justify-center gap-0.5 md:flex">
            {NAV_LINKS.map(({ href, label, icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-all duration-200 ${
                    active
                      ? 'text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {/* active bg pill */}
                  {active && (
                    <span className="absolute inset-0 rounded-lg bg-white/[0.06]" />
                  )}
                  {/* hover bg pill */}
                  <span className="absolute inset-0 rounded-lg bg-white/0 transition-colors duration-200 group-hover:bg-white/[0.04]" />

                  {/* icon */}
                  <span className={`relative transition-colors duration-200 ${active ? 'text-[#ff4d6d]' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                    {icon}
                  </span>

                  {/* label */}
                  <span className="relative">{label}</span>

                  {/* active underline */}
                  {active && (
                    <span className="absolute bottom-1 left-3.5 right-3.5 h-px rounded-full bg-gradient-to-r from-transparent via-[#C50337]/70 to-transparent" />
                  )}
                </Link>
              )
            })}

            {/* Admin link */}
            {user && isAdmin && (
              <Link
                href="/admin"
                className={`group relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-all duration-200 ${
                  pathname.startsWith('/admin') ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {pathname.startsWith('/admin') && (
                  <span className="absolute inset-0 rounded-lg bg-white/[0.06]" />
                )}
                <span className="absolute inset-0 rounded-lg bg-white/0 transition-colors group-hover:bg-white/[0.04]" />
                <span className={`relative ${pathname.startsWith('/admin') ? 'text-amber-400' : 'text-zinc-600 group-hover:text-amber-500/70'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.07 4.93a10 10 0 0 0-14.14 0" />
                    <path d="M4.93 19.07a10 10 0 0 0 14.14 0" />
                    <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
                  </svg>
                </span>
                <span className="relative">Admin</span>
                {pathname.startsWith('/admin') && (
                  <span className="absolute bottom-1 left-3.5 right-3.5 h-px rounded-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                )}
              </Link>
            )}
          </nav>

          {/* divider */}
          <div className="hidden h-5 w-px bg-white/[0.07] md:block" />

          {/* ── RIGHT SIDE ── */}
          <div className="hidden shrink-0 items-center gap-2.5 md:flex">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-8 w-24 animate-pulse rounded-lg bg-white/[0.05]" />
                <div className="h-8 w-8 animate-pulse rounded-full bg-white/[0.05]" />
              </div>
            ) : user ? (
              /* ── LOGGED IN ── */
              <div className="relative flex items-center gap-2" ref={profileMenuRef}>

                {/* profile button */}
                <button
                  onClick={() => setProfileOpen((p) => !p)}
                  className={`group flex items-center gap-2.5 rounded-xl border px-3 py-1.5 transition-all duration-200 ${
                    profileOpen
                      ? 'border-[#C50337]/40 bg-[#C50337]/15'
                      : 'border-white/[0.08] bg-white/[0.04] hover:border-[#C50337]/25 hover:bg-[#C50337]/8'
                  }`}
                >
                  {/* avatar */}
                  <div className="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profil" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#C50337]/60 to-[#8B0224]/80 text-xs font-bold text-white">
                        {avatarLetter}
                      </div>
                    )}
                    {/* online dot */}
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-[#02060E] bg-emerald-400" />
                  </div>

                  <span className="max-w-[90px] truncate text-[13px] font-medium text-zinc-200">
                    {username}
                  </span>

                  {isAdmin && (
                    <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                      ADM
                    </span>
                  )}

                  {/* chevron */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* ── PROFILE DROPDOWN ── */}
                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/50"
                    style={{ background: 'rgba(8, 12, 24, 0.97)', backdropFilter: 'blur(20px)' }}
                  >
                    {/* user info header */}
                    <div className="border-b border-white/[0.06] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="Profil" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#C50337]/60 to-[#8B0224]/80 text-sm font-bold text-white">
                              {avatarLetter}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{username}</p>
                          <p className="truncate text-[11px] text-zinc-500">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* menu items */}
                    <div className="p-1.5">
                      {[
                        { href: '/profile', label: 'Profil', icon: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />, extra: <circle cx="12" cy="7" r="4" /> },
                        { href: '/dashboard', label: 'Dashboard', icon: <rect x="3" y="3" width="7" height="7" />, extra: <><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></> },
                        { href: '/dashboard/my-tournaments', label: 'Turnirlərim', icon: <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />, extra: <><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /></> },
                        { href: '/dashboard/payments', label: 'Ödənişlər', icon: <rect x="2" y="5" width="20" height="14" rx="2" />, extra: <line x1="2" y1="10" x2="22" y2="10" /> },
                      ].map(({ href, label, icon, extra }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setProfileOpen(false)}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors ${
                            pathname === href || pathname.startsWith(href + '/')
                              ? 'bg-[#C50337]/15 text-white'
                              : 'text-zinc-300 hover:bg-white/[0.05] hover:text-white'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            {icon}{extra}
                          </svg>
                          {label}
                        </Link>
                      ))}

                      {isAdmin && (
                        <Link href="/admin" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-amber-400/90 transition-colors hover:bg-amber-500/[0.08] hover:text-amber-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 0-14.14 0" /><path d="M4.93 19.07a10 10 0 0 0 14.14 0" />
                          </svg>
                          Admin Panel
                        </Link>
                      )}
                    </div>

                    {/* logout */}
                    <div className="border-t border-white/[0.06] p-1.5">
                      <form action="/auth/signout" method="post">
                        <button type="submit"
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-red-400/90 transition-colors hover:bg-red-500/[0.08] hover:text-red-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          Çıxış et
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── LOGGED OUT ── */
              <div className="flex items-center gap-2">
                <Link href="/login"
                  className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-zinc-300 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.07] hover:text-white">
                  Daxil ol
                </Link>
                <Link href="/register"
                  className="group relative overflow-hidden rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#C50337]/20"
                  style={{ background: 'linear-gradient(135deg, #C50337 0%, #8B0224 100%)' }}
                >
                  {/* shine sweep */}
                  <span className="absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                  <span className="relative">Qeydiyyat</span>
                </Link>
              </div>
            )}
          </div>

          {/* ── MOBILE HAMBURGER ── */}
          <button
            type="button"
            onClick={() => setMenuOpen((p) => !p)}
            aria-label="Menyu"
            className={`ml-auto flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 md:hidden ${
              menuOpen
                ? 'border-[#C50337]/30 bg-[#C50337]/15 text-white'
                : 'border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:border-white/[0.12] hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              ) : (
                <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* ── MOBILE MENU ─────────────────────────────────────────── */}
      {menuOpen && (
        <div
          className="fixed inset-x-0 top-[60px] z-40 md:hidden"
          style={{
            background: 'rgba(4, 8, 18, 0.98)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* top glow line */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#C50337]/40 to-transparent" />

          <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">

            {/* User info card */}
            {user && !loading && (
              <Link href="/profile" onClick={() => setMenuOpen(false)}
                className="mb-3 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profil" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#C50337]/60 to-[#8B0224]/80 text-sm font-bold text-white">
                      {avatarLetter}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#04080E] bg-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-semibold text-white">
                    {username}
                    {isAdmin && (
                      <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">ADM</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{user.email}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            )}

            {/* Nav links */}
            <div className="flex flex-col gap-0.5">
              {NAV_LINKS.map(({ href, label, icon }) => {
                const active = isActive(href)
                return (
                  <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                      active
                        ? 'bg-[#C50337]/12 font-medium text-white'
                        : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                    }`}
                  >
                    <span className={active ? 'text-[#ff4d6d]' : 'text-zinc-600'}>{icon}</span>
                    {label}
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#C50337]" />}
                  </Link>
                )
              })}

              {user && !loading && (
                <>
                  <Link href="/dashboard/my-tournaments" onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                      pathname.startsWith('/dashboard') ? 'bg-[#C50337]/12 font-medium text-white' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                    }`}>
                    <span className={pathname.startsWith('/dashboard') ? 'text-[#ff4d6d]' : 'text-zinc-600'}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                      </svg>
                    </span>
                    Turnirlərim
                  </Link>

                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-amber-400/90 transition-colors hover:bg-amber-500/[0.06]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 0-14.14 0" /><path d="M4.93 19.07a10 10 0 0 0 14.14 0" />
                      </svg>
                      Admin Panel
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* divider */}
            <div className="my-2 h-px bg-white/[0.05]" />

            {/* Auth actions */}
            <div className="pb-2">
              {loading ? (
                <div className="h-11 animate-pulse rounded-xl bg-white/[0.04]" />
              ) : user ? (
                <form action="/auth/signout" method="post">
                  <button type="submit"
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/[0.08] hover:text-red-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Çıxış et
                  </button>
                </form>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/login" onClick={() => setMenuOpen(false)}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-center text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.07]">
                    Daxil ol
                  </Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)}
                    className="group relative overflow-hidden rounded-xl px-4 py-3 text-center text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #C50337 0%, #8B0224 100%)' }}
                  >
                    <span className="absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                    <span className="relative">Qeydiyyat</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 top-[60px] z-30 md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  )
}
