'use client'

import { useActionState } from 'react'
import { endTournament, type EndTournamentState } from '@/app/actions/tournaments'

const initialState: EndTournamentState = {}

export default function EndTournamentButton({ tournamentId }: { tournamentId: string }) {
  const [state, formAction, pending] = useActionState(endTournament, initialState)

  return (
    <div className="flex flex-col gap-1">
      <form action={formAction}>
        <input type="hidden" name="tournament_id" value={tournamentId} />
        <button
          type="submit"
          disabled={pending}
          onClick={(e) => {
            if (!confirm('Turniri bitirmək istədiyinizə əminsiniz?')) e.preventDefault()
          }}
          className="rounded-xl border border-zinc-500/25 bg-zinc-500/10 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-400/40 hover:bg-zinc-500/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Bitirilir...' : '■ Bitir'}
        </button>
      </form>
      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-400">{state.success}</p>}
    </div>
  )
}
