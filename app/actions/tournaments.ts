'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function createTournament(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new Error('Bu emeliyyat ucun icazen yoxdur')
  }

  const title = String(formData.get('title') || '').trim()
  const platform = String(formData.get('platform') || '').trim()
  const format = String(formData.get('format') || '1v1').trim()
  const entry_fee = Number(formData.get('entry_fee') || 0)
  const prize_amount = Number(formData.get('prize_amount') || 0)
  const max_players = Number(formData.get('max_players') || 0)
  const registration_deadline = String(formData.get('registration_deadline') || '')
  const start_time = String(formData.get('start_time') || '')
  const description = String(formData.get('description') || '').trim()
  const rules = String(formData.get('rules') || '').trim()
  const status = String(formData.get('status') || 'draft').trim()

  if (!title || !platform || !registration_deadline || !start_time || !max_players) {
    throw new Error('Butun vacib saheleri doldur')
  }

  const slug = slugify(title)

  const { error } = await supabase.from('tournaments').insert({
    title,
    slug,
    game: 'eFootball',
    platform,
    format,
    entry_fee,
    prize_amount,
    max_players,
    registration_deadline,
    start_time,
    description,
    rules,
    status,
    created_by: user.id,
  })

  if (error) {
    if (error.message.toLowerCase().includes('duplicate')) {
      throw new Error('Bu adda slug artiq movcuddur, basligi deyis')
    }
    throw new Error(error.message)
  }

  redirect('/tournaments')
}

export async function joinTournament(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const tournamentId = String(formData.get('tournament_id') || '')
  const tournamentSlug = String(formData.get('tournament_slug') || '')

  if (!tournamentId || !tournamentSlug) {
    throw new Error('Turnir melumati tapilmadi')
  }

  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('id, slug, title, status, max_players, registration_deadline, entry_fee')
    .eq('id', tournamentId)
    .single()

  if (tournamentError || !tournament) {
    throw new Error('Turnir tapilmadi')
  }

  if (tournament.status !== 'open') {
    throw new Error('Bu turnire hazirda qatilmaq olmur')
  }

  const now = new Date()
  const deadline = new Date(tournament.registration_deadline)

  if (deadline < now) {
    throw new Error('Qeydiyyat muddeti bitib')
  }

  const { count } = await supabase
    .from('tournament_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournament.id)
    .eq('registration_status', 'confirmed')

  if ((count || 0) >= tournament.max_players) {
    throw new Error('Turnirde yer qalmayib')
  }

  const { data: existing } = await supabase
    .from('tournament_registrations')
    .select('id, registration_status')
    .eq('tournament_id', tournament.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing && existing.registration_status !== 'cancelled') {
    throw new Error('Sen artiq bu turnire qosulmusan')
  }

  const { data: registration, error: registrationError } = await supabase
    .from('tournament_registrations')
    .insert({
      tournament_id: tournament.id,
      user_id: user.id,
      payment_status: 'pending',
      registration_status: 'pending',
    })
    .select('id')
    .single()

  if (registrationError || !registration) {
    throw new Error(registrationError?.message || 'Registration yaradilarken xeta bas verdi')
  }

  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      user_id: user.id,
      tournament_id: tournament.id,
      registration_id: registration.id,
      provider: 'manual',
      amount: tournament.entry_fee,
      currency: 'AZN',
      status: 'pending',
    })

  if (paymentError) {
    throw new Error(paymentError.message)
  }

  // Hələlik mock payment success
  const { error: paymentUpdateError } = await supabase
    .from('payments')
    .update({
      status: 'paid',
      provider_payment_id: `mock_${crypto.randomUUID()}`,
    })
    .eq('registration_id', registration.id)

  if (paymentUpdateError) {
    throw new Error(paymentUpdateError.message)
  }

  const { error: registrationUpdateError } = await supabase
    .from('tournament_registrations')
    .update({
      payment_status: 'paid',
      registration_status: 'confirmed',
    })
    .eq('id', registration.id)

  if (registrationUpdateError) {
    throw new Error(registrationUpdateError.message)
  }

  redirect(`/tournaments/${tournamentSlug}`)
}
export async function setFeaturedTournament(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new Error('Bu əməliyyat üçün icazən yoxdur')
  }

  const tournamentId = String(formData.get('tournament_id') || '')

  if (!tournamentId) {
    throw new Error('Turnir ID tapılmadı')
  }

  const { error: resetError } = await supabase
    .from('tournaments')
    .update({ is_featured: false })
    .eq('is_featured', true)

  if (resetError) {
    throw new Error(resetError.message)
  }

  const { error: setError } = await supabase
    .from('tournaments')
    .update({ is_featured: true })
    .eq('id', tournamentId)

  if (setError) {
    throw new Error(setError.message)
  }

  revalidatePath('/')
  revalidatePath('/tournaments')
  revalidatePath('/admin/tournaments')
}