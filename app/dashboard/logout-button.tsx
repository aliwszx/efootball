'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-3 font-medium text-red-200 transition hover:bg-red-500/20"
    >
      Logout
    </button>
  )
}