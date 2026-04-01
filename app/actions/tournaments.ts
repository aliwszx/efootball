export async function joinTournament(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const tournamentId = String(formData.get('tournament_id') || '').trim()
  const tournamentSlug = String(formData.get('tournament_slug') || '').trim()

  if (!tournamentId || !tournamentSlug) {
    throw new Error('DEBUG: missing tournament data')
  }

  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('id, slug, title, status, max_players, registration_deadline, entry_fee')
    .eq('id', tournamentId)
    .single()

  if (tournamentError || !tournament) {
    throw new Error(`DEBUG tournament error: ${tournamentError?.message || 'not found'}`)
  }

  if (tournament.status !== 'open') {
    throw new Error(`DEBUG closed: status=${tournament.status}`)
  }

  const now = new Date()
  const deadline = new Date(tournament.registration_deadline)

  if (deadline < now) {
    throw new Error('DEBUG deadline passed')
  }

  const { count, error: countError } = await supabase
    .from('tournament_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournament.id)
    .eq('registration_status', 'confirmed')

  if (countError) {
    throw new Error(`DEBUG count error: ${countError.message}`)
  }

  if ((count || 0) >= tournament.max_players) {
    throw new Error('DEBUG full')
  }

  const { data: existing, error: existingError } = await supabase
    .from('tournament_registrations')
    .select('id, registration_status')
    .eq('tournament_id', tournament.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingError) {
    throw new Error(`DEBUG existing error: ${existingError.message}`)
  }

  if (existing && existing.registration_status !== 'cancelled') {
    throw new Error(
      `DEBUG already joined: id=${existing.id}, status=${existing.registration_status}`
    )
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
    throw new Error(
      `DEBUG registration insert error: ${registrationError?.message || 'unknown'}`
    )
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
    throw new Error(`DEBUG payment insert error: ${paymentError.message}`)
  }

  redirect(`/tournaments/${tournamentSlug}?success=joined_pending`)
}
