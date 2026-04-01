export function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function isValidUsername(value: string) {
  return /^[a-z0-9_]{3,20}$/.test(value)
}

export function getUsernameError(value: string) {
  if (!value) return 'Username daxil etmək vacibdir.'
  if (value.length < 3) return 'Username ən azı 3 simvol olmalıdır.'
  if (value.length > 20) return 'Username ən çox 20 simvol olmalıdır.'
  if (!/^[a-z0-9_]+$/.test(value)) {
    return 'Username yalnız kiçik hərf, rəqəm və underscore (_) ola bilər.'
  }

  return ''
}

export async function generateUniqueUsername(
  supabase: {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{ data: { id: string } | null }>
        }
      }
    }
  },
  preferredUsername: string,
  fallbackSeed: string
) {
  const normalizedBase = normalizeUsername(preferredUsername) || `user_${fallbackSeed}`
  const base = normalizedBase.slice(0, 20)

  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? base : `${base.slice(0, Math.max(1, 20 - String(i).length - 1))}_${i}`

    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', candidate)
      .maybeSingle()

    if (!data) {
      return candidate
    }
  }

  return `user_${fallbackSeed}`.slice(0, 20)
}
