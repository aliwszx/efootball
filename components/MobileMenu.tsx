'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type MobileMenuProps = {
  isLoggedIn: boolean
}

export default function MobileMenu({ isLoggedIn }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white"
        aria-label="Menu"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {open && (
        <div className="absolute left-4 right-4 top-[72px] z-50 rounded-2xl border border-white/10 bg-[#0b1020]/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-3 text-sm text-zinc-200">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2 transition hover:bg-white/5"
            >
              Ana səhifə
            </Link>

            <Link
              href="/tournaments"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2 transition hover:bg-white/5"
            >
              Turnirlər
            </Link>

            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2 transition hover:bg-white/5"
            >
              Dashboard
            </Link>

            {!isLoggedIn ? (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center"
                >
                  Daxil ol
                </Link>

                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3 text-center font-medium text-black"
                >
                  Qeydiyyat
                </Link>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-red-200"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}