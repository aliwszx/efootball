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

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single()

  if (!tournament) {
    throw new Error('Turnir tapilmadi')
  }

  // 1️⃣ registration yarat
  const { data: registration, error: regError } = await supabase
    .from('tournament_registrations')
    .insert({
      tournament_id: tournament.id,
      user_id: user.id,
      payment_status: 'pending',
      registration_status: 'pending',
    })
    .select('id')
    .single()

  if (regError || !registration) {
    throw new Error(regError?.message)
  }

  // 2️⃣ payment yarat
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

  // ❌ BURDA STOP — heç nə update ETMƏ

  redirect(`/tournaments/${tournamentSlug}`)
}
