'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function NavbarLogoutButton() {
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
      className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-red-200 transition hover:bg-red-500/20"
    >
      Logout
    </button>
  )
}