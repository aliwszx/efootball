'use client'

import { useActionState } from 'react'
import { startTournament, type StartTournamentState } from '@/app/actions/tournaments'

const initialState: StartTournamentState = {}

export default function StartTournamentButton({ tournamentId }: { tournamentId: string }) {
  const [state, formAction, pending] = useActionState(startTournament, initialState)

  return (
    <div className="flex flex-col gap-1">
      <form action={formAction}>
        <input type="hidden" name="tournament_id" value={tournamentId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:border-emerald-500/40 hover:bg-emerald-500/15 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Başladılır...' : '▶ Başlat'}
        </button>
      </form>
      {state?.error && (
        <p className="text-xs text-red-400">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-xs text-emerald-400">{state.success}</p>
      )}
    </div>
  )
}
