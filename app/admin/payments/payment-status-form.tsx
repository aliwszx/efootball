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
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="payment_id" value={paymentId} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          name="status"
          defaultValue={currentStatus || 'pending'}
          className="rounded-xl border border-[#C50337]/15 bg-[#C50337]/5 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="pending">pending</option>
          <option value="completed">completed</option>
          <option value="failed">failed</option>
        </select>

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-gradient-to-r from-[#C50337] to-[#8B0224] px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? 'Yenilənir...' : 'Yadda saxla'}
        </button>
      </div>

      {state?.error && <p className="text-xs text-red-300">{state.error}</p>}
      {state?.success && <p className="text-xs text-[#ff4d6d]">{state.success}</p>}
    </form>
  )
}
