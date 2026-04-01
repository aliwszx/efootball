'use client'

import { useActionState } from 'react'
import { updatePaymentStatus, type UpdatePaymentStatusState } from './actions'

type PaymentStatusFormProps = {
  paymentId: string
  currentStatus: string
}

const initialState: UpdatePaymentStatusState = {}

export default function PaymentStatusForm({
  paymentId,
  currentStatus,
}: PaymentStatusFormProps) {
  const [state, formAction, pending] = useActionState(updatePaymentStatus, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input type="hidden" name="payment_id" value={paymentId} />

      <select
        name="status"
        defaultValue={currentStatus || 'pending'}
        className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
      >
        <option value="pending">pending</option>
        <option value="completed">completed</option>
        <option value="failed">failed</option>
      </select>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? 'Yenilənir...' : 'Yadda saxla'}
      </button>

      {state?.error && <p className="text-xs text-red-300">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-300">{state.success}</p>}
    </form>
  )
}
