'use client'

import { useActionState } from 'react'
import { adminResolveLeagueDispute, type MatchActionState } from '@/app/actions/matches'

type ResolveDisputeFormProps = {
  matchId: string
}

const initialState: MatchActionState = {}

export default function ResolveDisputeForm({ matchId }: ResolveDisputeFormProps) {
  const [state, formAction, pending] = useActionState(adminResolveLeagueDispute, initialState)

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-[#C50337]/10 bg-[#02060E]/60 p-4">
      <input type="hidden" name="match_id" value={matchId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`final_home_score_${matchId}`} className="mb-2 block text-sm text-zinc-300">
            Final home score
          </label>
          <input
            id={`final_home_score_${matchId}`}
            name="final_home_score"
            type="number"
            min="0"
            required
            className="w-full rounded-xl border border-[#C50337]/15 bg-[#C50337]/5 px-3 py-2 text-white outline-none"
          />
        </div>

        <div>
          <label htmlFor={`final_away_score_${matchId}`} className="mb-2 block text-sm text-zinc-300">
            Final away score
          </label>
          <input
            id={`final_away_score_${matchId}`}
            name="final_away_score"
            type="number"
            min="0"
            required
            className="w-full rounded-xl border border-[#C50337]/15 bg-[#C50337]/5 px-3 py-2 text-white outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor={`note_${matchId}`} className="mb-2 block text-sm text-zinc-300">
          Admin qeyd
        </label>
        <textarea
          id={`note_${matchId}`}
          name="note"
          rows={3}
          className="w-full rounded-xl border border-[#C50337]/15 bg-[#C50337]/5 px-3 py-2 text-white outline-none"
        />
      </div>

      {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
      {state?.success && <p className="text-sm text-[#ff4d6d]">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-gradient-to-r from-[#C50337] to-[#8B0224] px-4 py-2 font-semibold text-white transition hover:scale-[1.01] disabled:opacity-70"
      >
        {pending ? 'Həll olunur...' : 'Mübahisəni həll et'}
      </button>
    </form>
  )
}
