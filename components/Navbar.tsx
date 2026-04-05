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
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
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
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {}
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenuOpen(false) }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleEscape) }
  }, [])

  const username = profile?.username || user?.email || 'İstifadəçi'
  const isAdmin = profile?.role === 'admin'
  const avatarUrl = profile?.avatar_url || ''
  const avatarLetter = username.charAt(0).toUpperCase()

  return (
    <header className={`sticky top-0 z-50 overflow-visible transition-all duration-300 ${
      scrolled
        ? 'border-b border-[#C50337]/20 bg-[#02060E]/90 backdrop-blur-2xl'
        : 'border-b border-[#C50337]/10 bg-[#02060E]/75 backdrop-blur-xl'
    }`}>
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#C50337] to-[#8B0224] shadow-lg shadow-[#C50337]/25 transition-shadow group-hover:shadow-[#C50337]/40">
            <span className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-syne)' }}>E</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Platform</p>
            <p className="text-[15px] font-bold leading-tight text-white" style={{ fontFamily: 'var(--font-syne)' }}>eFootball</p>
          </div>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="rounded-lg px-4 py-2 text-sm text-zinc-300 transition-colors duration-150 hover:bg-[#C50337]/10 hover:text-white">
              {label}
            </Link>
          ))}
          {user && isAdmin && (
            <Link href="/admin" className="rounded-lg px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-[#C50337]/10 hover:text-white">
              Admin
            </Link>
          )}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          {loading ? (
            <div className="h-9 w-36 animate-pulse rounded-xl border border-[#C50337]/10 bg-[#C50337]/5" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <Link href="/profile" className="flex items-center gap-2.5 rounded-xl border border-[#C50337]/20 bg-[#C50337]/10 px-3 py-2 transition-all hover:border-[#C50337]/35 hover:bg-[#C50337]/15">
                <div className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-full border border-[#C50337]/30 bg-[#C50337]/20">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profil" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#ff4d6d]">{avatarLetter}</div>
                  )}
                </div>
                <span className="max-w-[110px] truncate text-sm font-medium text-white">{username}</span>
                {isAdmin && (
                  <span className="rounded-md bg-[#C50337]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#ff4d6d]">Admin</span>
                )}
              </Link>
              <form action="/auth/signout" method="post">
                <button type="submit" title="Çıxış"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 text-red-400 transition-all hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <Link href="/login" className="rounded-xl border border-[#C50337]/20 bg-[#C50337]/10 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#C50337]/15">
                Daxil ol
              </Link>
              <Link href="/register" className="rounded-xl bg-gradient-to-r from-[#C50337] to-[#8B0224] px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-[#C50337]/25">
                Qeydiyyat
              </Link>
            </div>
          )}
        </div>

        <button type="button" onClick={() => setMenuOpen((p) => !p)}
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl border border-[#C50337]/15 bg-[#C50337]/8 text-zinc-300 transition hover:text-white md:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {menuOpen ? (<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>) : (<><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>)}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-[#C50337]/10 bg-[#02060E]/98 px-4 py-3 backdrop-blur-2xl md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {user && !loading && (
              <Link href="/profile" onClick={() => setMenuOpen(false)}
                className="mb-2 flex items-center gap-3 rounded-xl border border-[#C50337]/15 bg-[#C50337]/8 px-4 py-3">
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-[#C50337]/25 bg-[#C50337]/15">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profil" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#ff4d6d]">{avatarLetter}</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{username}</p>
                  <p className="truncate text-xs text-zinc-500">{user.email}</p>
                </div>
              </Link>
            )}
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm text-zinc-300 transition-colors hover:bg-[#C50337]/10 hover:text-white">
                {label}
              </Link>
            ))}
            {user && (
              <>
                <Link href="/dashboard/my-tournaments" onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm text-zinc-300 transition-colors hover:bg-[#C50337]/10 hover:text-white">
                  Turnirlərim
                </Link>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm text-zinc-300 transition-colors hover:bg-[#C50337]/10 hover:text-white">
                    Admin panel
                  </Link>
                )}
              </>
            )}
            <div className="my-1 h-px bg-[#C50337]/10" />
            {loading ? (
              <div className="h-11 animate-pulse rounded-xl bg-[#C50337]/5" />
            ) : user ? (
              <form action="/auth/signout" method="post">
                <button type="submit" className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10">
                  Çıxış
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link href="/login" onClick={() => setMenuOpen(false)}
                  className="rounded-xl border border-[#C50337]/15 bg-[#C50337]/8 px-4 py-3 text-center text-sm text-white">
                  Daxil ol
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)}
                  className="rounded-xl bg-gradient-to-r from-[#C50337] to-[#8B0224] px-4 py-3 text-center text-sm font-semibold text-white">
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
