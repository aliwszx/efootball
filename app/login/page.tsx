'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:rounded-[32px] sm:p-8"
      >
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-cyan-300">
          Welcome back
        </p>
        <h1 className="mb-6 text-2xl font-bold sm:text-3xl">Daxil ol</h1>

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

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 p-4 font-semibold text-black transition hover:scale-[1.01]"
        >
          {loading ? 'Loading...' : 'Daxil ol'}
        </button>
      </form>
    </main>
  )
}