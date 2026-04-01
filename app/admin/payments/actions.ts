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
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Əvvəlcə daxil ol.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return { error: 'Admin icazəsi yoxlanılmadı.' }
  }

  if (!profile || profile.role !== 'admin') {
    return { error: 'Bu əməliyyat üçün icazən yoxdur.' }
  }

  const paymentId = String(formData.get('payment_id') || '').trim()
  const status = String(formData.get('status') || '').trim() as
    | 'pending'
    | 'completed'
    | 'failed'

  if (!paymentId) {
    return { error: 'Payment ID tapılmadı.' }
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    return { error: 'Yanlış status seçildi.' }
  }

  const { data: payment, error: paymentFetchError } = await supabase
    .from('payments')
    .select('id, registration_id, user_id, tournament_id, status')
    .eq('id', paymentId)
    .maybeSingle()

  if (paymentFetchError || !payment) {
    return { error: 'Payment tapılmadı.' }
  }

  const { error: updatePaymentError } = await supabase
    .from('payments')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId)

  if (updatePaymentError) {
    return { error: `Payment status yazılmadı: ${updatePaymentError.message}` }
  }

  if (payment.registration_id) {
    let registrationStatus = 'pending'

    if (status === 'completed') {
      registrationStatus = 'approved'
    } else if (status === 'failed') {
      registrationStatus = 'rejected'
    }

    const { error: registrationUpdateError } = await supabase
      .from('tournament_registrations')
      .update({
        status: registrationStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.registration_id)

    if (registrationUpdateError) {
      return {
        error: `Payment yeniləndi, amma qeydiyyat statusu yenilənmədi: ${registrationUpdateError.message}`,
      }
    }
  }

  revalidatePath('/admin/payments')
  revalidatePath('/admin/registrations')
  revalidatePath('/profile')

  return { success: 'Payment status uğurla yeniləndi.' }
}
