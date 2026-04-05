import { createClient } from '@/lib/supabase/server'
import { generateUniqueUsername, normalizeUsername } from '@/lib/usernames'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile) {
        const requestedUsername = normalizeUsername(
          String(user.user_metadata?.username || user.email?.split('@')[0] || '')
        )

        const username = await generateUniqueUsername(
          supabase,
          requestedUsername,
          user.id.slice(0, 8)
        )

        // full_name register zamanı user_metadata-ya yazılır
        const fullName = String(user.user_metadata?.full_name || '').trim()

        await supabase.from('profiles').insert({
          id: user.id,
          username,
          full_name: fullName,
        })
      }
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
