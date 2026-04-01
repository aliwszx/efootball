export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
}

export function getUsernameError(username: string) {
  if (!username) return 'Username boş ola bilməz.'
  if (username.length < 3) return 'Username minimum 3 simvol olmalıdır.'
  if (username.length > 20) return 'Username maksimum 20 simvol olmalıdır.'
  if (!/^[a-z0-9_]+$/.test(username)) {
    return 'Username yalnız kiçik hərf, rəqəm və underscore (_) ola bilər.'
  }
  return null
}

export async function generateUniqueUsername(
  supabase: any,
  preferredUsername: string,
  fallbackSeed = 'player'
) {
  const normalizedPreferred = normalizeUsername(preferredUsername)
  const preferred =
    normalizedPreferred || `player_${normalizeUsername(fallbackSeed).slice(0, 8) || 'user'}`

  let candidate = preferred
  let counter = 0

  while (counter < 50) {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', candidate)
      .maybeSingle()

    if (!data) {
      return candidate
    }

    counter += 1
    candidate = `${preferred}_${counter}`
  }

  return `player_${Date.now().toString().slice(-6)}`
}