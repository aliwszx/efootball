'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUsernameError, normalizeUsername } from '@/lib/usernames'
import Link from 'next/link'

export default function RegisterPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    const normalizedUsername = normalizeUsername(username)
    const usernameError = getUsernameError(normalizedUsername)

    if (usernameError) {
      setError(usernameError)
      return
    }

    if (password.length < 6) {
      setError('Şifrə ən azı 6 simvol olmalıdır.')
      return
    }

    if (password !== confirmPassword) {
      setError('Şifrələr eyni deyil.')
      return
    }

    setLoading(true)

    const { data: existingUsername } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle()

    if (existingUsername) {
      setLoading(false)
      setError('Bu username artıq istifadə olunur.')
      return
    }

    const redirectUrl = `${window.location.origin}/auth/confirm`

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: normalizedUsername,
        },
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage('Email təsdiq linki göndərildi.')
    setUsername('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-[28px] border border-[#C50337]/20 bg-[#C50337]/5 p-1 shadow-2xl shadow-[#C50337]/10 backdrop-blur-xl">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#C50337]/10 via-transparent to-[#8B0224]/5" />
          <div className="rounded-[24px] border border-[#C50337]/10 bg-[#02060E] p-6 sm:p-8">

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#C50337] to-[#8B0224] shadow-lg shadow-[#C50337]/30">
                <span className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>E</span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Platform</p>
                <p className="text-[15px] font-bold leading-tight text-white" style={{ fontFamily: 'var(--font-poppins)' }}>eFootball</p>
              </div>
            </div>

            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#ff4d6d]">Yeni hesab</p>
            <h1 className="mb-6 text-2xl font-bold sm:text-3xl" style={{ fontFamily: 'var(--font-poppins)' }}>Qeydiyyat</h1>

            <form onSubmit={handleRegister} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                className="w-full rounded-2xl border border-[#C50337]/15 bg-[#C50337]/5 p-4 text-white placeholder:text-zinc-600 transition focus:border-[#C50337]/40 focus:bg-[#C50337]/8"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                type="text"
                placeholder="Username"
                className="w-full rounded-2xl border border-[#C50337]/15 bg-[#C50337]/5 p-4 text-white placeholder:text-zinc-600 transition focus:border-[#C50337]/40 focus:bg-[#C50337]/8"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                minLength={3}
                maxLength={20}
                required
              />

              <input
                type="password"
                placeholder="Şifrə"
                className="w-full rounded-2xl border border-[#C50337]/15 bg-[#C50337]/5 p-4 text-white placeholder:text-zinc-600 transition focus:border-[#C50337]/40 focus:bg-[#C50337]/8"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Şifrəni təkrar et"
                className="w-full rounded-2xl border border-[#C50337]/15 bg-[#C50337]/5 p-4 text-white placeholder:text-zinc-600 transition focus:border-[#C50337]/40 focus:bg-[#C50337]/8"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <p className="text-xs text-zinc-600">
                Username yalnız kiçik hərf, rəqəm və underscore (_) ilə olmalıdır.
              </p>

              {error && (
                <p className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </p>
              )}

              {message && (
                <p className="rounded-2xl border border-[#C50337]/25 bg-[#C50337]/10 p-3 text-sm text-[#ff4d6d]">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-2xl bg-gradient-to-r from-[#C50337] to-[#8B0224] p-4 font-semibold text-white shadow-lg shadow-[#C50337]/25 transition hover:scale-[1.01] hover:shadow-[#C50337]/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Yüklənir...' : 'Hesab yarat'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-zinc-500">
              Artıq hesabın var?{' '}
              <Link href="/login" className="font-medium text-[#ff4d6d] transition hover:text-white">
                Daxil ol
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
