'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUsernameError, normalizeUsername } from '@/lib/usernames'

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
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:rounded-[32px] sm:p-8"
      >
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-emerald-300">
          Create account
        </p>
        <h1 className="mb-6 text-2xl font-bold sm:text-3xl">Qeydiyyat</h1>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-white placeholder:text-zinc-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Username"
            className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-white placeholder:text-zinc-500"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            minLength={3}
            maxLength={20}
            required
          />

          <input
            type="password"
            placeholder="Şifrə"
            className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-white placeholder:text-zinc-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Şifrəni təkrar et"
            className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-white placeholder:text-zinc-500"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          Username yalnız kiçik hərf, rəqəm və underscore (_) ilə olmalıdır.
        </p>

        {error && (
          <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </p>
        )}

        {message && (
          <p className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 p-4 font-semibold text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Loading...' : 'Hesab yarat'}
        </button>
      </form>
    </main>
  )
}
