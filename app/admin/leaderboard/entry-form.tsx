'use client'

import { useActionState } from 'react'
import { upsertLeaderboardEntry, type UpsertLeaderboardState } from './actions'

type EntryFormProps = {
  entryId?: string
  userId: string
  tournamentId: string
  wins?: number
  draws?: number
  playoffBonus?: number
  finalBonus?: number
}

const initialState: UpsertLeaderboardState = {}

export default function EntryForm({
  entryId,
  userId,
  tournamentId,
  wins = 0,
  draws = 0,
  playoffBonus = 0,
  finalBonus = 0,
}: EntryFormProps) {
  const [state, formAction, pending] = useActionState(upsertLeaderboardEntry, initialState)

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-[#C50337]/10 bg-[#02060E]/60 p-4">
      <input type="hidden" name="entry_id" value={entryId || ''} />
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="tournament_id" value={tournamentId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-zinc-300">Qələbə</label>
          <input
            name="wins"
            type="number"
            min="0"
            defaultValue={wins}
            className="w-full rounded-xl border border-[#C50337]/15 bg-[#C50337]/5 px-3 py-2 text-white outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-300">Bərabərlik</label>
          <input
            name="draws"
            type="number"
            min="0"
            defaultValue={draws}
            className="w-full rounded-xl border border-[#C50337]/15 bg-[#C50337]/5 px-3 py-2 text-white outline-none"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          name="playoff_qualified"
          type="checkbox"
          defaultChecked={playoffBonus === 2}
        />
        Playoff-a yüksəlib
      </label>

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          name="reached_final"
          type="checkbox"
          defaultChecked={finalBonus === 4}
        />
        Finala qalıb
      </label>

      {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
      {state?.success && <p className="text-sm text-[#ff4d6d]">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-gradient-to-r from-[#C50337] to-[#8B0224] px-4 py-2 font-semibold text-white transition hover:scale-[1.01] disabled:opacity-70"
      >
        {pending ? 'Yenilənir...' : 'Yadda saxla'}
      </button>
    </form>
  )
}
