'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/confirm',
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage('Email təsdiq linki göndərildi.')
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
            type="password"
            placeholder="Şifrə"
            className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-white placeholder:text-zinc-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

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
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 p-4 font-semibold text-black transition hover:scale-[1.01]"
        >
          {loading ? 'Loading...' : 'Hesab yarat'}
        </button>
      </form>
    </main>
  )
}