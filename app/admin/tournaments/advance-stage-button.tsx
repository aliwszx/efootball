'use client'

import { useActionState } from 'react'
import { advanceToNextStage } from '@/app/actions/tournaments'

const STAGE_LABELS: Record<string, string> = {
  league:       'Liqa bitti → Növbəti mərhələyə keç',
  playoff:      'Play-off bitti → 1/8 Finala keç',
  round_of_16:  '1/8 Final bitti → Çərək Finala keç',
  quarterfinal: 'Çərək Final bitti → Yarımfinala keç',
  semifinal:    'Yarımfinal bitti → Finala keç',
}

export default function AdvanceStageButton({
  tournamentId,
  currentStage,
}: {
  tournamentId: string
  currentStage: string
}) {
  const [state, action, pending] = useActionState(advanceToNextStage, {})

  const label = STAGE_LABELS[currentStage]
  if (!label) return null

  return (
    <div className="space-y-2">
      <form action={action}>
        <input type="hidden" name="tournament_id" value={tournamentId} />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
        >
          {pending ? 'Hazırlanır...' : label}
        </button>
      </form>
      {state.success && (
        <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-400">
          {state.success}
        </p>
      )}
      {state.error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-400">
          {state.error}
        </p>
      )}
    </div>
  )
}
