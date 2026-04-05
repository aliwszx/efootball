'use client'

import { useActionState } from 'react'
import { submitLeagueMatchResult, type MatchActionState } from '@/app/actions/matches'

type SubmissionFormProps = {
  matchId: string
}

const initialState: MatchActionState = {}

export default function SubmissionForm({ matchId }: SubmissionFormProps) {
  const [state, formAction, pending] = useActionState(submitLeagueMatchResult, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="match_id" value={matchId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="reported_home_score" className="mb-2 block text-sm text-zinc-300">
            Home score
          </label>
          <input
            id="reported_home_score"
            name="reported_home_score"
            type="number"
            min="0"
            required
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
          />
        </div>

        <div>
          <label htmlFor="reported_away_score" className="mb-2 block text-sm text-zinc-300">
            Away score
          </label>
          <input
            id="reported_away_score"
            name="reported_away_score"
            type="number"
            min="0"
            required
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="screenshot" className="mb-2 block text-sm text-zinc-300">
          Screenshot
        </label>
        <input
          id="screenshot"
          name="screenshot"
          type="file"
          accept="image/*"
          required
          className="block w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white"
        />
      </div>

      <div>
        <label htmlFor="comment" className="mb-2 block text-sm text-zinc-300">
          Comment
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={4}
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
          placeholder="İstəyə bağlı qeyd"
        />
      </div>

      {state?.error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-200">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="rounded-2xl border border-[#C50337]/20 bg-[#C50337]/10 p-4 text-[#ff6b81]">
          {state.success}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-2xl bg-gradient-to-r from-[#C50337] to-[#8B0224] px-5 py-3 font-semibold text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? 'Göndərilir...' : 'Nəticəni göndər'}
      </button>
    </form>
  )
}
