'use client'

import { useActionState } from 'react'
import { updateProfileAvatar, type ProfileActionState } from '@/app/actions/profile'

type ProfileFormProps = {
  currentUsername: string
  fullName: string
  avatarUrl: string
  email: string
  payments: any[]
}

const initialState: ProfileActionState = {}

export default function ProfileForm({
  currentUsername,
  fullName,
  avatarUrl,
  email,
  payments,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAvatar, initialState)

  const displayName = fullName || currentUsername || 'İstifadəçi'
  const avatarLetter = (currentUsername || email || 'U').charAt(0).toUpperCase()

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="text-2xl font-bold text-white">Hesab məlumatları</h2>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="h-28 w-28 overflow-hidden rounded-full border border-white/10 bg-white/5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profil şəkli"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-cyan-300">
                {avatarLetter}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xl font-semibold text-white">{displayName}</p>
            <p className="mt-1 break-all text-sm text-zinc-400">{email}</p>
            <p className="mt-2 text-sm text-zinc-500">@{currentUsername || 'username'}</p>
          </div>
        </div>

        <form action={formAction} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Yeni profil şəkli
            </label>
            <input
              type="file"
              name="avatar"
              accept="image/*"
              className="block w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:opacity-90"
            />
            <p className="mt-2 text-xs text-zinc-500">PNG, JPG, WEBP. Maksimum 3 MB.</p>
          </div>

          {state.error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {state.error}
            </div>
          ) : null}

          {state.success ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {state.success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? 'Yüklənir...' : 'Profil şəklini yenilə'}
          </button>
        </form>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="text-2xl font-bold text-white">Ödəniş tarixçəsi</h2>

        <div className="mt-6 space-y-3">
          {payments.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-5 text-sm text-zinc-400">
              Hələ ödəniş qeydi yoxdur.
            </div>
          ) : (
            payments.map((payment: any) => (
              <div
                key={payment.id}
                className="rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {payment.amount} {payment.currency}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {payment.created_at
                        ? new Date(payment.created_at).toLocaleString()
                        : 'Tarix yoxdur'}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      payment.status === 'completed'
                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : payment.status === 'failed'
                        ? 'border border-red-500/30 bg-red-500/10 text-red-300'
                        : 'border border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
