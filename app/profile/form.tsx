'use client'

import { useActionState } from 'react'
import { updateProfileAvatar, updateUsername, type ProfileActionState } from '@/app/actions/profile'

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
  const [avatarState, avatarFormAction, avatarPending] = useActionState(updateProfileAvatar, initialState)
  const [usernameState, usernameFormAction, usernamePending] = useActionState(updateUsername, initialState)

  const displayName = fullName || currentUsername || 'İstifadəçi'
  const avatarLetter = (currentUsername || email || 'U').charAt(0).toUpperCase()

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">

      {/* LEFT — Avatar + Username */}
      <div className="flex flex-col gap-6">

        {/* Avatar Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0d1424] p-6">
          <h2 className="text-lg font-semibold text-white">Profil şəkli</h2>

          <div className="mt-5 flex items-center gap-5">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-[#00e5a0]/30 bg-[#0b1120]">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profil" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#00e5a0]">
                  {avatarLetter}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white">{displayName}</p>
              <p className="mt-0.5 truncate text-sm text-zinc-400">{email}</p>
              <p className="mt-0.5 text-sm text-zinc-500">@{currentUsername || 'username'}</p>
            </div>
          </div>

          <form action={avatarFormAction} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Yeni şəkil seç
              </label>
              <input
                type="file"
                name="avatar"
                accept="image/*"
                className="block w-full rounded-xl border border-white/10 bg-[#080e1a] px-4 py-3 text-sm text-white
                  file:mr-4 file:rounded-lg file:border-0 file:bg-[#00e5a0] file:px-4 file:py-1.5
                  file:text-sm file:font-semibold file:text-black hover:file:opacity-90"
              />
              <p className="mt-1.5 text-xs text-zinc-600">PNG, JPG, WEBP — maks. 3 MB</p>
            </div>

            {avatarState.error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {avatarState.error}
              </div>
            )}
            {avatarState.success && (
              <div className="rounded-xl border border-[#00e5a0]/20 bg-[#00e5a0]/10 px-4 py-3 text-sm text-[#00e5a0]">
                {avatarState.success}
              </div>
            )}

            <button
              type="submit"
              disabled={avatarPending}
              className="w-full rounded-xl bg-[#00e5a0] px-5 py-3 text-sm font-bold text-black transition
                hover:bg-[#00cc8e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {avatarPending ? 'Yüklənir...' : 'Şəkli yenilə'}
            </button>
          </form>
        </div>

        {/* Username Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0d1424] p-6">
          <h2 className="text-lg font-semibold text-white">Username dəyiş</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Cari: <span className="font-medium text-[#00e5a0]">@{currentUsername || '—'}</span>
          </p>

          <form action={usernameFormAction} className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Yeni username
              </label>
              <div className="flex items-center rounded-xl border border-white/10 bg-[#080e1a] px-4 py-3 focus-within:border-[#00e5a0]/40 transition">
                <span className="mr-1 text-sm text-zinc-500">@</span>
                <input
                  type="text"
                  name="username"
                  defaultValue={currentUsername}
                  placeholder="yeni_username"
                  autoComplete="off"
                  className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
                />
              </div>
              <p className="mt-1.5 text-xs text-zinc-600">
                Hərflər, rəqəmlər və _ işarəsi. 3–20 simvol.
              </p>
            </div>

            {usernameState.error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {usernameState.error}
              </div>
            )}
            {usernameState.success && (
              <div className="rounded-xl border border-[#00e5a0]/20 bg-[#00e5a0]/10 px-4 py-3 text-sm text-[#00e5a0]">
                {usernameState.success}
              </div>
            )}

            <button
              type="submit"
              disabled={usernamePending}
              className="w-full rounded-xl bg-[#00e5a0] px-5 py-3 text-sm font-bold text-black transition
                hover:bg-[#00cc8e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {usernamePending ? 'Saxlanılır...' : 'Usernamei yenilə'}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT — Payment History */}
      <div className="rounded-2xl border border-white/10 bg-[#0d1424] p-6">
        <h2 className="text-lg font-semibold text-white">Ödəniş tarixçəsi</h2>

        <div className="mt-5 space-y-3">
          {payments.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-[#080e1a] px-4 py-6 text-center text-sm text-zinc-500">
              Hələ ödəniş qeydi yoxdur.
            </div>
          ) : (
            payments.map((payment: any) => (
              <div
                key={payment.id}
                className="rounded-xl border border-white/5 bg-[#080e1a] px-4 py-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">
                      {payment.amount} {payment.currency}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {payment.created_at
                        ? new Date(payment.created_at).toLocaleString('az-AZ')
                        : 'Tarix yoxdur'}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      payment.status === 'completed'
                        ? 'bg-[#00e5a0]/10 text-[#00e5a0] border border-[#00e5a0]/20'
                        : payment.status === 'failed'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }`}
                  >
                    {payment.status === 'completed'
                      ? 'Uğurlu'
                      : payment.status === 'failed'
                      ? 'Uğursuz'
                      : 'Gözləmədə'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
