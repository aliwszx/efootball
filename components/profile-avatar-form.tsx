'use client'

import { useActionState } from 'react'
import { updateProfileAvatar, type ProfileActionState } from '@/app/actions/profile'

const initialState: ProfileActionState = {}

export default function ProfileAvatarForm({
  currentAvatarUrl,
}: {
  currentAvatarUrl?: string | null
}) {
  const [state, formAction, pending] = useActionState(updateProfileAvatar, initialState)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h2 className="mb-4 text-xl font-semibold text-white">Profil şəkli</h2>

      <div className="mb-4 flex items-center gap-4">
        <div className="h-24 w-24 overflow-hidden rounded-full border border-white/10 bg-black/30">
          {currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt="Profil şəkli"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
              Şəkil yoxdur
            </div>
          )}
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        <input
          type="file"
          name="avatar"
          accept="image/*"
          className="block w-full rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-white"
        />

        {state.error ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {state.error}
          </p>
        ) : null}

        {state.success ? (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            {state.success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-cyan-400 px-5 py-3 font-medium text-black disabled:opacity-60"
        >
          {pending ? 'Yüklənir...' : 'Profil şəklini yenilə'}
        </button>
      </form>
    </div>
  )
}
