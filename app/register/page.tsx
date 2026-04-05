'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUsernameError, normalizeUsername } from '@/lib/usernames'
import Link from 'next/link'

type Step = 1 | 2

export default function RegisterPage() {
  const supabase = createClient()

  const [step, setStep] = useState<Step>(1)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')

  // Password strength
  const passwordStrength = (() => {
    if (!password) return 0
    let s = 0
    if (password.length >= 8) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  })()

  const strengthLabel = ['', 'Zəif', 'Orta', 'Yaxşı', 'Güclü'][passwordStrength]
  const strengthColor = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-[#C50337]'][passwordStrength]

  // Username live check (debounced)
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus('idle')
      return
    }
    const normalized = normalizeUsername(username)
    const err = getUsernameError(normalized)
    if (err) {
      setUsernameStatus('invalid')
      return
    }
    setUsernameStatus('checking')
    const t = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('id').eq('username', normalized).maybeSingle()
      setUsernameStatus(data ? 'taken' : 'available')
    }, 500)
    return () => clearTimeout(t)
  }, [username])

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Ad soyad ən azı 2 simvol olmalıdır.')
      return
    }
    if (usernameStatus === 'taken') {
      setError('Bu username artıq istifadə olunur.')
      return
    }
    if (usernameStatus === 'invalid') {
      setError('Username yalnız kiçik hərf, rəqəm və _ işarəsi ola bilər (3-20 simvol).')
      return
    }
    setStep(2)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Şifrə ən azı 6 simvol olmalıdır.')
      return
    }
    if (password !== confirmPassword) {
      setError('Şifrələr eyni deyil.')
      return
    }

    const normalizedUsername = normalizeUsername(username)
    setLoading(true)

    // Final username check before submit
    const { data: existingUsername } = await supabase
      .from('profiles').select('id').eq('username', normalizedUsername).maybeSingle()

    if (existingUsername) {
      setLoading(false)
      setError('Bu username artıq istifadə olunur.')
      return
    }

    const redirectUrl = `${window.location.origin}/auth/confirm`

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: normalizedUsername,
          full_name: fullName.trim(),
        },
      },
    })

    setLoading(false)

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('Bu email artıq qeydiyyatdan keçib.')
      } else {
        setError(signUpError.message)
      }
      return
    }

    setMessage('success')
  }

  const inputCls = (hasValue: boolean) =>
    `peer w-full rounded-2xl border bg-[#02060E]/80 px-4 pb-3 pt-5 text-sm text-white placeholder-transparent outline-none transition-all duration-200 ${
      hasValue
        ? 'border-[#C50337]/40 bg-[#C50337]/6'
        : 'border-[#C50337]/12 hover:border-[#C50337]/25 focus:border-[#C50337]/45 focus:bg-[#C50337]/5'
    }`

  const labelCls = 'pointer-events-none absolute left-4 top-4 origin-left text-sm text-zinc-500 transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-[#ff4d6d] peer-not-placeholder-shown:top-1.5 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:font-semibold peer-not-placeholder-shown:uppercase peer-not-placeholder-shown:tracking-wider peer-not-placeholder-shown:text-zinc-500'

  // Success screen
  if (message === 'success') {
    return (
      <main className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[20%] top-[10%] h-72 w-72 rounded-full bg-[#C50337]/8 blur-[80px]" />
        </div>
        <div className="relative w-full max-w-[420px]">
          <div className="overflow-hidden rounded-[28px] border border-[#C50337]/18 bg-[#050A12]/95 shadow-[0_0_80px_rgba(197,3,55,0.08)] backdrop-blur-2xl">
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#C50337] to-transparent opacity-60" />
            <div className="p-9 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#C50337]/25 bg-[#C50337]/10">
                <svg className="h-7 w-7 text-[#ff4d6d]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>Email göndərildi!</h2>
              <p className="mt-2 text-sm text-zinc-400">
                <span className="font-medium text-zinc-200">{email}</span> ünvanına təsdiq linki göndərildi. Zəhmət olmasa email-inizi yoxlayın.
              </p>
              <Link href="/login"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#C50337] to-[#8B0224] py-3 text-sm font-semibold text-white shadow-lg shadow-[#C50337]/25">
                Daxil ol səhifəsi
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden px-4 py-12">

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[20%] top-[10%] h-72 w-72 rounded-full bg-[#C50337]/8 blur-[80px]" />
        <div className="absolute bottom-[15%] right-[15%] h-56 w-56 rounded-full bg-[#8B0224]/6 blur-[70px]" />
      </div>

      <div className="relative w-full max-w-[440px]">

        {/* Top bar */}
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

        {/* Card */}
        <div className="relative overflow-hidden rounded-[28px] border border-[#C50337]/18 bg-[#050A12]/95 shadow-[0_0_80px_rgba(197,3,55,0.08)] backdrop-blur-2xl">
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#C50337] to-transparent opacity-60" />

          <div className="p-7 sm:p-9">

            {/* Step indicator */}
            <div className="mb-7 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all ${step >= 1 ? 'bg-[#C50337] text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                  {step > 1 ? (
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  ) : '1'}
                </div>
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${step === 1 ? 'text-zinc-300' : 'text-zinc-600'}`}>Şəxsi məlumat</span>
              </div>
              <div className="h-px flex-1 bg-[#C50337]/15" />
              <div className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all ${step >= 2 ? 'bg-[#C50337] text-white' : 'bg-zinc-800 text-zinc-500'}`}>2</div>
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${step === 2 ? 'text-zinc-300' : 'text-zinc-600'}`}>Təhlükəsizlik</span>
              </div>
            </div>

            {/* Header */}
            <div className="mb-7">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-[#C50337]">
                {step === 1 ? 'Addım 1 / 2' : 'Addım 2 / 2'}
              </p>
              <h1 className="text-[26px] font-bold leading-tight text-white" style={{ fontFamily: 'var(--font-poppins)' }}>
                {step === 1 ? 'Hesab yarat' : 'Şifrə təyin et'}
              </h1>
              <p className="mt-1.5 text-[13px] text-zinc-500">
                {step === 1
                  ? 'Profil məlumatlarını daxil et'
                  : 'Hesabını qorumaq üçün güclü şifrə seç'}
              </p>
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">

                {/* Full Name */}
                <div className="relative">
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Ad Soyad"
                    className={inputCls(!!fullName)}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                    autoFocus
                  />
                  <label htmlFor="fullName" className={labelCls}>Ad Soyad</label>
                </div>

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
                  <label htmlFor="email" className={labelCls}>Email ünvanı</label>
                </div>

                {/* Username */}
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    placeholder="Username"
                    className={`${inputCls(!!username)} pr-10`}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    minLength={3}
                    maxLength={20}
                    required
                    autoComplete="username"
                  />
                  <label htmlFor="username" className={labelCls}>Username</label>

                  {/* Username status icon */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && (
                      <svg className="h-4 w-4 animate-spin text-zinc-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    )}
                    {usernameStatus === 'available' && (
                      <svg className="h-4 w-4 text-[#C50337]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    )}
                    {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                      <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    )}
                  </div>
                </div>

                {/* Username hint */}
                {username.length > 0 && (
                  <p className={`-mt-2 text-[11px] ${
                    usernameStatus === 'available' ? 'text-[#C50337]' :
                    usernameStatus === 'taken' ? 'text-red-400' :
                    usernameStatus === 'invalid' ? 'text-red-400' :
                    'text-zinc-600'
                  }`}>
                    {usernameStatus === 'available' && '✓ Bu username mövcuddur'}
                    {usernameStatus === 'taken' && '✕ Bu username artıq istifadə olunur'}
                    {usernameStatus === 'invalid' && '✕ Yalnız kiçik hərf, rəqəm və _ (3-20 simvol)'}
                    {usernameStatus === 'checking' && 'Yoxlanılır...'}
                  </p>
                )}

                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p className="text-[13px] text-red-300">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={usernameStatus === 'taken' || usernameStatus === 'checking'}
                  className="group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#C50337] to-[#8B0224] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#C50337]/25 transition-all hover:shadow-[#C50337]/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Növbəti addım
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </form>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <form onSubmit={handleRegister} className="space-y-4">

                {/* Profile summary */}
                <div className="flex items-center gap-3 rounded-2xl border border-[#C50337]/12 bg-[#C50337]/5 px-4 py-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#C50337] to-[#8B0224] text-sm font-bold text-white">
                    {fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{fullName}</p>
                    <p className="truncate text-xs text-zinc-500">@{username} · {email}</p>
                  </div>
                  <button type="button" onClick={() => { setStep(1); setError('') }}
                    className="ml-auto flex-shrink-0 rounded-lg border border-[#C50337]/15 px-2.5 py-1 text-[11px] text-zinc-500 transition hover:border-[#C50337]/30 hover:text-zinc-300">
                    Dəyiş
                  </button>
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
                    autoComplete="new-password"
                    autoFocus
                  />
                  <label htmlFor="password" className={labelCls}>Şifrə</label>
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 transition hover:text-zinc-300" tabIndex={-1}>
                    {showPassword
                      ? <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>

                {/* Password strength */}
                {password && (
                  <div className="-mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength ? strengthColor : 'bg-zinc-800'}`} />
                      ))}
                    </div>
                    <p className={`text-[11px] ${passwordStrength <= 1 ? 'text-red-400' : passwordStrength === 2 ? 'text-orange-400' : passwordStrength === 3 ? 'text-yellow-400' : 'text-[#C50337]'}`}>
                      Şifrə gücü: {strengthLabel}
                    </p>
                  </div>
                )}

                {/* Confirm Password */}
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Şifrəni təkrar et"
                    className={`${inputCls(!!confirmPassword)} pr-12`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <label htmlFor="confirmPassword" className={labelCls}>Şifrəni təkrar et</label>
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 transition hover:text-zinc-300" tabIndex={-1}>
                    {showConfirm
                      ? <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>

                {/* Confirm match indicator */}
                {confirmPassword && (
                  <p className={`-mt-2 text-[11px] ${password === confirmPassword ? 'text-[#C50337]' : 'text-red-400'}`}>
                    {password === confirmPassword ? '✓ Şifrələr uyğun gəlir' : '✕ Şifrələr uyğun gəlmir'}
                  </p>
                )}

                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p className="text-[13px] text-red-300">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-2 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#C50337] to-[#8B0224] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#C50337]/25 transition-all hover:shadow-[#C50337]/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className={`flex items-center justify-center gap-2 transition-opacity ${loading ? 'opacity-0' : 'opacity-100'}`}>
                    Hesab yarat
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
            )}

            {/* Divider + Login link */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#C50337]/10" />
              <span className="text-[11px] text-zinc-600">ARTIQ HESABIN VAR?</span>
              <div className="h-px flex-1 bg-[#C50337]/10" />
            </div>

            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#C50337]/20 bg-transparent py-3 text-sm font-medium text-zinc-300 transition-all hover:border-[#C50337]/35 hover:bg-[#C50337]/6 hover:text-white"
            >
              Daxil ol
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>

          </div>
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#C50337]/20 to-transparent" />
        </div>

        <p className="mt-5 text-center text-[11px] text-zinc-700">
          © 2025 eFootball Platform · Bütün hüquqlar qorunur
        </p>
      </div>
    </main>
  )
}
