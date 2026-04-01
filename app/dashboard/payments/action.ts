'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type UpdatePaymentStatusState = {
  error?: string
  success?: string
}

const ALLOWED_STATUSES = ['pending', 'completed', 'failed'] as const

export async function updatePaymentStatus(
  _prevState: UpdatePaymentStatusState,
  formData: FormData
): Promise<UpdatePaymentStatusState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Əvvəlcə daxil ol.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Bu əməliyyat üçün icazən yoxdur.' }
  }

  const paymentId = String(formData.get('payment_id') || '')
  const status = String(formData.get('status') || '')

  if (!paymentId) {
    return { error: 'Payment ID tapılmadı.' }
  }

  if (!ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
    return { error: 'Yanlış status seçildi.' }
  }

  const { error } = await supabase
    .from('payments')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId)

  if (error) {
    return { error: 'Payment status yenilənərkən xəta baş verdi.' }
  }

  revalidatePath('/admin/payments')
  revalidatePath('/profile')

  return { success: 'Payment status yeniləndi.' }
}
