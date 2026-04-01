'use client'

import { useActionState, useEffect, useState } from 'react'
import { updateUsername, type UpdateUsernameState } from './actions'

type ProfileFormProps = {
  currentUsername: string
  email: string
  payments: any[]
}

const initialState: UpdateUsernameState = {}

export default function ProfileForm({ currentUsername, email, payments }: ProfileFormProps) {
  const [username, setUsername] = useState(currentUsername)
  const [state, formAction, pending] = useActionState(updateUsername, initialState)

  useEffect(() => {
    setUsername(currentUsername)
  }, [currentUsername])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        action={formAction}
        className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8"
      >
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-cyan-300">Profil</p>
        <h1 className="text-3xl font-bold sm:text-4xl">Hesab ayarları</h1>
        <p className="mt-3 text-sm text-zinc-400">Email: {email}</p>

        <div className="mt-6 space-y-2">
          <label htmlFor="username" className="text-sm text-zinc-300">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
            }
            placeholder="meselen: ali_player"
            className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-white placeholder:text-zinc-500 outline-none"
            minLength={3}
            maxLength={20}
            required
          />
          <p className="text-xs text-zinc-500">
            Yalnız kiçik hərf, rəqəm və underscore (_). Minimum 3, maksimum 20 simvol.
          </p>
        </div>

        {state?.error && (
          <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
            {state.error}
          </p>
        )}

        {state?.success && (
          <p className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {state.success}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 font-semibold text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? 'Yenilənir...' : 'Username dəyiş'}
        </button>
      </form>

      <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-cyan-300">Billing</p>
        <h2 className="text-3xl font-bold">Ödənişlərim</h2>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-300">
          Hələlik ödəniş tapılmadı.
        </div>
      </section>
    </div>
  )
}
