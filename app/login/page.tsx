'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      if (error.message.includes('Invalid login')) {
        setError('Email və ya şifrə yanlışdır.')
      } else if (error.message.includes('Email not confirmed')) {
        setError('Email ünvanınız təsdiqlənməyib. Zəhmət olmasa email-inizi yoxlayın.')
      } else {
        setError(error.message)
      }
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const inputCls = (hasValue: boolean) =>
    `peer w-full rounded-2xl border bg-[#02060E]/80 px-4 pb-3 pt-5 text-sm text-white placeholder-transparent outline-none transition-all duration-200 ${
      hasValue
        ? 'border-[#C50337]/40 bg-[#C50337]/6'
        : 'border-[#C50337]/12 hover:border-[#C50337]/25 focus:border-[#C50337]/45 focus:bg-[#C50337]/5'
    }`

  const labelCls = 'pointer-events-none absolute left-4 top-4 origin-left text-sm text-zinc-500 transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-[#ff4d6d] peer-not-placeholder-shown:top-1.5 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:font-semibold peer-not-placeholder-shown:uppercase peer-not-placeholder-shown:tracking-wider peer-not-placeholder-shown:text-zinc-500'

  return (
    <main className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden px-4 py-12">

      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[20%] top-[10%] h-72 w-72 rounded-full bg-[#C50337]/8 blur-[80px]" />
        <div className="absolute bottom-[15%] right-[15%] h-56 w-56 rounded-full bg-[#8B0224]/6 blur-[70px]" />
      </div>

      <div className="relative w-full max-w-[420px]">

        {/* Decorative top bar */}
        <div className="mb-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#C50337]/30 to-transparent" />
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#C50337] to-[#6B0120] shadow-lg shadow-[#C50337]/30">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
              </svg>
            </div>
            <span className="text-sm font-bold tracking-wide text-white" style={{ fontFamily: 'var(--font-poppins)' }}>
              eFootball<span className="text-[#C50337]">.</span>az
            </span>
          </Link>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#C50337]/30 to-transparent" />
        </div>

        {/* Main card */}
        <div className="relative overflow-hidden rounded-[28px] border border-[#C50337]/18 bg-[#050A12]/95 shadow-[0_0_80px_rgba(197,3,55,0.08)] backdrop-blur-2xl">

          {/* Top accent line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#C50337] to-transparent opacity-60" />

          <div className="p-7 sm:p-9">

            {/* Header */}
            <div className="mb-8">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-[#C50337]">Hesabına daxil ol</p>
              <h1 className="text-[28px] font-bold leading-none text-white" style={{ fontFamily: 'var(--font-poppins)' }}>
                Xoş gəldin
              </h1>
              <p className="mt-2 text-[13px] text-zinc-500">
                Turnirə qoşulmaq üçün hesabına daxil ol
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">

              {/* Email */}
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="Email ünvanı"
                  className={inputCls(!!email)}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <label htmlFor="email" className={labelCls}>
                  Email ünvanı
                </label>
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Şifrə"
                  className={`${inputCls(!!password)} pr-12`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <label htmlFor="password" className={labelCls}>
                  Şifrə
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 transition hover:text-zinc-300"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p className="text-[13px] text-red-300">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group relative mt-2 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#C50337] to-[#8B0224] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#C50337]/25 transition-all duration-200 hover:shadow-[#C50337]/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className={`flex items-center justify-center gap-2 transition-opacity ${loading ? 'opacity-0' : 'opacity-100'}`}>
                  Daxil ol
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </span>
                {loading && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  </span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#C50337]/10" />
              <span className="text-[11px] text-zinc-600">HESABIN YOXDUR?</span>
              <div className="h-px flex-1 bg-[#C50337]/10" />
            </div>

            {/* Register link */}
            <Link
              href="/register"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#C50337]/20 bg-transparent py-3 text-sm font-medium text-zinc-300 transition-all duration-200 hover:border-[#C50337]/35 hover:bg-[#C50337]/6 hover:text-white"
            >
              Yeni hesab yarat
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>

          </div>

          {/* Bottom subtle glow */}
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#C50337]/20 to-transparent" />
        </div>

        {/* Footer note */}
        <p className="mt-5 text-center text-[11px] text-zinc-700">
          © 2025 eFootball Platform · Bütün hüquqlar qorunur
        </p>
      </div>
    </main>
  )
}
